import http from "node:http";

const port = Number(process.env.PORT || 8080);
const apiKey = process.env.ROUTES_API_KEY;
const maxBodyBytes = 2048;
const cambridge = { latitude: 52.2053, longitude: 0.1218 };

// The app can request directions only to centres verified by Wastewise.
const destinations = {
  milton: { latitude: 52.2588, longitude: 0.1767 },
  thriplow: { latitude: 52.0601, longitude: 0.1158 },
  witchford: { latitude: 52.3936, longitude: 0.1832 },
};

const recentRequests = new Map();

function send(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(JSON.stringify(body));
}

function isCoordinate(value) {
  return (
    value &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.latitude) <= 90 &&
    Math.abs(value.longitude) <= 180
  );
}

function distanceKm(a, b) {
  const radians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const term =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(term), Math.sqrt(1 - term));
}

function allowRequest(request) {
  const forwarded = request.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || request.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
  const now = Date.now();
  const timestamps = (recentRequests.get(ip) || []).filter((time) => now - time < 60_000);
  if (timestamps.length >= 30) return false;
  timestamps.push(now);
  recentRequests.set(ip, timestamps);
  return true;
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > maxBodyBytes) throw new Error("Request is too large.");
  }
  return JSON.parse(body);
}

async function handleRoute(request, response) {
  if (!apiKey) return send(response, 503, { error: "Directions are not configured." });
  if (!allowRequest(request)) return send(response, 429, { error: "Too many route requests. Try again shortly." });

  let body;
  try {
    body = await readJson(request);
  } catch {
    return send(response, 400, { error: "Invalid route request." });
  }

  const destination = destinations[body.destinationId];
  if (!destination || !isCoordinate(body.origin) || distanceKm(cambridge, body.origin) > 60) {
    return send(response, 400, { error: "This route request is not supported." });
  }

  try {
    const upstream = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.geoJsonLinestring",
      },
      body: JSON.stringify({
        origin: { location: { latLng: body.origin } },
        destination: { location: { latLng: destination } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        languageCode: "en-GB",
        polylineEncoding: "GEO_JSON_LINESTRING",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) return send(response, 502, { error: "Google could not calculate a route." });

    const route = (await upstream.json()).routes?.[0];
    const coordinates = route?.polyline?.geoJsonLinestring?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return send(response, 404, { error: "No driving route was found." });
    }

    return send(response, 200, {
      points: coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
      distanceMetres: route.distanceMeters,
      seconds: Number.parseFloat(route.duration),
    });
  } catch {
    return send(response, 502, { error: "Directions are temporarily unavailable." });
  }
}

http
  .createServer((request, response) => {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return response.end();
    }
    if (request.method === "GET" && request.url === "/health") {
      return send(response, 200, { status: "ok" });
    }
    if (request.method === "POST" && request.url === "/routes") {
      void handleRoute(request, response);
      return;
    }
    return send(response, 404, { error: "Not found." });
  })
  .listen(port, () => console.log(`Wastewise routing service listening on ${port}`));

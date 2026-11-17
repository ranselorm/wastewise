import { cambridge, distanceKm, locations } from '../../src/features/recycling/locations';
import { travelModes } from '../../src/features/recycling/travelModes';

type Options = {
  apiKey: string;
  // Supply your server's authentication and per-user rate limit.
  authorize: (request: Request) => Promise<boolean>;
};

export function createRouteHandler({ apiKey, authorize }: Options) {
  return async function handle(request: Request): Promise<Response> {
    if (request.method !== 'POST') return Response.json({}, { status: 405 });
    if (!await authorize(request)) return Response.json({}, { status: 403 });
    if (!apiKey) return Response.json({}, { status: 503 });

    let body;
    try {
      const raw = await request.text();
      if (raw.length > 2048) return Response.json({}, { status: 413 });
      body = JSON.parse(raw);
    } catch {
      return Response.json({}, { status: 400 });
    }
    const mode = body?.mode === undefined ? 'DRIVE' : body.mode;
    if (!travelModes.some(option => option.mode === mode)) {
      return Response.json({}, { status: 400 });
    }

    const origin = body?.origin;
    const site = locations.find(location => location.id === body?.destinationId);
    if (!site || !Number.isFinite(origin?.latitude) || !Number.isFinite(origin?.longitude) ||
        Math.abs(origin.latitude) > 90 || Math.abs(origin.longitude) > 180 ||
        distanceKm(cambridge, origin) > 60) return Response.json({}, { status: 400 });

    try {
      const upstream = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.geoJsonLinestring,routes.legs.steps.navigationInstruction.instructions',
        },
        body: JSON.stringify({
          origin: { location: { latLng: origin } },
          destination: { address: site.name + ', ' + site.address + ', UK' },
          travelMode: mode,
          ...(mode === 'DRIVE' ? { routingPreference: 'TRAFFIC_AWARE' } : {}),
          languageCode: 'en-GB',
          polylineEncoding: 'GEO_JSON_LINESTRING',
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!upstream.ok) return Response.json({}, { status: 502 });
      const result = (await upstream.json()).routes?.[0];
      const coordinates = result?.polyline?.geoJsonLinestring?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return Response.json({}, { status: 404 });
      }
      return Response.json({
        mode,
        points: coordinates.map(([longitude, latitude]: [number, number]) => ({ latitude, longitude })),
        steps: result.legs.flatMap((leg: { steps: { navigationInstruction?: { instructions?: string } }[] }) =>
          leg.steps.flatMap(step => step.navigationInstruction?.instructions ?? [])),
        distanceMetres: result.distanceMeters,
        seconds: Number.parseFloat(result.duration),
      }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return Response.json({}, { status: 502 });
    }
  };
}

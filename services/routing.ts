export type RoutePoint = { latitude: number; longitude: number };

export type RoutePreview = {
  points: RoutePoint[];
  distanceMetres: number;
  seconds: number;
};

type RouteResponse = RoutePreview | { error: string };

const routeServiceUrl = process.env.EXPO_PUBLIC_ROUTE_SERVICE_URL?.replace(/\/$/, "");

/**
 * Requests an in-app route from the protected route service. The Google Routes
 * key never appears in the mobile application.
 */
export async function getRoutePreview(
  origin: RoutePoint,
  destinationId: string,
): Promise<RoutePreview> {
  if (!routeServiceUrl) {
    throw new Error("In-app directions are not configured yet.");
  }

  const response = await fetch(`${routeServiceUrl}/routes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destinationId }),
  });

  const result = (await response.json().catch(() => null)) as RouteResponse | null;
  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result ? result.error : "Directions are unavailable.",
    );
  }

  if (
    !Array.isArray(result.points) ||
    result.points.length < 2 ||
    !Number.isFinite(result.distanceMetres) ||
    !Number.isFinite(result.seconds)
  ) {
    throw new Error("The route service returned an invalid route.");
  }

  return result;
}

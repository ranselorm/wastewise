import AsyncStorage from "@react-native-async-storage/async-storage";

const CENTRES_KEY = "@wastewise_offline_recycling_centres";
const LOCATION_KEY = "@wastewise_last_known_location";

export type Coordinates = { latitude: number; longitude: number };

export type RecyclingCentre = Coordinates & {
  id: string;
  name: string;
  area: string;
};

// These are the verified Cambridge-area centres already shown in the finder.
// Keeping a local copy means the finder can still list them without internet.
export const defaultRecyclingCentres: readonly RecyclingCentre[] = [
  {
    id: "milton",
    name: "Milton Recycling Centre",
    area: "Milton, Cambridge",
    latitude: 52.2588,
    longitude: 0.1767,
  },
  {
    id: "thriplow",
    name: "Thriplow Recycling Centre",
    area: "Near Royston",
    latitude: 52.0601,
    longitude: 0.1158,
  },
  {
    id: "witchford",
    name: "Witchford Recycling Centre",
    area: "Near Ely",
    latitude: 52.3936,
    longitude: 0.1832,
  },
];

function validCentre(value: unknown): value is RecyclingCentre {
  if (!value || typeof value !== "object") return false;
  const centre = value as Partial<RecyclingCentre>;
  return (
    typeof centre.id === "string" &&
    typeof centre.name === "string" &&
    typeof centre.area === "string" &&
    Number.isFinite(centre.latitude) &&
    Number.isFinite(centre.longitude)
  );
}

export async function loadOfflineCentres(): Promise<RecyclingCentre[]> {
  try {
    const saved = await AsyncStorage.getItem(CENTRES_KEY);
    const parsed = saved ? (JSON.parse(saved) as unknown) : null;
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(validCentre)) {
      return parsed;
    }
  } catch {
    // A local cache problem should never stop the finder opening.
  }

  const centres = [...defaultRecyclingCentres];
  try {
    await AsyncStorage.setItem(CENTRES_KEY, JSON.stringify(centres));
  } catch {
    // The in-memory list still works if storage is unavailable.
  }
  return centres;
}

export async function saveLastKnownLocation(location: Coordinates): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch {
    // Location storage is optional.
  }
}

export async function loadLastKnownLocation(): Promise<Coordinates | null> {
  try {
    const saved = await AsyncStorage.getItem(LOCATION_KEY);
    const parsed = saved ? (JSON.parse(saved) as unknown) : null;
    if (
      parsed &&
      typeof parsed === "object" &&
      Number.isFinite((parsed as Coordinates).latitude) &&
      Number.isFinite((parsed as Coordinates).longitude)
    ) {
      return parsed as Coordinates;
    }
  } catch {
    // Fall back to no saved location.
  }
  return null;
}

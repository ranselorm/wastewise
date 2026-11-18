import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@wastewise_scan_history";

export type ScanHistoryItem = {
  id: string;
  category: string;
  confidence: number | null;
  disposalGuidance: string;
  createdAt: string;
  imageUri?: string | null;
};

type NewScanHistoryItem = Omit<ScanHistoryItem, "id" | "createdAt">;

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  try {
    const storedHistory = await AsyncStorage.getItem(STORAGE_KEY);

    if (!storedHistory) {
      return [];
    }

    const history = JSON.parse(storedHistory) as ScanHistoryItem[];

    return history.sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    );
  } catch (error) {
    console.error("Could not load scan history:", error);
    return [];
  }
}

export async function saveScan(
  scan: NewScanHistoryItem,
): Promise<ScanHistoryItem> {
  const existingHistory = await getScanHistory();

  const newScan: ScanHistoryItem = {
    ...scan,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  const updatedHistory = [newScan, ...existingHistory];

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

  return newScan;
}

export async function deleteScan(id: string): Promise<void> {
  const existingHistory = await getScanHistory();

  const updatedHistory = existingHistory.filter((scan) => scan.id !== id);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
}

export async function clearScanHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

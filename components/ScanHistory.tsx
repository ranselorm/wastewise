import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  clearScanHistory,
  deleteScan,
  getScanHistory,
  type ScanHistoryItem,
} from "../services/scanHistory";

type ScanHistoryProps = {
  onClose: () => void;
};

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ScanHistory({ onClose }: ScanHistoryProps) {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(
    null,
  );

  const loadHistory = async () => {
    setIsLoading(true);
    const savedHistory = await getScanHistory();
    setHistory(savedHistory);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const removeScan = (scan: ScanHistoryItem) => {
    Alert.alert(
      "Delete scan?",
      `Remove "${scan.category}" from your scan history?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteScan(scan.id);
            setHistory((currentHistory) =>
              currentHistory.filter((item) => item.id !== scan.id),
            );
            setSelectedScan(null);
          },
        },
      ],
    );
  };

  const removeAllScans = () => {
    Alert.alert(
      "Clear scan history?",
      "This permanently removes all saved scans from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: async () => {
            await clearScanHistory();
            setHistory([]);
            setSelectedScan(null);
          },
        },
      ],
    );
  };

  if (selectedScan) {
    return (
      <ScrollView className="flex-1 pt-5" showsVerticalScrollIndicator={false}>
        <View className="mb-5 flex-row items-center justify-between">
          <Pressable
            onPress={() => setSelectedScan(null)}
            accessibilityRole="button"
            accessibilityLabel="Back to scan history"
            className="h-11 w-11 items-center justify-center rounded-full bg-sage"
          >
            <Feather name="arrow-left" size={21} color="#244A3C" />
          </Pressable>

          <Text className="text-[16px] font-extrabold text-ink">
            Scan details
          </Text>

          <View className="h-11 w-11" />
        </View>

        {selectedScan.imageUri ? (
          <Image
            source={{ uri: selectedScan.imageUri }}
            className="mb-5 h-56 w-full rounded-[24px]"
            resizeMode="cover"
          />
        ) : null}

        <View className="rounded-[24px] border border-[#E2E9E1] bg-white p-5">
          <Text className="text-[11px] font-extrabold tracking-[1.2px] text-forest-muted">
            CLASSIFICATION
          </Text>
          <Text className="mt-2 text-[27px] font-extrabold text-ink">
            {selectedScan.category}
          </Text>

          {selectedScan.confidence !== null ? (
            <Text className="mt-2 text-sm font-semibold text-forest-soft">
              {Math.round(selectedScan.confidence * 100)}% confidence
            </Text>
          ) : null}

          <View className="my-5 h-px bg-[#E2E9E1]" />

          <Text className="text-[11px] font-extrabold tracking-[1.2px] text-forest-muted">
            DISPOSAL GUIDANCE
          </Text>
          <Text className="mt-2 text-[15px] leading-6 text-copy">
            {selectedScan.disposalGuidance}
          </Text>

          <Text className="mt-5 text-xs text-footer">
            Scanned {formatDate(selectedScan.createdAt)}
          </Text>
        </View>

        <Pressable
          onPress={() => removeScan(selectedScan)}
          accessibilityRole="button"
          className="mt-5 flex-row items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-4 active:opacity-70"
        >
          <Feather name="trash-2" size={18} color="#B42318" />
          <Text className="ml-2 font-extrabold text-red-700">
            Delete this scan
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 pt-5">
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">
            YOUR ACTIVITY
          </Text>
          <Text className="mt-2 text-[29px] font-extrabold tracking-tight text-ink">
            Scan history
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close scan history"
          className="h-11 w-11 items-center justify-center rounded-full bg-sage"
        >
          <Feather name="x" size={21} color="#244A3C" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#244A3C" />
        </View>
      ) : history.length === 0 ? (
        <View className="mt-10 items-center rounded-[24px] border border-[#E2E9E1] bg-white px-7 py-10">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-sage">
            <Feather name="clock" size={25} color="#244A3C" />
          </View>
          <Text className="mt-4 text-center text-[20px] font-extrabold text-ink">
            No scans yet
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-copy">
            Items you scan will be saved privately on this device.
          </Text>
        </View>
      ) : (
        <>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[11px] font-extrabold tracking-[1.2px] text-forest-muted">
              {history.length} SAVED {history.length === 1 ? "SCAN" : "SCANS"}
            </Text>

            <Pressable
              onPress={removeAllScans}
              accessibilityRole="button"
              accessibilityLabel="Clear all scan history"
            >
              <Text className="text-sm font-extrabold text-red-700">
                Clear all
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {history.map((scan) => (
              <Pressable
                key={scan.id}
                onPress={() => setSelectedScan(scan)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${scan.category} scan details`}
                className="mb-3 flex-row items-center rounded-[20px] border border-[#E2E9E1] bg-white p-4 active:bg-sage"
              >
                {scan.imageUri ? (
                  <Image
                    source={{ uri: scan.imageUri }}
                    className="h-14 w-14 rounded-[14px]"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-[14px] bg-sage">
                    <Feather name="camera" size={23} color="#244A3C" />
                  </View>
                )}

                <View className="ml-3 flex-1">
                  <Text className="text-[16px] font-extrabold text-ink">
                    {scan.category}
                  </Text>
                  <Text className="mt-1 text-sm text-copy">
                    {scan.confidence !== null
                      ? `${Math.round(scan.confidence * 100)}% confidence`
                      : "Saved scan"}
                  </Text>
                  <Text className="mt-1 text-xs text-footer">
                    {formatDate(scan.createdAt)}
                  </Text>
                </View>

                <Feather name="chevron-right" size={21} color="#627A6D" />
              </Pressable>
            ))}

            <View className="h-8" />
          </ScrollView>
        </>
      )}
    </View>
  );
}

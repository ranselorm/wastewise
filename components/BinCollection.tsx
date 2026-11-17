import Feather from "@expo/vector-icons/Feather";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  findBinAddresses,
  getBinCollections,
  loadBinCollectionSelection,
  saveBinCollectionSelection,
  type BinAddress,
  type BinCollection,
} from "../services/binCollection";
import { cancelBinReminders, scheduleBinReminders } from "../services/binReminders";
import AppText from "./AppText";

function binColour(binType: string) {
  const text = binType.toLowerCase();
  if (text.includes("blue") || text.includes("recycling")) return "#146CBB";
  if (text.includes("green") || text.includes("garden")) return "#4D7C2F";
  if (text.includes("food") || text.includes("caddy")) return "#B86635";
  return "#33403A";
}

export default function BinCollection({ onClose }: { onClose: () => void }) {
  const [postcode, setPostcode] = useState("");
  const [addresses, setAddresses] = useState<BinAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<BinAddress | null>(null);
  const [collections, setCollections] = useState<BinCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [shouldFocusResults, setShouldFocusResults] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const resultsTopRef = useRef(0);
  const hasStartedChoosingRef = useRef(false);

  useEffect(() => {
    void loadBinCollectionSelection().then((saved) => {
      if (!saved || hasStartedChoosingRef.current) return;
      setSelectedAddress(saved.address);
      setCollections(saved.collections);
      setMessage("Showing collection dates saved on this device.");
    });
  }, []);

  const lookupAddresses = async () => {
    hasStartedChoosingRef.current = true;
    setIsLoading(true);
    setMessage("");
    setAddresses([]);
    setSelectedAddress(null);
    setCollections([]);
    try {
      const results = await findBinAddresses(postcode);
      setAddresses(results);
      setMessage(results.length ? "Choose your address." : "No addresses found for that postcode.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Address lookup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollections = async (address = selectedAddress) => {
    if (!address) return;
    setIsLoading(true);
    setMessage("");
    try {
      const results = await getBinCollections(address.uprn);
      setCollections(results);
      await saveBinCollectionSelection(address, results);
      setMessage(results.length ? "Collection dates updated from the council calendar." : "No upcoming collections were returned.");
      setShouldFocusResults(results.length > 0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Collection lookup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectAddress = (address: BinAddress) => {
    setSelectedAddress(address);
    setAddresses([]);
    setCollections([]);
    setMessage("Loading collection dates for your address…");
    void loadCollections(address);
  };

  const toggleReminders = async (enabled: boolean) => {
    if (!enabled) {
      await cancelBinReminders();
      setRemindersEnabled(false);
      setMessage("Bin reminders turned off.");
      return;
    }
    if (!collections.length) {
      setMessage("Load collection dates before turning on reminders.");
      return;
    }
    try {
      const count = await scheduleBinReminders(collections);
      setRemindersEnabled(count > 0);
      setMessage(count ? `${count} evening-before reminders scheduled.` : "There are no future collection dates to remind you about.");
    } catch (error) {
      setRemindersEnabled(false);
      setMessage(error instanceof Error ? error.message : "Could not schedule reminders.");
    }
  };

  return (
    <View className="flex-1 pt-5">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <AppText className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">CAMBRIDGE BIN CALENDAR</AppText>
          <AppText className="mt-2 text-[29px] font-extrabold tracking-tight text-ink">Know which bin goes out</AppText>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back to home" className="h-11 w-11 items-center justify-center rounded-full bg-sage">
          <Feather name="x" size={21} color="#244A3C" />
        </Pressable>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerClassName="pb-7">
        <View className="rounded-[22px] bg-card p-5">
          <AppText className="text-base font-extrabold text-card-ink">Find your collection dates</AppText>
          <AppText className="mt-2 text-sm leading-5 text-card-copy">Enter your full Cambridge postcode, then select your address.</AppText>
          <TextInput
            value={postcode}
            onChangeText={(value) => setPostcode(value.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="For example, CB1 2AB"
            placeholderTextColor="#71857A"
            accessibilityLabel="Cambridge postcode"
            className="mt-4 rounded-[15px] border border-[#C9D5CA] bg-white px-4 py-3 text-base font-semibold text-ink"
          />
          <Pressable
            onPress={() => void lookupAddresses()}
            disabled={isLoading || !postcode.trim()}
            className="mt-3 flex-row items-center justify-center rounded-[16px] bg-ink py-3 active:opacity-85"
          >
            {isLoading ? <ActivityIndicator size="small" color="#B7D9A8" /> : <Feather name="search" size={18} color="#B7D9A8" />}
            <AppText className="text-[15px] font-extrabold text-white">{isLoading ? "  Checking…" : "  Find my address"}</AppText>
          </Pressable>
        </View>

        {message ? (
          <Text accessibilityLiveRegion="polite" className="mt-4 px-1 text-sm font-semibold leading-5 text-copy">{message}</Text>
        ) : null}

        {addresses.length > 0 && (
          <View className="mt-5">
            <AppText className="mb-2 text-[11px] font-extrabold tracking-[1.2px] text-forest-muted">SELECT YOUR ADDRESS</AppText>
            {addresses.map((address) => (
              <Pressable
                key={address.uprn}
                onPress={() => selectAddress(address)}
                className={`mb-3 rounded-[18px] border p-4 active:bg-sage ${selectedAddress?.uprn === address.uprn ? "border-[#244A3C] bg-sage" : "border-[#E2E9E1] bg-white"}`}
              >
                <Text className="text-[15px] font-extrabold text-ink">{address.address}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {selectedAddress && !collections.length && !addresses.length && (
          <View className="mt-5 rounded-[18px] border border-[#D8E6D7] bg-sage px-4 py-4">
            <View className="flex-row items-start justify-between">
              <View className="mr-3 flex-1">
                <AppText className="text-[11px] font-extrabold tracking-[1.2px] text-forest-muted">YOUR ADDRESS</AppText>
                <Text className="mt-1 text-[15px] font-extrabold text-ink">{selectedAddress.address}</Text>
              </View>
              {isLoading ? <ActivityIndicator size="small" color="#244A3C" /> : null}
            </View>
            <Pressable onPress={() => void lookupAddresses()} disabled={isLoading} className="mt-3 self-start active:opacity-70">
              <AppText className="text-sm font-extrabold text-forest">Change address</AppText>
            </Pressable>
          </View>
        )}

        {collections.length > 0 && (
          <View onLayout={(event) => {
            resultsTopRef.current = event.nativeEvent.layout.y;
            if (shouldFocusResults) {
              requestAnimationFrame(() => {
                scrollViewRef.current?.scrollTo({ y: Math.max(0, resultsTopRef.current - 16), animated: true });
              });
              setShouldFocusResults(false);
            }
          }}>
            <View className="mt-6 flex-row items-center justify-between">
              <View>
                <AppText className="text-[11px] font-extrabold tracking-[1.2px] text-forest-muted">UPCOMING COLLECTIONS</AppText>
                <Text className="mt-1 text-sm font-semibold text-copy">{selectedAddress?.address}</Text>
              </View>
              <Pressable onPress={() => void loadCollections()} disabled={isLoading} accessibilityRole="button" accessibilityLabel="Refresh collection dates" className="h-10 w-10 items-center justify-center rounded-full bg-sage active:opacity-70">
                {isLoading ? <ActivityIndicator size="small" color="#244A3C" /> : <Feather name="refresh-cw" size={18} color="#244A3C" />}
              </Pressable>
            </View>
            <View className="mt-3 overflow-hidden rounded-[20px] border border-[#E2E9E1] bg-white">
              {collections.map((collection, index) => (
                <View key={`${collection.date}-${collection.binType}-${index}`} className="flex-row items-center border-b border-[#EEF2EE] px-4 py-3 last:border-b-0">
                  <View style={{ backgroundColor: binColour(collection.binType) }} className="h-3 w-3 rounded-full" />
                  <View className="ml-3 flex-1">
                    <Text className="text-[15px] font-extrabold text-ink">{collection.binType}</Text>
                    <Text className="mt-1 text-sm text-copy">{collection.date}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View className="mt-5 flex-row items-center justify-between rounded-[20px] bg-sage px-4 py-4">
              <View className="mr-4 flex-1">
                <AppText className="text-[15px] font-extrabold text-forest">Evening-before reminders</AppText>
                <AppText className="mt-1 text-sm leading-5 text-copy">Get a reminder at 7:00 PM the night before collection.</AppText>
              </View>
              <Switch value={remindersEnabled} onValueChange={(enabled) => void toggleReminders(enabled)} trackColor={{ false: "#C9D5CA", true: "#244A3C" }} />
            </View>
          </View>
        )}

        <AppText className="mt-5 px-1 text-xs leading-4 text-footer">Collection dates come from Greater Cambridge’s bin calendar. Check the council service before relying on them.</AppText>
      </ScrollView>
    </View>
  );
}

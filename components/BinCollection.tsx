import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    void loadBinCollectionSelection().then((saved) => {
      if (!saved) return;
      setSelectedAddress(saved.address);
      setCollections(saved.collections);
      setMessage("Showing collection dates saved on this device.");
    });
  }, []);

  const lookupAddresses = async () => {
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

  const loadCollections = async () => {
    if (!selectedAddress) return;
    setIsLoading(true);
    setMessage("");
    try {
      const results = await getBinCollections(selectedAddress.uprn);
      setCollections(results);
      await saveBinCollectionSelection(selectedAddress, results);
      setMessage(results.length ? "Collection dates updated from the council calendar." : "No upcoming collections were returned.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Collection lookup failed.");
    } finally {
      setIsLoading(false);
    }
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
          <Text className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">CAMBRIDGE BIN CALENDAR</Text>
          <Text className="mt-2 text-[29px] font-extrabold tracking-tight text-ink">Know which bin goes out</Text>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back to home" className="h-11 w-11 items-center justify-center rounded-full bg-sage">
          <Feather name="x" size={21} color="#244A3C" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-7">
        <View className="rounded-[22px] bg-card p-5">
          <Text className="text-base font-extrabold text-card-ink">Find your collection dates</Text>
          <Text className="mt-2 text-sm leading-5 text-card-copy">Enter your full Cambridge postcode, then select your address.</Text>
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
            <Text className="text-[15px] font-extrabold text-white">{isLoading ? "  Checking…" : "  Find my address"}</Text>
          </Pressable>
        </View>

        {message ? (
          <Text accessibilityLiveRegion="polite" className="mt-4 px-1 text-sm font-semibold leading-5 text-copy">{message}</Text>
        ) : null}

        {addresses.length > 0 && (
          <View className="mt-5">
            <Text className="mb-2 text-[11px] font-extrabold tracking-[1.2px] text-forest-muted">SELECT YOUR ADDRESS</Text>
            {addresses.map((address) => (
              <Pressable
                key={address.uprn}
                onPress={() => {
                  setSelectedAddress(address);
                  setCollections([]);
                  setMessage("Address selected. Load its collection dates.");
                }}
                className={`mb-3 rounded-[18px] border p-4 active:bg-sage ${selectedAddress?.uprn === address.uprn ? "border-[#244A3C] bg-sage" : "border-[#E2E9E1] bg-white"}`}
              >
                <Text className="text-[15px] font-extrabold text-ink">{address.address}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {selectedAddress && (
          <Pressable onPress={() => void loadCollections()} disabled={isLoading} className="mt-2 flex-row items-center justify-center rounded-[18px] bg-forest py-4 active:opacity-85">
            <Feather name="calendar" size={19} color="#B7D9A8" />
            <Text className="text-base font-extrabold text-white">  Load collection dates</Text>
          </Pressable>
        )}

        {collections.length > 0 && (
          <>
            <View className="mt-6 flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-extrabold tracking-[1.2px] text-forest-muted">UPCOMING COLLECTIONS</Text>
                <Text className="mt-1 text-sm font-semibold text-copy">{selectedAddress?.address}</Text>
              </View>
              <Feather name="calendar" size={21} color="#244A3C" />
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
                <Text className="text-[15px] font-extrabold text-forest">Evening-before reminders</Text>
                <Text className="mt-1 text-sm leading-5 text-copy">Get a reminder at 7:00 PM the night before collection.</Text>
              </View>
              <Switch value={remindersEnabled} onValueChange={(enabled) => void toggleReminders(enabled)} trackColor={{ false: "#C9D5CA", true: "#244A3C" }} />
            </View>
          </>
        )}

        <Text className="mt-5 px-1 text-xs leading-4 text-footer">Collection dates come from Greater Cambridge’s bin calendar. Check the council service before relying on them.</Text>
      </ScrollView>
    </View>
  );
}

import "./global.css";

import { CameraView, CameraType, useCameraPermissions } from "expo-camera";

import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Pressable,
  Text,
  View,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Screen = "home" | "choose" | "analysing" | "result";

const exampleItems = [
  {
    name: "Plastic bottle",
    category: "Plastic recycling",
    action: "Empty it, give it a quick rinse, then place it in recycling.",
  },
  {
    name: "Aluminium can",
    category: "Metal recycling",
    action: "Empty it and place it in recycling.",
  },
  {
    name: "Battery",
    category: "Battery collection",
    action:
      "Do not put it in household recycling. Take it to a battery collection point.",
  },
] as const;

type Item = (typeof exampleItems)[number];

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [item, setItem] = useState<Item>(exampleItems[0]);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  useEffect(() => {
    if (screen !== "analysing") return;
    const timer = setTimeout(() => setScreen("result"), 1800);
    return () => clearTimeout(timer);
  }, [screen]);

  const chooseItem = (nextItem: Item) => {
    setItem(nextItem);
    setScreen("analysing");
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas px-6" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View className="flex-row items-center justify-between pt-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-forest">
          <Text className="text-[19px] font-extrabold text-canvas">W</Text>
        </View>
        <Text className="ml-2.5 mr-auto text-[19px] font-bold tracking-tight text-ink">
          wastewise
        </Text>
        <View className="rounded-full bg-sage px-3 py-2">
          <Text className="text-[11px] font-bold text-forest-soft">
            Local guide
          </Text>
        </View>
      </View>
      {screen === "home" && (
        <View className="flex-1">
          <View className="pt-[68px]">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-peach" />
              <Text className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">
                SORT SMARTER
              </Text>
            </View>
            <Text className="mt-5 text-[43px] font-extrabold leading-[48px] tracking-[-1.8px] text-ink">
              Not sure where{`\n`}it belongs?
            </Text>
            <Text className="mt-[18px] max-w-[330px] text-base leading-6 text-copy">
              Scan everyday waste and get clear, practical guidance before it
              reaches the bin.
            </Text>
            <Pressable
              onPress={() => setScreen("choose")}
              className="mt-[31px] flex-row items-center justify-center rounded-[18px] bg-ink py-[17px] active:opacity-85"
            >
              <Text className="mr-2 text-[25px] font-semibold leading-[25px] text-lime">
                ⌁
              </Text>
              <Text className="text-base font-extrabold text-white">
                Scan an item
              </Text>
            </Pressable>
          </View>
          <View className="mt-9 rounded-[22px] bg-card p-[22px]">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-extrabold tracking-[1.3px] text-card-label">
                TODAY'S TIP
              </Text>
              <Text className="text-[21px] text-card-ink">→</Text>
            </View>
            <Text className="mt-[18px] text-[21px] font-extrabold tracking-tight text-card-ink">
              Keep recycling clean.
            </Text>
            <Text className="mt-2 text-sm leading-5 text-card-copy">
              Give food containers a quick rinse so they can be recycled
              properly.
            </Text>
            <View className="mt-[21px] h-[5px] overflow-hidden rounded-full bg-card-track">
              <View className="h-full w-[68%] rounded-full bg-card-progress" />
            </View>
          </View>
          <Text className="mt-7 pb-[18px] text-center text-xs font-semibold text-footer">
            On-device guidance. Thoughtful choices.
          </Text>
        </View>
      )}

      {screen === "choose" && (
        <View className="flex-1 pt-12">
          <Text className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">
            DEMO SCAN
          </Text>
          <Text className="mt-4 text-[34px] font-extrabold leading-[39px] tracking-[-1.3px] text-ink">
            Choose an item{`\n`}to scan
          </Text>
          <Text className="mt-3 text-base leading-6 text-copy">
            For now, choose an example. We will replace this screen with the
            real camera and photo picker later.
          </Text>
          <View className="mt-8 gap-3">
            {exampleItems.map((example) => (
              <Pressable
                key={example.name}
                onPress={() => chooseItem(example)}
                className="flex-row items-center rounded-[18px] border border-[#DFE4DE] bg-white p-5 active:bg-sage"
              >
                <View>
                  <Text className="text-base font-extrabold text-ink">
                    {example.name}
                  </Text>
                  <Text className="mt-1 text-sm text-copy">
                    Tap to see a sample result
                  </Text>
                </View>
                <Text className="ml-auto text-xl text-forest">→</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => setScreen("home")}
            className="mt-auto mb-5 items-center py-4"
          >
            <Text className="text-sm font-bold text-forest">Cancel</Text>
          </Pressable>
        </View>
      )}

      {screen === "analysing" && (
        <View className="flex-1 items-center justify-center pb-20">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-sage">
            <Text className="text-[42px] text-forest">⌁</Text>
          </View>
          <Text className="mt-8 text-[28px] font-extrabold tracking-tight text-ink">
            Checking your item
          </Text>
          <Text className="mt-3 max-w-[250px] text-center text-base leading-6 text-copy">
            Looking at the image and finding the best disposal advice.
          </Text>
          <View className="mt-9 h-2 w-48 overflow-hidden rounded-full bg-[#DDE5DC]">
            <View className="h-full w-2/3 rounded-full bg-forest" />
          </View>
        </View>
      )}

      {screen === "result" && (
        <View className="flex-1 pt-10">
          <View className="self-start rounded-full bg-sage px-3 py-2">
            <Text className="text-[11px] font-extrabold tracking-[.8px] text-forest">
              RESULT READY
            </Text>
          </View>
          <Text className="mt-7 text-[34px] font-extrabold leading-[39px] tracking-[-1.3px] text-ink">
            {item.category}
          </Text>
          <View className="mt-5 rounded-[20px] bg-white p-5">
            <Text className="text-[10px] font-extrabold tracking-[1.2px] text-forest-muted">
              WHAT TO DO
            </Text>
            <Text className="mt-3 text-base font-semibold leading-6 text-ink">
              {item.action}
            </Text>
          </View>
          <View className="mt-4 rounded-[18px] bg-[#FFF0E6] p-4">
            <Text className="text-sm leading-5 text-ink">
              This is a demo result. Later, the model will decide the category
              from your photo.
            </Text>
          </View>
          <Pressable
            onPress={() => setScreen("choose")}
            className="mt-auto mb-4 items-center justify-center rounded-[18px] bg-ink py-[17px] active:opacity-85"
          >
            <Text className="text-base font-extrabold text-white">
              Scan another item
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setScreen("home")}
            className="mb-4 items-center py-2"
          >
            <Text className="text-sm font-bold text-forest">Back home</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 64,
    flexDirection: "row",
    backgroundColor: "transparent",
    width: "100%",
    paddingHorizontal: 64,
  },
  button: {
    flex: 1,
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});

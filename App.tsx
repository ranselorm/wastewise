import "./global.css";

import { CameraView, type CameraType, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./components/Header";

type Screen = "home" | "camera" | "choose" | "analysing" | "result";

// Temporary app data. Each item will move to the team-owned data files before
// we connect the on-device image classifier.
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

  // A local URI returned by the device camera after a user takes a photo.
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (screen !== "analysing") return;

    // This represents model processing for now. ExecuTorch will replace this
    // delay with a real on-device classification request.
    const timer = setTimeout(() => setScreen("result"), 1500);
    return () => clearTimeout(timer);
  }, [screen]);

  const openCamera = async () => {
    // Ask only when someone chooses to scan, rather than on app launch.
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }

    setPhotoUri(null);
    setScreen("camera");
  };

  const capturePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (!photo) return;

    setPhotoUri(photo.uri);
    // The image is captured for real, but its classification remains mocked
    // until the ExecuTorch model is integrated.
    setItem(exampleItems[0]);
    setScreen("analysing");
  };

  const chooseDemoItem = (nextItem: Item) => {
    setPhotoUri(null);
    setItem(nextItem);
    setScreen("analysing");
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas px-6" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <Header />

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
              Not sure where{"\n"}it belongs?
            </Text>
            <Text className="mt-[18px] max-w-[330px] text-base leading-6 text-copy">
              Scan everyday waste and get clear, practical guidance before it
              reaches the bin.
            </Text>
            <Pressable
              onPress={openCamera}
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
          </View>
          <Text className="mt-auto pb-[18px] text-center text-xs font-semibold text-footer">
            On-device guidance. Thoughtful choices.
          </Text>
        </View>
      )}

      {screen === "camera" && (
        <View className="flex-1 pt-5">
          <View className="flex-row items-center justify-between pb-4">
            <Text className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">
              SCAN AN ITEM
            </Text>
            <Pressable
              onPress={() =>
                setFacing((current) => (current === "back" ? "front" : "back"))
              }
            >
              <Text className="text-sm font-bold text-forest">Flip camera</Text>
            </Pressable>
          </View>

          <View className="flex-1 overflow-hidden rounded-[28px] bg-ink">
            {/* The real device camera preview. */}
            <CameraView ref={cameraRef} facing={facing} style={{ flex: 1 }} />
            <View className="absolute inset-x-6 top-6 rounded-2xl bg-black/40 px-4 py-3">
              <Text className="text-center text-sm font-semibold text-white">
                Place one item clearly in the frame
              </Text>
            </View>
          </View>

          <View className="items-center py-5">
            <Pressable
              onPress={capturePhoto}
              className="h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-forest bg-white active:opacity-70"
            >
              <View className="h-[56px] w-[56px] rounded-full bg-forest" />
            </Pressable>
            <Text className="mt-2 text-sm font-bold text-forest">
              Take photo
            </Text>
          </View>

          <View className="mb-4 flex-row justify-between px-2">
            <Pressable onPress={() => setScreen("choose")}>
              <Text className="text-sm font-bold text-forest">
                Use demo item
              </Text>
            </Pressable>
            <Pressable onPress={() => setScreen("home")}>
              <Text className="text-sm font-bold text-copy">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {screen === "choose" && (
        <View className="flex-1 pt-12">
          <Text className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">
            DEMO RESULTS
          </Text>
          <Text className="mt-4 text-[34px] font-extrabold leading-[39px] tracking-[-1.3px] text-ink">
            Choose a sample{`\n`}result
          </Text>
          <Text className="mt-3 text-base leading-6 text-copy">
            Use these while the image model is still being connected.
          </Text>
          <View className="mt-8 gap-3">
            {exampleItems.map((example) => (
              <Pressable
                key={example.name}
                onPress={() => chooseDemoItem(example)}
                className="flex-row items-center rounded-[18px] border border-[#DFE4DE] bg-white p-5 active:bg-sage"
              >
                <View>
                  <Text className="text-base font-extrabold text-ink">
                    {example.name}
                  </Text>
                  <Text className="mt-1 text-sm text-copy">
                    Show sample recycling guidance
                  </Text>
                </View>
                <Text className="ml-auto text-xl text-forest">→</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={openCamera}
            className="mt-auto mb-5 items-center py-4"
          >
            <Text className="text-sm font-bold text-forest">
              Back to camera
            </Text>
          </Pressable>
        </View>
      )}

      {screen === "analysing" && (
        <View className="flex-1 items-center justify-center pb-20">
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              className="h-28 w-28 rounded-[26px]"
            />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-full bg-sage">
              <Text className="text-[42px] text-forest">⌁</Text>
            </View>
          )}
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
        <View className="flex-1 pt-8">
          <View className="self-start rounded-full bg-sage px-3 py-2">
            <Text className="text-[11px] font-extrabold tracking-[.8px] text-forest">
              RESULT READY
            </Text>
          </View>
          {photoUri && (
            <Image
              source={{ uri: photoUri }}
              className="mt-5 h-28 w-28 rounded-[26px]"
            />
          )}
          <Text className="mt-6 text-[34px] font-extrabold leading-[39px] tracking-[-1.3px] text-ink">
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
              This is a demo result. The image model will choose the final
              category later.
            </Text>
          </View>
          <Pressable
            onPress={openCamera}
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
    </SafeAreaView>
  );
}

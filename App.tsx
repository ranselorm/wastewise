import "./global.css";

import Feather from "@expo/vector-icons/Feather";
import { CameraView, type CameraType, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./components/Header";
import * as ImagePicker from "expo-image-picker";

type Screen =
  "home" | "guide" | "camera" | "choose" | "preview" | "analysing" | "result";
type ImageSource = "camera" | "gallery" | null;

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
  const [screenBeforeGuide, setScreenBeforeGuide] =
    useState<Exclude<Screen, "guide">>("home");
  const [item, setItem] = useState<Item>(exampleItems[0]);

  // A local URI returned by the device camera after a user takes a photo.
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  // The preview uses this to offer the right replacement action.
  const [imageSource, setImageSource] = useState<ImageSource>(null);
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
    setImageSource(null);
    setScreen("camera");
  };

  const capturePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (!photo) return;

    setPhotoUri(photo.uri);
    setImageSource("camera");
    // The image is captured for real, but its classification remains mocked
    // until the ExecuTorch model is integrated.
    setItem(exampleItems[0]);
    setScreen("preview");
  };

  // function to pick image from gallery
  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      // Later: show a friendly message explaining why access is needed.
      console.log(
        "Permission denied. Please allow permission to access gallery.",
      );

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.7,
    });

    if (result.canceled) {
      console.log("No image selected. Please select an image to analyze.");

      return;
    }

    console.log(result.assets[0].uri, "Selected image object");
    setPhotoUri(result.assets[0].uri);
    setImageSource("gallery");
    setItem(exampleItems[0]); // Temporary mock classification
    setScreen("preview");
  };

  const chooseDemoItem = (nextItem: Item) => {
    setPhotoUri(null);
    setItem(nextItem);
    setScreen("analysing");
  };

  const openGuide = () => {
    if (screen === "guide") return;

    setScreenBeforeGuide(screen);
    setScreen("guide");
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas px-6" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <Header onOpenGuide={openGuide} />

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

            {/* scan an item from camera */}
            <Pressable
              onPress={openCamera}
              className="mt-[31px] flex-row items-center justify-center rounded-[18px] bg-ink py-[17px] active:opacity-85"
            >
              <Feather name="camera" size={20} color="#B7D9A8" />
              <Text className="text-base font-extrabold text-white">
                {"  Scan an item"}
              </Text>
            </Pressable>

            <Pressable
              onPress={pickFromGallery}
              className="mt-3 flex-row items-center justify-center rounded-[18px] border border-[#C9D5CA] bg-white py-[17px] active:bg-sage"
            >
              <Feather name="image" size={20} color="#244A3C" />
              <Text className="text-base font-extrabold text-forest">
                {"  Choose from gallery"}
              </Text>
            </Pressable>
          </View>

          <View className="mt-9 rounded-[22px] bg-card p-[22px]">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-extrabold tracking-[1.3px] text-card-label">
                TODAY'S TIP
              </Text>
              <Feather name="arrow-up-right" size={20} color="#244A3C" />
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

      {screen === "guide" && (
        <View className="flex-1 pt-8">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">
                LOCAL GUIDE
              </Text>
              <Text className="mt-3 text-[34px] font-extrabold leading-[39px] tracking-[-1.3px] text-ink">
                Sort with confidence
              </Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-sage">
              <Feather name="map-pin" size={23} color="#244A3C" />
            </View>
          </View>

          <Text className="mt-4 text-base leading-6 text-copy">
            Start with these simple habits. Waste rules can differ by area, so
            Wastewise will add local collection details later.
          </Text>

          <View className="mt-8 gap-3">
            <View className="flex-row rounded-[20px] bg-white p-5">
              <View className="h-10 w-10 items-center justify-center rounded-[14px] bg-sage">
                <Feather name="droplet" size={19} color="#244A3C" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base font-extrabold text-ink">
                  Keep items clean
                </Text>
                <Text className="mt-1 text-sm leading-5 text-copy">
                  Empty containers and give them a quick rinse when possible.
                </Text>
              </View>
            </View>

            <View className="flex-row rounded-[20px] bg-white p-5">
              <View className="h-10 w-10 items-center justify-center rounded-[14px] bg-[#FFF0E6]">
                <Feather name="alert-circle" size={19} color="#B86635" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base font-extrabold text-ink">
                  Keep batteries separate
                </Text>
                <Text className="mt-1 text-sm leading-5 text-copy">
                  Never put batteries in ordinary recycling. Take them to a
                  collection point.
                </Text>
              </View>
            </View>

            <View className="flex-row rounded-[20px] bg-white p-5">
              <View className="h-10 w-10 items-center justify-center rounded-[14px] bg-card">
                <Feather name="search" size={19} color="#244A3C" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base font-extrabold text-ink">
                  When in doubt, scan it
                </Text>
                <Text className="mt-1 text-sm leading-5 text-copy">
                  Take a clear photo and Wastewise will suggest the next step.
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => setScreen(screenBeforeGuide)}
            className="mt-auto mb-5 flex-row items-center justify-center rounded-[18px] bg-ink py-[17px] active:opacity-85"
          >
            <Feather name="arrow-left" size={20} color="#B7D9A8" />
            <Text className="text-base font-extrabold text-white">
              {"  Back"}
            </Text>
          </Pressable>
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
              className="flex-row items-center gap-2 py-1"
            >
              <Feather name="refresh-cw" size={16} color="#244A3C" />
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
              <View className="h-[56px] w-[56px] items-center justify-center rounded-full bg-forest">
                <Feather name="camera" size={23} color="#F7F7F2" />
              </View>
            </Pressable>
            <Text className="mt-2 text-sm font-bold text-forest">
              Take photo
            </Text>
          </View>

          <View className="mb-4 flex-row justify-between px-2">
            <Pressable onPress={() => setScreen("choose")}>
              <View className="flex-row items-center gap-2">
                <Feather name="list" size={16} color="#244A3C" />
                <Text className="text-sm font-bold text-forest">
                  Use demo item
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setScreen("home")}
              className="flex-row items-center gap-2"
            >
              <Feather name="x" size={16} color="#5D6C63" />
              <Text className="text-sm font-bold text-copy">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {screen === "preview" && photoUri && (
        <View className="flex-1 pt-8">
          <Text className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">
            PHOTO PREVIEW
          </Text>
          <Text className="mt-4 text-[34px] font-extrabold leading-[39px] tracking-[-1.3px] text-ink">
            Is this the right item?
          </Text>
          <Text className="mt-3 text-base leading-6 text-copy">
            Check that the item is clear and fills most of the frame before we
            analyse it.
          </Text>

          <Image
            source={{ uri: photoUri }}
            className="mt-8 h-[360px] w-full rounded-[28px] bg-sage"
            resizeMode="cover"
          />

          <Pressable
            onPress={() => setScreen("analysing")}
            className="mt-6 flex-row items-center justify-center rounded-[18px] bg-ink py-[17px] active:opacity-85"
          >
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
            <Text className="text-base font-extrabold text-white">
              {"  Analyse this photo"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (imageSource === "camera") {
                void openCamera();
                return;
              }

              void pickFromGallery();
            }}
            className="mt-3 flex-row items-center justify-center rounded-[18px] bg-sage py-[17px] active:opacity-85"
          >
            <Feather
              name={imageSource === "camera" ? "rotate-ccw" : "image"}
              size={19}
              color="#244A3C"
            />
            <Text className="text-base font-extrabold text-forest">
              {imageSource === "camera"
                ? "  Retake photo"
                : "  Choose another photo"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setPhotoUri(null);
              setImageSource(null);
              setScreen("home");
            }}
            className="mt-4 flex-row items-center justify-center gap-2 py-2"
          >
            <Feather name="x" size={16} color="#5D6C63" />
            <Text className="text-sm font-bold text-copy">Cancel</Text>
          </Pressable>
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
                <Feather
                  name="chevron-right"
                  size={21}
                  color="#244A3C"
                  style={{ marginLeft: "auto" }}
                />
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
              <Feather name="search" size={38} color="#244A3C" />
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
            <View className="flex-row items-center gap-1.5">
              <Feather name="check-circle" size={14} color="#244A3C" />
              <Text className="text-[11px] font-extrabold tracking-[.8px] text-forest">
                RESULT READY
              </Text>
            </View>
          </View>
          {photoUri && (
            <Image
              source={{ uri: photoUri }}
              className="mt-5 h-60 w-300 rounded-[26px]"
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
            className="mt-auto mb-4 flex-row items-center justify-center rounded-[18px] bg-ink py-[17px] active:opacity-85"
          >
            <Feather name="camera" size={20} color="#B7D9A8" />
            <Text className="text-base font-extrabold text-white">
              {"  Scan another item"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setScreen("home")}
            className="mb-4 flex-row items-center justify-center gap-2 py-2"
          >
            <Feather name="arrow-left" size={16} color="#244A3C" />
            <Text className="text-sm font-bold text-forest">Back home</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

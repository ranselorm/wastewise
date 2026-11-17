import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

type HeaderProps = {
  onOpenGuide: () => void;
  onOpenLanguage: () => void;
  voiceGuidanceEnabled: boolean;
  onToggleVoiceGuidance: () => void;
};

export default function Header({
  onOpenGuide,
  onOpenLanguage,
  voiceGuidanceEnabled,
  onToggleVoiceGuidance,
}: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between pt-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-forest">
        <Text className="text-[19px] font-extrabold text-canvas">W</Text>
      </View>
      <Text className="ml-2.5 mr-auto text-[19px] font-bold tracking-tight text-ink">
        wastewise
      </Text>
      <Pressable
        onPress={onToggleVoiceGuidance}
        accessibilityRole="switch"
        accessibilityState={{ checked: voiceGuidanceEnabled }}
        accessibilityLabel="Voice guidance"
        accessibilityHint={
          voiceGuidanceEnabled
            ? "Turns off voice guidance"
            : "Turns on voice guidance"
        }
        className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-sage active:opacity-70"
      >
        <Feather
          name={voiceGuidanceEnabled ? "volume-2" : "volume-x"}
          size={17}
          color="#244A3C"
        />
      </Pressable>
      <Pressable
        onPress={onOpenLanguage}
        accessibilityRole="button"
        accessibilityLabel="Change app language"
        accessibilityHint="Choose the language used across Wastewise"
        className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-sage active:opacity-70"
      >
        <Feather name="globe" size={17} color="#244A3C" />
      </Pressable>
      <Pressable
        onPress={onOpenGuide}
        accessibilityRole="button"
        accessibilityLabel="Open local guide"
        className="h-9 w-9 items-center justify-center rounded-full bg-sage active:opacity-70"
      >
        <Feather name="map-pin" size={17} color="#416053" />
      </Pressable>
    </View>
  );
}

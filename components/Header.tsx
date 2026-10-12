import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

type HeaderProps = {
  onOpenGuide: () => void;
};

export default function Header({ onOpenGuide }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between pt-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-forest">
        <Text className="text-[19px] font-extrabold text-canvas">W</Text>
      </View>
      <Text className="ml-2.5 mr-auto text-[19px] font-bold tracking-tight text-ink">
        wastewise
      </Text>
      <Pressable
        onPress={onOpenGuide}
        accessibilityRole="button"
        accessibilityLabel="Open local guide"
        className="flex-row items-center gap-1.5 rounded-full bg-sage px-3 py-2 active:opacity-70"
      >
        <Feather name="map-pin" size={12} color="#416053" />
        <Text className="text-[11px] font-bold text-forest-soft">
          Local guide
        </Text>
        <Feather name="chevron-right" size={13} color="#416053" />
      </Pressable>
    </View>
  );
}

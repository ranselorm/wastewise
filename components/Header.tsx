import { Text, View } from "react-native";

export default function Header() {
  return (
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
  );
}

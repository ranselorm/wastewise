import './global.css';

import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-canvas px-6" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View className="flex-row items-center justify-between pt-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-forest"><Text className="text-[19px] font-extrabold text-canvas">W</Text></View>
        <Text className="ml-2.5 mr-auto text-[19px] font-bold tracking-tight text-ink">wastewise</Text>
        <View className="rounded-full bg-sage px-3 py-2"><Text className="text-[11px] font-bold text-forest-soft">Local guide</Text></View>
      </View>
      <View className="pt-[68px]">
        <View className="flex-row items-center gap-2"><View className="h-2 w-2 rounded-full bg-peach" /><Text className="text-[11px] font-extrabold tracking-[1.4px] text-forest-muted">SORT SMARTER</Text></View>
        <Text className="mt-5 text-[43px] font-extrabold leading-[48px] tracking-[-1.8px] text-ink">Not sure where{`\n`}it belongs?</Text>
        <Text className="mt-[18px] max-w-[330px] text-base leading-6 text-copy">Scan everyday waste and get clear, practical guidance before it reaches the bin.</Text>
        <Pressable className="mt-[31px] flex-row items-center justify-center rounded-[18px] bg-ink py-[17px] active:opacity-85"><Text className="mr-2 text-[25px] font-semibold leading-[25px] text-lime">⌁</Text><Text className="text-base font-extrabold text-white">Scan an item</Text></Pressable>
      </View>
      <View className="mt-9 rounded-[22px] bg-card p-[22px]">
        <View className="flex-row items-center justify-between"><Text className="text-[10px] font-extrabold tracking-[1.3px] text-card-label">TODAY'S TIP</Text><Text className="text-[21px] text-card-ink">→</Text></View>
        <Text className="mt-[18px] text-[21px] font-extrabold tracking-tight text-card-ink">Keep recycling clean.</Text>
        <Text className="mt-2 text-sm leading-5 text-card-copy">Give food containers a quick rinse so they can be recycled properly.</Text>
        <View className="mt-[21px] h-[5px] overflow-hidden rounded-full bg-card-track"><View className="h-full w-[68%] rounded-full bg-card-progress" /></View>
      </View>
      <Text className="mt-7 pb-[18px] text-center text-xs font-semibold text-footer">On-device guidance. Thoughtful choices.</Text>
    </SafeAreaView>
  );
}

import Feather from "@expo/vector-icons/Feather";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { LanguageOption } from "../services/translation";
import AppText from "./AppText";

type LanguageSelectorProps = {
  visible: boolean;
  selectedLanguage: string;
  languages: LanguageOption[];
  onClose: () => void;
  onSelect: (code: string) => void;
};

export default function LanguageSelector({
  visible,
  selectedLanguage,
  languages,
  onClose,
  onSelect,
}: LanguageSelectorProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[78%] rounded-t-[28px] bg-canvas px-6 pb-8 pt-5">
          <View className="flex-row items-center justify-between">
            <View>
              <AppText className="text-[11px] font-extrabold tracking-[1.2px] text-forest-muted">LANGUAGE</AppText>
              <AppText className="mt-1 text-[25px] font-extrabold text-ink">Choose your app language</AppText>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close language selection" className="h-10 w-10 items-center justify-center rounded-full bg-sage">
              <Feather name="x" size={20} color="#244A3C" />
            </Pressable>
          </View>
          <AppText className="mt-3 text-sm leading-5 text-copy">The first translation may download language support. After it downloads, it can work offline.</AppText>
          <ScrollView className="mt-5" showsVerticalScrollIndicator={false}>
            {languages.map((language) => {
              const active = language.code === selectedLanguage;
              return (
                <Pressable
                  key={language.code}
                  onPress={() => onSelect(language.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  className={`mb-2 flex-row items-center justify-between rounded-[17px] border px-4 py-4 active:bg-sage ${active ? "border-[#244A3C] bg-sage" : "border-[#E2E9E1] bg-white"}`}
                >
                  <Text className="text-base font-extrabold text-ink">{language.name}</Text>
                  {active && <Feather name="check" size={19} color="#244A3C" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

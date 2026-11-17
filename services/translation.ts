import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from "react-native";

const LANGUAGE_KEY = "@wastewise_selected_language";

export type LanguageOption = {
  code: string;
  name: string;
};

type TranslationModule = {
  getSupportedLanguageCodes(): Promise<string[]>;
  translateEnglish(text: string, targetLanguage: string): Promise<string>;
};

const nativeModule = NativeModules.WastewiseTranslation as
  | TranslationModule
  | undefined;

const languageNames: readonly LanguageOption[] = [
  { code: "en", name: "English" },
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "zh", name: "Chinese" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl", name: "Dutch" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "gu", name: "Gujarati" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hu", name: "Hungarian" },
  { code: "id", name: "Indonesian" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "kn", name: "Kannada" },
  { code: "ko", name: "Korean" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mr", name: "Marathi" },
  { code: "no", name: "Norwegian" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "pa", name: "Punjabi" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "es", name: "Spanish" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "vi", name: "Vietnamese" },
];

export const languageName = (code: string) =>
  languageNames.find((language) => language.code === code)?.name ?? "English";

export async function loadSelectedLanguage(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(LANGUAGE_KEY)) ?? "en";
  } catch {
    return "en";
  }
}

export async function saveSelectedLanguage(code: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, code);
}

export async function availableLanguages(): Promise<LanguageOption[]> {
  if (!nativeModule) return languageNames.filter((language) => language.code === "en");
  const supported = new Set(await nativeModule.getSupportedLanguageCodes());
  return languageNames.filter((language) => supported.has(language.code));
}

export async function translateEnglish(text: string, targetLanguage: string): Promise<string> {
  if (targetLanguage === "en" || !text.trim()) return text;
  if (!nativeModule) {
    throw new Error("Translation is available after installing a newly built Android app.");
  }
  return nativeModule.translateEnglish(text, targetLanguage);
}

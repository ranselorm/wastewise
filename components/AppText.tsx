import { useEffect, useState, type ComponentProps } from "react";
import { Text } from "react-native";
import { useAppLanguage } from "../services/appLanguage";
import { translateEnglish } from "../services/translation";

const translatedCopy = new Map<string, string>();

type AppTextProps = ComponentProps<typeof Text> & {
  children: string;
};

/**
 * Translates fixed interface copy after the user has selected a language.
 * English remains on screen while an on-device language model is loading.
 */
export default function AppText({ children, ...props }: AppTextProps) {
  const language = useAppLanguage();
  const [text, setText] = useState(children);

  useEffect(() => {
    let active = true;
    const key = `${language}:${children}`;

    if (language === "en" || !children.trim()) {
      setText(children);
      return () => {
        active = false;
      };
    }

    const cached = translatedCopy.get(key);
    if (cached) {
      setText(cached);
      return () => {
        active = false;
      };
    }

    // Keep the original English visible until the local model is ready.
    setText(children);
    void translateEnglish(children, language)
      .then((translated) => {
        translatedCopy.set(key, translated);
        if (active) setText(translated);
      })
      .catch(() => {
        // English is the intentional, safe fallback.
      });

    return () => {
      active = false;
    };
  }, [children, language]);

  return <Text {...props}>{text}</Text>;
}

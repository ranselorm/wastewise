import { NativeModules } from "react-native";

type WastewiseLlamaNativeModule = {
  explainFacts(facts: readonly string[]): Promise<{ text: string }>;
};

const nativeModule = NativeModules.WastewiseLlama as
  | WastewiseLlamaNativeModule
  | undefined;

export async function explainVerifiedFacts(
  facts: readonly string[],
): Promise<string> {
  if (!nativeModule) {
    throw new Error(
      "WastewiseLlama is unavailable. Install a newly built Android development app.",
    );
  }

  const result = await nativeModule.explainFacts(facts);
  return result.text.trim();
}

import { NativeModules } from "react-native";

export type WasteCategory =
  | "battery"
  | "general_waste"
  | "glass"
  | "metal"
  | "organic_waste"
  | "paper_cardboard"
  | "plastic"
  | "textile";

export type ClassificationResult = {
  category: WasteCategory;
  confidence: number;
};

type WastewiseClassifierNativeModule = {
  classifyImage(imageUri: string): Promise<ClassificationResult>;
};

const nativeModule =
  NativeModules.WastewiseClassifier as WastewiseClassifierNativeModule;

export function classifyImage(imageUri: string): Promise<ClassificationResult> {
  if (!nativeModule) {
    throw new Error(
      "WastewiseClassifier is unavailable. Install a newly built Android development app.",
    );
  }

  return nativeModule.classifyImage(imageUri);
}

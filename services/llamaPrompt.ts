import { categoryDetails } from "../data/categories";
import { disposalGuidance } from "../data/disposalGuidance";
import { lowConfidenceAdvice } from "../data/lowConfidenceAdvice";
import type { WasteCategory } from "./wastewiseClassifier.ts";

const MIN_CONFIDENCE = 0.6;

export type LlamaMessage = {
  role: "system" | "user";
  content: string;
};

type LlamaPromptInput = {
  category: WasteCategory;
  confidence: number;
  userQuestion?: string;
};

export function buildLlamaMessages({
  category,
  confidence,
  userQuestion,
}: LlamaPromptInput): LlamaMessage[] {
  const categoryInfo = categoryDetails[category];
  const guidance = disposalGuidance[category];
  const confidencePercent = Math.round(confidence * 100);

  const systemMessage = [
    "You are Wastewise, a helpful recycling assistant.",
    "Give short, clear, friendly recycling guidance.",
    "Use only the Wastewise category and disposal guidance provided.",
    "Keep your answer below 70 words.",
    "Do not invent local recycling rules.",
    "Mention that local recycling rules can differ when relevant.",
    "Never tell users to put batteries in normal household recycling.",
  ].join(" ");

  if (confidence < MIN_CONFIDENCE) {
    return [
      {
        role: "system",
        content: systemMessage,
      },
      {
        role: "user",
        content: [
          `Wastewise is only ${confidencePercent}% confident about this photo.`,
          `Respond with this message: ${lowConfidenceAdvice.message}`,
          `You may add one helpful photo tip: ${lowConfidenceAdvice.captureTips[0]}`,
          "Do not guess the item category.",
        ].join(" "),
      },
    ];
  }

  return [
    {
      role: "system",
      content: systemMessage,
    },
    {
      role: "user",
      content: [
        `Detected category: ${categoryInfo.label}.`,
        `Recycling group: ${categoryInfo.recyclingGroup}.`,
        `Classifier confidence: ${confidencePercent}%.`,
        `Approved disposal guidance: ${guidance}`,
        `User question: ${userQuestion ?? "What should I do with this item?"}`,
      ].join(" "),
    },
  ];
}
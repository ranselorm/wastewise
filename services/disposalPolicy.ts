import type { WasteCategory } from "./wastewiseClassifier.ts";

/**
 * Verified Cambridge guidance for the narrow meanings used by the current
 * eight-class image classifier. The app selects these facts; Llama only turns
 * them into friendly wording after its Android runtime is added.
 */
export type DisposalGuidance = {
  title: string;
  facts: readonly string[];
};

const guidanceByCategory: Record<WasteCategory, DisposalGuidance> = {
  battery: {
    title: "Battery",
    facts: [
      "Never put the battery inside a household bin.",
      "Take it to a local battery recycling point or a Household Recycling Centre.",
      "If you have your own household bin collection, small household batteries may be placed in a small tied plastic bag loosely on top of the bin lid.",
    ],
  },
  general_waste: {
    title: "General waste",
    facts: ["Put ordinary non-recyclable household waste in the black bin."],
  },
  glass: {
    title: "Glass bottle or jar",
    facts: [
      "Rinse the bottle or jar and replace its cap or lid.",
      "Put it loose in the blue recycling bin.",
    ],
  },
  metal: {
    title: "Food or drink can",
    facts: [
      "Rinse and crush the can.",
      "Put it loose in the blue recycling bin.",
    ],
  },
  organic_waste: {
    title: "Food waste",
    facts: [
      "If food-waste collections have started at your address, put food waste in the silver caddy.",
      "If your food-waste collection has not started, put food waste in the green bin.",
    ],
  },
  paper_cardboard: {
    title: "Clean, dry cardboard",
    facts: [
      "Keep the cardboard clean and dry, then break down and flatten large boxes.",
      "Put it loose in the blue recycling bin.",
    ],
  },
  plastic: {
    title: "Plastic bottle",
    facts: [
      "Empty, rinse and squash the bottle, then put its lid or spray trigger back on.",
      "Put it loose in the blue recycling bin.",
    ],
  },
  textile: {
    title: "Clean, dry textile",
    facts: [
      "Keep the item clean and dry.",
      "Take it to a clothing or textile recycling bank.",
    ],
  },
};

export const MIN_CONFIDENCE = 0.6;
export const RETAKE_MESSAGE = "Please retake the photo so I can identify the item clearly.";

export function guidanceForClassification(
  category: WasteCategory,
  confidence: number,
): DisposalGuidance | null {
  return confidence >= MIN_CONFIDENCE ? guidanceByCategory[category] : null;
}

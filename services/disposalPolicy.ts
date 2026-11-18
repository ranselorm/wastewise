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
  "e-waste": {
    title: "Electrical item",
    facts: [
      "Do not put electrical items in a household bin.",
      "Take the item to a Household Recycling Centre.",
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

// A classifier always returns its nearest known category. These gates make the
// app ask for another photo instead of confidently guessing for unfamiliar or
// visually ambiguous objects, such as books and packaging.
export const MIN_CONFIDENCE = 0.65;
export const E_WASTE_MIN_CONFIDENCE = 0.65;
export const BATTERY_MIN_CONFIDENCE = 0.7;
export const MIN_CONFIDENCE_MARGIN = 0.15;
export const RETAKE_MESSAGE = "Please retake the photo so I can identify the item clearly.";

export function guidanceForClassification(
  category: WasteCategory,
  confidence: number,
  runnerUpConfidence = 0,
): DisposalGuidance | null {
  const threshold =
    category === "battery"
      ? BATTERY_MIN_CONFIDENCE
      : category === "e-waste"
        ? E_WASTE_MIN_CONFIDENCE
        : MIN_CONFIDENCE;
  const hasClearLead = confidence - runnerUpConfidence >= MIN_CONFIDENCE_MARGIN;
  return confidence >= threshold && hasClearLead
    ? guidanceByCategory[category]
    : null;
}

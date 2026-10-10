export type WasteCategory =
  | "Plastic bottle"
  | "Aluminium can"
  | "Cardboard"
  | "Paper"
  | "Glass jar"
  | "Food waste"
  | "Battery"
  | "E-waste";

export const recyclingTips: Record<WasteCategory, string[]> = {
  "Plastic bottle": [
    "Empty the bottle before recycling it.",
    "Use a reusable bottle to help reduce single-use plastic waste.",
  ],
  "Aluminium can": [
    "Empty the can before placing it in the appropriate recycling bin.",
    "Recycling aluminium helps conserve raw materials.",
  ],
  "Cardboard": [
    "Keep cardboard clean and dry for recycling.",
    "Flatten cardboard boxes to save storage space.",
  ],
  "Paper": [
    "Keep recyclable paper clean and dry.",
    "Use both sides of paper to reduce unnecessary waste.",
  ],
  "Glass jar": [
    "Empty the jar and check local guidance for glass recycling.",
    "Reuse a clean jar for storage when safe and practical.",
  ],
  "Food waste": [
    "Separate food scraps if your local council provides a food-waste collection.",
    "Plan meals and store food properly to help prevent waste.",
  ],
  "Battery": [
    "Take used batteries to an appropriate battery collection point.",
    "Do not put loose batteries in household rubbish or recycling bins.",
  ],
  "E-waste": [
    "Use an approved electrical-waste collection or recycling service.",
    "Repair or donate working electronics when practical.",
  ],
};

export function getRecyclingTips(category: string): string[] {
  if (category in recyclingTips) {
    return recyclingTips[category as WasteCategory];
  }

  return [
    "Check your local council guidance before disposing of this item.",
  ];
}

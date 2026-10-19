import type { WasteCategory } from "../services/wastewiseClassifier.ts";

export const disposalGuidance: Record<WasteCategory, string> = {
  battery:
    "Keep batteries out of ordinary recycling. Take them to a battery collection point.",

  general_waste:
    "Place this in general waste if it cannot be reused or accepted by your local recycling service.",

  glass:
    "Empty and rinse the glass item, then follow your local glass recycling guidance.",

  metal:
    "Empty the item and place it in metal recycling where your local service accepts it.",

  organic_waste:
    "Place food scraps and other compostable organic material in the appropriate food-waste collection.",

  paper_cardboard:
    "Keep it clean and dry, flatten it if possible, then place it in paper and cardboard recycling.",

  plastic:
    "Empty and rinse the item, then check whether your local service accepts that type of plastic.",

  textile:
    "If clean and usable, donate it. Otherwise, check for a local textile recycling point.",
};

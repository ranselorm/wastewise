import type { WasteCategory } from "../services/wastewiseClassifier.ts";

export type CategoryDetails = {
  label: string;
  recyclingGroup: string;
};

export const categoryDetails: Record<WasteCategory, CategoryDetails> = {
  battery: {
    label: "Battery",
    recyclingGroup: "Battery collection",
  },
  general_waste: {
    label: "General waste",
    recyclingGroup: "General waste",
  },
  glass: {
    label: "Glass",
    recyclingGroup: "Glass recycling",
  },
  metal: {
    label: "Metal",
    recyclingGroup: "Metal recycling",
  },
  organic_waste: {
    label: "Organic waste",
    recyclingGroup: "Food and organic waste",
  },
  paper_cardboard: {
    label: "Paper and cardboard",
    recyclingGroup: "Paper and cardboard recycling",
  },
  plastic: {
    label: "Plastic",
    recyclingGroup: "Plastic recycling",
  },
  textile: {
    label: "Textile",
    recyclingGroup: "Textile reuse or recycling",
  },
};
import type { WasteCategory } from "../services/wastewiseClassifier.ts";

export type TestingCase = {
  id: string;
  item: string;
  expectedCategory: WasteCategory;
  notes: string;
};

export const testingCases: TestingCase[] = [
  {
    id: "test-01",
    item: "AA battery",
    expectedCategory: "battery",
    notes: "Take a clear photo with the battery filling most of the frame.",
  },
  {
    id: "test-02",
    item: "Cardboard box",
    expectedCategory: "paper_cardboard",
    notes: "Use clean and dry cardboard.",
  },
  {
    id: "test-03",
    item: "Glass jar",
    expectedCategory: "glass",
    notes: "Use good lighting and one item in the photo.",
  },
  {
    id: "test-04",
    item: "Aluminium can",
    expectedCategory: "metal",
    notes: "Make the can clearly visible.",
  },
  {
    id: "test-05",
    item: "Banana peel",
    expectedCategory: "organic_waste",
    notes: "Avoid including other objects in the frame.",
  },
  {
    id: "test-06",
    item: "Plastic bottle",
    expectedCategory: "plastic",
    notes: "Use a plain background where possible.",
  },
  {
    id: "test-07",
    item: "Old T-shirt",
    expectedCategory: "textile",
    notes: "Place the item flat or make it clearly visible.",
  },
  {
    id: "test-08",
    item: "Used tissue",
    expectedCategory: "general_waste",
    notes: "This tests the general-waste category.",
  },
];
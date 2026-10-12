# Wastewise ML workspace

This folder is separate from the Expo app. The raw image dataset stays outside
the repository, and generated training data and model files are ignored by Git.

## Source dataset

Use this local source directory without modifying it:

```text
/Users/mac/Downloads/Merged Waste Classification Dataset (MWCD)/final_merged_dataset
```

## First model labels

| Model label | Source folder or folders |
| --- | --- |
| `battery` | `battery` |
| `paper_cardboard` | `paper` and `cardboard` |
| `glass` | `glass` |
| `metal` | `metal` |
| `organic_waste` | `organic` |
| `plastic` | `plastic` |
| `textile` | `textile` |
| `general_waste` | `trash` |

## Workflow

1. Keep the source dataset unchanged.
2. Create a balanced, generated subset under `ml/data/`.
3. Split that subset into training, validation, and test sets.
4. Train and evaluate MobileNetV3-Small locally.
5. Export the validated model for ExecuTorch.

The Expo app will receive the exported model later. It should not contain the
full training image dataset.

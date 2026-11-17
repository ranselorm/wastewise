"""Export the evaluated v4 classifier for Android only after sign-off."""

from pathlib import Path

import export_executorch as exporter


exporter.MODEL_ROOT = Path("ml/models/v4")
exporter.PYTORCH_MODEL_PATH = exporter.MODEL_ROOT / "wastewise_mobilenet_v3_small.pt"
exporter.CLASSES_PATH = exporter.MODEL_ROOT / "wastewise_classes.json"
exporter.EXECUTORCH_MODEL_PATH = (
    exporter.MODEL_ROOT / "wastewise_mobilenet_v3_small.pte"
)


if __name__ == "__main__":
    exporter.main()

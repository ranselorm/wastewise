"""Export the evaluated nine-class v3 classifier for Android."""

from pathlib import Path

import export_executorch as exporter


exporter.MODEL_ROOT = Path("ml/models/v3")
exporter.PYTORCH_MODEL_PATH = exporter.MODEL_ROOT / "wastewise_mobilenet_v3_small.pt"
exporter.CLASSES_PATH = exporter.MODEL_ROOT / "wastewise_classes.json"
exporter.EXECUTORCH_MODEL_PATH = (
    exporter.MODEL_ROOT / "wastewise_mobilenet_v3_small.pte"
)


if __name__ == "__main__":
    exporter.main()

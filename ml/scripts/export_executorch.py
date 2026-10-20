"""Export the trained Wastewise classifier to an ExecuTorch .pte file."""

from pathlib import Path
import json

import torch
from torch import nn
from torchvision import models

from executorch.backends.xnnpack.partition.xnnpack_partitioner import (
    XnnpackPartitioner,
)
from executorch.exir import to_edge_transform_and_lower


MODEL_ROOT = Path("ml/models")

# The PyTorch weights produced by train_model.py.
PYTORCH_MODEL_PATH = MODEL_ROOT / "wastewise_mobilenet_v3_small.pt"
CLASSES_PATH = MODEL_ROOT / "wastewise_classes.json"

# The Android-ready ExecuTorch model this script creates.
EXECUTORCH_MODEL_PATH = MODEL_ROOT / "wastewise_mobilenet_v3_small.pte"


def main() -> None:
    # Read the class names so the final MobileNet layer has eight outputs.
    class_names = json.loads(CLASSES_PATH.read_text())

    # Rebuild the same MobileNetV3-Small structure used during training.
    model = models.mobilenet_v3_small(weights=None)

    old_final_layer = model.classifier[3]
    model.classifier[3] = nn.Linear(
        old_final_layer.in_features,
        len(class_names),
    )

    # Load the learned Wastewise weights.
    model.load_state_dict(
        torch.load(PYTORCH_MODEL_PATH, map_location="cpu", weights_only=True)
    )
    model.eval()

    # This represents one prepared phone image:
    # batch size 1, RGB colour channels, 224 x 224 pixels.
    example_input = (torch.randn(1, 3, 224, 224),)

    # 1. Convert PyTorch model into an exportable graph.
    exported_program = torch.export.export(model, example_input)

    # 2. Lower it for XNNPACK: a practical Android CPU backend.
    executorch_program = to_edge_transform_and_lower(
        exported_program,
        partitioner=[XnnpackPartitioner()],
    ).to_executorch()

    # 3. Save the mobile-ready model file.
    EXECUTORCH_MODEL_PATH.write_bytes(executorch_program.buffer)

    model_size_mb = EXECUTORCH_MODEL_PATH.stat().st_size / 1024 / 1024

    print("ExecuTorch export complete.")
    print(f"Model file: {EXECUTORCH_MODEL_PATH}")
    print(f"Model size: {model_size_mb:.2f} MB")
    print(f"Categories: {class_names}")


if __name__ == "__main__":
    main()
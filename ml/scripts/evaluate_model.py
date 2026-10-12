"""Evaluate the saved Wastewise model on the untouched test images."""

from pathlib import Path
import json

import matplotlib.pyplot as plt
import pandas as pd
import torch
from sklearn.metrics import classification_report, confusion_matrix
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms


DATA_ROOT = Path("ml/data/splits")
MODEL_ROOT = Path("ml/models")
REPORTS_ROOT = Path("ml/reports")

MODEL_PATH = MODEL_ROOT / "wastewise_mobilenet_v3_small.pt"
CLASSES_PATH = MODEL_ROOT / "wastewise_classes.json"

BATCH_SIZE = 32


def get_device() -> torch.device:
    """Use the M1 GPU when possible."""
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def main() -> None:
    device = get_device()
    REPORTS_ROOT.mkdir(parents=True, exist_ok=True)

    # Load the category order saved during training.
    class_names = json.loads(CLASSES_PATH.read_text())

    normalise = transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    )

    test_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            normalise,
        ]
    )

    test_data = datasets.ImageFolder(DATA_ROOT / "test", test_transform)

    if test_data.classes != class_names:
        raise ValueError("Test folder category order does not match the trained model.")

    test_loader = DataLoader(
        test_data,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0,
    )

    # Recreate the same MobileNet structure used during training.
    model = models.mobilenet_v3_small(weights=None)
    old_final_layer = model.classifier[3]
    model.classifier[3] = nn.Linear(
        old_final_layer.in_features,
        len(class_names),
    )

    model.load_state_dict(
        torch.load(MODEL_PATH, map_location=device, weights_only=True)
    )
    model = model.to(device)
    model.eval()

    true_labels = []
    predicted_labels = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)

            scores = model(images)
            predictions = scores.argmax(dim=1).cpu().tolist()

            true_labels.extend(labels.tolist())
            predicted_labels.extend(predictions)

    # Overall accuracy.
    correct = sum(
        predicted == actual
        for predicted, actual in zip(predicted_labels, true_labels)
    )
    accuracy = correct / len(true_labels)

    # Per-category precision, recall, and F1 score.
    report = classification_report(
        true_labels,
        predicted_labels,
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )

    report_path = REPORTS_ROOT / "classification_report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n")

    # Shows which categories the model confuses with each other.
    matrix = confusion_matrix(true_labels, predicted_labels)
    matrix_table = pd.DataFrame(
        matrix,
        index=class_names,
        columns=class_names,
    )
    matrix_table.to_csv(REPORTS_ROOT / "confusion_matrix.csv")

    # Save a visual version for the final presentation/report.
    figure, axis = plt.subplots(figsize=(10, 8))
    image = axis.imshow(matrix, cmap="Blues")
    figure.colorbar(image)

    axis.set(
        xticks=range(len(class_names)),
        yticks=range(len(class_names)),
        xticklabels=class_names,
        yticklabels=class_names,
        xlabel="Predicted category",
        ylabel="Actual category",
        title="Wastewise classifier: confusion matrix",
    )

    plt.setp(axis.get_xticklabels(), rotation=45, ha="right")

    for row in range(len(class_names)):
        for column in range(len(class_names)):
            axis.text(
                column,
                row,
                str(matrix[row, column]),
                ha="center",
                va="center",
            )

    figure.tight_layout()
    figure.savefig(REPORTS_ROOT / "confusion_matrix.png", dpi=200)
    plt.close(figure)

    print(f"Test accuracy: {accuracy:.1%}")
    print(f"Report: {report_path}")
    print(f"Matrix CSV: {REPORTS_ROOT / 'confusion_matrix.csv'}")
    print(f"Matrix image: {REPORTS_ROOT / 'confusion_matrix.png'}")


if __name__ == "__main__":
    main()
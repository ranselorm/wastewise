"""Train Wastewise's eight-category MobileNetV3-Small classifier."""

from pathlib import Path
import json
import random

import torch
from torch import nn, optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms


# Folders created by the earlier preparation scripts.
DATA_ROOT = Path("ml/data/splits")
MODEL_ROOT = Path("ml/models")

# Files created after training.
MODEL_PATH = MODEL_ROOT / "wastewise_mobilenet_v3_small.pt"
CLASSES_PATH = MODEL_ROOT / "wastewise_classes.json"
HISTORY_PATH = MODEL_ROOT / "training_history.json"

# First-run training settings.
SEED = 42
BATCH_SIZE = 32
EPOCHS = 8
LEARNING_RATE = 0.001


def get_device() -> torch.device:
    """Use the M1 GPU when available; otherwise use the CPU."""
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def make_loaders() -> tuple[DataLoader, DataLoader, DataLoader, list[str]]:
    """Load train, validation, and test images from their category folders."""
    # These values match the pretrained MobileNet model's expected input format.
    normalise = transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    )

    # Gentle variation helps the model handle normal phone-photo differences.
    train_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.RandomResizedCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            normalise,
        ]
    )

    # Validation and test images stay predictable for fair measurement.
    evaluation_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            normalise,
        ]
    )

    train_data = datasets.ImageFolder(DATA_ROOT / "train", train_transform)
    val_data = datasets.ImageFolder(DATA_ROOT / "val", evaluation_transform)
    test_data = datasets.ImageFolder(DATA_ROOT / "test", evaluation_transform)

    # Every split must use exactly the same category order.
    if train_data.classes != val_data.classes or train_data.classes != test_data.classes:
        raise ValueError("The category folders do not match across the three splits.")

    train_loader = DataLoader(
        train_data,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=0,
    )
    val_loader = DataLoader(
        val_data,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0,
    )
    test_loader = DataLoader(
        test_data,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0,
    )

    return train_loader, val_loader, test_loader, train_data.classes


def get_accuracy(
    model: nn.Module,
    loader: DataLoader,
    device: torch.device,
) -> float:
    """Measure how many images the model classifies correctly."""
    model.eval()

    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)

            scores = model(images)
            predictions = scores.argmax(dim=1)

            correct += (predictions == labels).sum().item()
            total += labels.size(0)

    return correct / total


def main() -> None:
    random.seed(SEED)
    torch.manual_seed(SEED)

    device = get_device()
    print(f"Training device: {device}")

    train_loader, val_loader, test_loader, class_names = make_loaders()

    print(f"Categories: {class_names}")
    print(f"Training images: {len(train_loader.dataset)}")
    print(f"Validation images: {len(val_loader.dataset)}")
    print(f"Test images: {len(test_loader.dataset)}")

    # Downloads pretrained MobileNetV3-Small weights automatically on first run.
    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)

    # Replace MobileNet's original 1,000-category final layer with our 8 classes.
    old_final_layer = model.classifier[3]
    model.classifier[3] = nn.Linear(
        old_final_layer.in_features,
        len(class_names),
    )
    model = model.to(device)

    loss_function = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    MODEL_ROOT.mkdir(parents=True, exist_ok=True)

    best_val_accuracy = -1.0
    history = []

    for epoch in range(EPOCHS):
        model.train()

        total_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            # Learn from one batch of images.
            optimizer.zero_grad()
            scores = model(images)
            loss = loss_function(scores, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * labels.size(0)
            predictions = scores.argmax(dim=1)
            correct += (predictions == labels).sum().item()
            total += labels.size(0)

        train_loss = total_loss / total
        train_accuracy = correct / total
        val_accuracy = get_accuracy(model, val_loader, device)

        epoch_result = {
            "epoch": epoch + 1,
            "train_loss": train_loss,
            "train_accuracy": train_accuracy,
            "validation_accuracy": val_accuracy,
        }
        history.append(epoch_result)

        print(
            f"Epoch {epoch + 1}/{EPOCHS} | "
            f"loss: {train_loss:.4f} | "
            f"train: {train_accuracy:.1%} | "
            f"validation: {val_accuracy:.1%}"
        )

        # Save only the model that performs best on unseen validation images.
        if val_accuracy > best_val_accuracy:
            best_val_accuracy = val_accuracy
            torch.save(model.state_dict(), MODEL_PATH)
            CLASSES_PATH.write_text(json.dumps(class_names, indent=2) + "\n")
            print("Saved best model so far.")

    HISTORY_PATH.write_text(json.dumps(history, indent=2) + "\n")

    # Use the untouched test set only after training is complete.
    model.load_state_dict(
        torch.load(MODEL_PATH, map_location=device, weights_only=True)
    )
    test_accuracy = get_accuracy(model, test_loader, device)

    print(f"\nBest validation accuracy: {best_val_accuracy:.1%}")
    print(f"Final test accuracy: {test_accuracy:.1%}")
    print(f"Model: {MODEL_PATH}")
    print(f"Categories: {CLASSES_PATH}")
    print(f"History: {HISTORY_PATH}")


if __name__ == "__main__":
    main()
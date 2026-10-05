"""Train Wastewise's eight-category image classifier.

This uses transfer learning: MobileNetV3-Small starts with general image
knowledge, then learns Wastewise's eight waste categories from our images.
"""

from pathlib import Path
import json
import random

import torch
from torch import nn, optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms


# ----- Project settings ----------------------------------------------------

# The dataset created by split_dataset.py.
DATA_FOLDER = Path("ml/data/splits")

# Where the trained model and its category order will be saved.
MODEL_FOLDER = Path("ml/models")
MODEL_FILE = MODEL_FOLDER / "wastewise_mobilenet_v3_small.pt"
CLASSES_FILE = MODEL_FOLDER / "wastewise_classes.json"

# A fixed seed makes the order of training examples repeatable.
RANDOM_SEED = 42

# Keep this small for the first training run on an M1 Mac.
BATCH_SIZE = 32
EPOCHS = 8
LEARNING_RATE = 0.001


def choose_device() -> torch.device:
    """Use the M1 GPU when PyTorch's MPS support is available."""
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def make_data_loaders() -> tuple[DataLoader, DataLoader, DataLoader, list[str]]:
    """Load train, validation, and test images from their folder structure."""
    # MobileNet was pretrained on ImageNet images. These values prepare our
    # images in the same numerical format that it expects.
    normalise = transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    )

    # Training images get gentle variation. This helps the model handle a
    # different angle or left/right orientation in a real phone photo.
    train_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.RandomResizedCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            normalise,
        ]
    )

    # Validation and test images stay consistent. We use them to measure the
    # model fairly, not to create extra training variation.
    evaluation_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            normalise,
        ]
    )

    train_data = datasets.ImageFolder(DATA_FOLDER / "train", train_transform)
    validation_data = datasets.ImageFolder(
        DATA_FOLDER / "val", evaluation_transform
    )
    test_data = datasets.ImageFolder(DATA_FOLDER / "test", evaluation_transform)

    # ImageFolder assigns a number to each folder name. All three sets must
    # use exactly the same category order or their labels would be wrong.
    if train_data.classes != validation_data.classes or train_data.classes != test_data.classes:
        raise ValueError("Train, validation, and test category folders do not match.")

    # num_workers=0 is deliberate: it is the simplest reliable starting point
    # on macOS. We can tune it later only if we need more speed.
    train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    validation_loader = DataLoader(
        validation_data, batch_size=BATCH_SIZE, shuffle=False, num_workers=0
    )
    test_loader = DataLoader(test_data, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    return train_loader, validation_loader, test_loader, train_data.classes


def measure_accuracy(
    model: nn.Module, data_loader: DataLoader, device: torch.device
) -> float:
    """Return the percentage of images the current model classifies correctly."""
    model.eval()  # Evaluation mode: no learning or training-only behaviour.
    correct_predictions = 0
    total_images = 0

    # We are measuring only, so PyTorch does not need to calculate gradients.
    with torch.no_grad():
        for images, labels in data_loader:
            images = images.to(device)
            labels = labels.to(device)

            scores = model(images)
            predicted_labels = scores.argmax(dim=1)

            correct_predictions += (predicted_labels == labels).sum().item()
            total_images += labels.size(0)

    return correct_predictions / total_images


def main() -> None:
    random.seed(RANDOM_SEED)
    torch.manual_seed(RANDOM_SEED)

    device = choose_device()
    print(f"Training device: {device}")

    train_loader, validation_loader, test_loader, class_names = make_data_loaders()
    print(f"Categories: {class_names}")
    print(f"Training images: {len(train_loader.dataset)}")
    print(f"Validation images: {len(validation_loader.dataset)}")
    print(f"Test images: {len(test_loader.dataset)}")

    # DEFAULT downloads MobileNetV3-Small's pretrained weights the first time.
    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)

    # MobileNet's final layer originally predicted 1,000 ImageNet categories.
    # Replace it with a new layer that predicts our eight Wastewise categories.
    final_layer = model.classifier[3]
    model.classifier[3] = nn.Linear(final_layer.in_features, len(class_names))
    model = model.to(device)

    # CrossEntropyLoss rewards the correct category being given the highest score.
    loss_function = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    MODEL_FOLDER.mkdir(parents=True, exist_ok=True)
    best_validation_accuracy = 0.0

    for epoch in range(EPOCHS):
        model.train()  # Training mode: weights can now be updated.
        running_loss = 0.0
        correct_predictions = 0
        total_images = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            # Clear old gradients, make predictions, measure the error,
            # then adjust the model weights to reduce that error.
            optimizer.zero_grad()
            scores = model(images)
            loss = loss_function(scores, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * labels.size(0)
            predicted_labels = scores.argmax(dim=1)
            correct_predictions += (predicted_labels == labels).sum().item()
            total_images += labels.size(0)

        training_loss = running_loss / total_images
        training_accuracy = correct_predictions / total_images
        validation_accuracy = measure_accuracy(model, validation_loader, device)

        print(
            f"Epoch {epoch + 1}/{EPOCHS} | "
            f"loss: {training_loss:.4f} | "
            f"train accuracy: {training_accuracy:.1%} | "
            f"validation accuracy: {validation_accuracy:.1%}"
        )

        # Keep the version that works best on unseen validation images.
        if validation_accuracy > best_validation_accuracy:
            best_validation_accuracy = validation_accuracy
            torch.save(model.state_dict(), MODEL_FILE)
            CLASSES_FILE.write_text(json.dumps(class_names, indent=2) + "\n")
            print("Saved this as the best model so far.")

    # Load the best saved version, then use the untouched test set once.
    model.load_state_dict(torch.load(MODEL_FILE, map_location=device))
    test_accuracy = measure_accuracy(model, test_loader, device)

    print(f"\nBest validation accuracy: {best_validation_accuracy:.1%}")
    print(f"Final test accuracy: {test_accuracy:.1%}")
    print(f"Model saved to: {MODEL_FILE}")
    print(f"Category order saved to: {CLASSES_FILE}")


if __name__ == "__main__":
    main()

"""Split Wastewise's balanced image data into train, validation, and test sets.

This script COPIES images. It never changes the original dataset in Downloads,
and it also keeps the balanced copy in ml/data/balanced intact.
"""

from pathlib import Path
import csv
import random
import shutil


# Where the 8,000 balanced images currently live.
SOURCE_FOLDER = Path("ml/data/balanced")

# Where this script will create train/, val/, and test/ folders.
SPLITS_FOLDER = Path("ml/data/splits")

# A small record of which image went into which group.
MANIFEST_FILE = Path("ml/data/splits_manifest.csv")

# Setting a seed makes our random split repeatable.
# If we run from the same balanced dataset again, 42 gives the same result.
RANDOM_SEED = 42

# Every category has 1,000 images. We use 70% / 15% / 15%.
TRAIN_COUNT = 700
VALIDATION_COUNT = 150
# The remaining 150 images automatically become the test set.


def get_images(category_folder: Path) -> list[Path]:
    """Get the image files inside one category folder, such as battery/."""
    return [file for file in category_folder.iterdir() if file.is_file()]


def copy_images(
    images: list[Path],
    category_name: str,
    split_name: str,
    records: list[dict[str, str]],
) -> None:
    """Copy one group of images and remember where each one was placed."""
    destination_folder = SPLITS_FOLDER / split_name / category_name
    destination_folder.mkdir(parents=True, exist_ok=True)

    for image in images:
        copied_image = destination_folder / image.name
        shutil.copy2(image, copied_image)

        records.append(
            {
                "split": split_name,
                "category": category_name,
                "source_image": str(image),
                "copied_image": str(copied_image),
            }
        )


def main() -> None:
    # Safety check: do not mix a fresh split with files from an older split.
    if SPLITS_FOLDER.exists() and any(SPLITS_FOLDER.iterdir()):
        raise SystemExit(
            "ml/data/splits already has files. Stop here so we do not mix splits."
        )

    # This creates a repeatable random shuffler.
    random_generator = random.Random(RANDOM_SEED)
    records: list[dict[str, str]] = []

    # Work through each of the eight category folders one at a time.
    for category_folder in sorted(SOURCE_FOLDER.iterdir()):
        if not category_folder.is_dir():
            continue

        category_name = category_folder.name
        images = get_images(category_folder)

        # We deliberately prepared 1,000 images per category earlier.
        if len(images) != 1000:
            raise ValueError(
                f"{category_name} has {len(images)} images. Expected exactly 1,000."
            )

        # Mix the files before choosing train, validation, and test images.
        random_generator.shuffle(images)

        train_images = images[:TRAIN_COUNT]
        validation_images = images[TRAIN_COUNT : TRAIN_COUNT + VALIDATION_COUNT]
        test_images = images[TRAIN_COUNT + VALIDATION_COUNT :]

        copy_images(train_images, category_name, "train", records)
        copy_images(validation_images, category_name, "val", records)
        copy_images(test_images, category_name, "test", records)

        print(
            f"{category_name}: "
            f"{len(train_images)} train, "
            f"{len(validation_images)} validation, "
            f"{len(test_images)} test"
        )

    # Save a simple audit trail of every copied image.
    with MANIFEST_FILE.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)

    print(f"\nFinished: {len(records)} images copied into {SPLITS_FOLDER}")
    print(f"Manifest saved to: {MANIFEST_FILE}")


if __name__ == "__main__":
    # This runs main() only when we execute this file directly.
    main()

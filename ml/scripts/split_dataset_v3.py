"""Create reproducible 70/15/15 splits for Wastewise's v3 dataset.

Unlike the legacy splitter, this supports the smaller E-waste class while
keeping every original image in exactly one split.
"""

from pathlib import Path
import csv
import random
import shutil


SOURCE_ROOT = Path("ml/data/v3/prepared")
SPLITS_ROOT = Path("ml/data/v3/splits")
MANIFEST_PATH = Path("ml/data/v3/splits_manifest.csv")
RANDOM_SEED = 42


def image_files(folder: Path) -> list[Path]:
    return sorted(path for path in folder.iterdir() if path.is_file())


def write_split(
    images: list[Path], category: str, split: str, records: list[dict[str, str]]
) -> None:
    destination = SPLITS_ROOT / split / category
    destination.mkdir(parents=True, exist_ok=True)

    for image in images:
        copied = destination / image.name
        shutil.copy2(image, copied)
        records.append(
            {
                "split": split,
                "category": category,
                "source_image": str(image),
                "copied_image": str(copied),
            }
        )


def main() -> None:
    if SPLITS_ROOT.exists() and any(SPLITS_ROOT.iterdir()):
        raise SystemExit(
            f"{SPLITS_ROOT} already contains files. Use a fresh v4 folder rather "
            "than mixing two dataset versions."
        )

    random_generator = random.Random(RANDOM_SEED)
    records: list[dict[str, str]] = []

    for category_folder in sorted(SOURCE_ROOT.iterdir()):
        if not category_folder.is_dir():
            continue

        images = image_files(category_folder)
        if len(images) < 20:
            raise ValueError(f"{category_folder.name} has too few images: {len(images)}")

        random_generator.shuffle(images)
        total = len(images)
        train_end = int(total * 0.70)
        validation_end = train_end + int(total * 0.15)

        train_images = images[:train_end]
        validation_images = images[train_end:validation_end]
        test_images = images[validation_end:]

        write_split(train_images, category_folder.name, "train", records)
        write_split(validation_images, category_folder.name, "val", records)
        write_split(test_images, category_folder.name, "test", records)

        print(
            f"{category_folder.name}: {len(train_images)} train, "
            f"{len(validation_images)} validation, {len(test_images)} test"
        )

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MANIFEST_PATH.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)

    print(f"\nFinished: {len(records)} images copied into {SPLITS_ROOT}")
    print(f"Manifest saved to: {MANIFEST_PATH}")


if __name__ == "__main__":
    main()

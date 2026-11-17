"""Create reproducible 70/15/15 train, validation and test splits for v4."""

from pathlib import Path
import csv
import random
import shutil


SOURCE_ROOT = Path("ml/data/v4/prepared")
SPLITS_ROOT = Path("ml/data/v4/splits")
MANIFEST_PATH = Path("ml/data/v4/splits_manifest.csv")
RANDOM_SEED = 42


def image_files(folder: Path) -> list[Path]:
    return sorted(path for path in folder.iterdir() if path.is_file())


def copy_split(
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
        # The first v4 run may have completed every copy before a later
        # manifest-writing error. Recover that safe, complete split rather than
        # deleting data or copying images a second time.
        if MANIFEST_PATH.exists() and MANIFEST_PATH.stat().st_size > 0:
            raise SystemExit(f"{SPLITS_ROOT} already contains a completed split.")

        records: list[dict[str, str]] = []
        for split_folder in sorted(SPLITS_ROOT.iterdir()):
            if not split_folder.is_dir():
                continue
            for category_folder in sorted(split_folder.iterdir()):
                if not category_folder.is_dir():
                    continue
                for copied in image_files(category_folder):
                    records.append(
                        {
                            "split": split_folder.name,
                            "category": category_folder.name,
                            "source_image": str(SOURCE_ROOT / category_folder.name / copied.name),
                            "copied_image": str(copied),
                        }
                    )
        with MANIFEST_PATH.open("w", newline="", encoding="utf-8") as output_file:
            writer = csv.DictWriter(f=output_file, fieldnames=records[0].keys())
            writer.writeheader()
            writer.writerows(records)
        print(f"Recovered manifest for {len(records)} existing split images.")
        print(f"Manifest: {MANIFEST_PATH}")
        return

    random_generator = random.Random(RANDOM_SEED)
    records: list[dict[str, str]] = []
    for category_folder in sorted(SOURCE_ROOT.iterdir()):
        if not category_folder.is_dir():
            continue
        images = image_files(category_folder)
        if len(images) < 20:
            raise ValueError(f"{category_folder.name} has too few images: {len(images)}")

        random_generator.shuffle(images)
        train_end = int(len(images) * 0.70)
        validation_end = train_end + int(len(images) * 0.15)
        copy_split(images[:train_end], category_folder.name, "train", records)
        copy_split(images[train_end:validation_end], category_folder.name, "val", records)
        copy_split(images[validation_end:], category_folder.name, "test", records)
        print(
            f"{category_folder.name}: {train_end} train, "
            f"{validation_end - train_end} validation, {len(images) - validation_end} test"
        )

    with MANIFEST_PATH.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.DictWriter(f=output_file, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)
    print(f"\nFinished: {len(records)} images copied into {SPLITS_ROOT}")
    print(f"Manifest: {MANIFEST_PATH}")


if __name__ == "__main__":
    main()

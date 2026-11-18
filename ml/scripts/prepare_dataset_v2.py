# ml/scripts/prepare_dataset_v2.py
#
# Purpose:
# Build a clean working copy for the next model-training step.
#
# It uses:
# - The large merged dataset for the original eight categories.
# - The new raw_data folder for the e-waste category.
#
# Safety:
# - Never edits, moves or deletes downloaded images.
# - Only copies selected images into ml/data/v2/prepared/.
# - Skips exact duplicates and any conflicting labels.
#
# Run from the project root:
# python ml/scripts/prepare_dataset_v2.py

from collections import Counter, defaultdict
from pathlib import Path
import csv
import hashlib
import random
import shutil


# Large original dataset: has eight categories, but no e-waste.
PRIMARY_ROOT = Path(
    "/Users/mac/Downloads/Merged Waste Classification Dataset (MWCD)"
    "/final_merged_dataset"
)

# New dataset: we use its e-waste images as the ninth category.
EWASTE_ROOT = Path("/Users/mac/Downloads/raw_data/e-waste")

# New working copy. The downloaded folders are never changed.
OUTPUT_ROOT = Path("ml/data/v2/prepared")
MANIFEST_PATH = Path("ml/data/v2/prepared_manifest.csv")

# A fixed seed means we can reproduce the same selected images later.
RANDOM_SEED = 42

# Number of images to use from each of the established large categories.
# E-waste uses every unique image currently available.
MAX_IMAGES_PER_ESTABLISHED_CATEGORY = 1200

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# Folder name in the large dataset -> category used by the app/model.
PRIMARY_CATEGORY_MAP = {
    "battery": "battery",
    "cardboard": "paper_cardboard",
    "glass": "glass",
    "metal": "metal",
    "organic": "organic_waste",
    "paper": "paper_cardboard",
    "plastic": "plastic",
    "textile": "textile",
    "trash": "general_waste",
}

EXPECTED_CATEGORIES = {
    "battery",
    "e-waste",
    "general_waste",
    "glass",
    "metal",
    "organic_waste",
    "paper_cardboard",
    "plastic",
    "textile",
}


def is_image(path: Path) -> bool:
    """Return True only for supported image files."""
    return path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS


def file_hash(path: Path) -> str:
    """
    Create a fingerprint for an image.

    Files with matching fingerprints are exact duplicates.
    """
    digest = hashlib.sha256()

    with path.open("rb") as image_file:
        while chunk := image_file.read(1024 * 1024):
            digest.update(chunk)

    return digest.hexdigest()


def collect_images(folder: Path, category: str, source_name: str) -> list[dict]:
    """
    Read image paths from one source folder.

    This only reads files. It does not alter the source folder.
    """
    records = []

    for image_path in sorted(folder.rglob("*")):
        if not is_image(image_path):
            continue

        records.append(
            {
                "source_path": image_path,
                "category": category,
                "source_name": source_name,
                "sha256": file_hash(image_path),
            }
        )

    return records


def main() -> None:
    random.seed(RANDOM_SEED)

    # Stop rather than mixing a new run with an old prepared dataset.
    if OUTPUT_ROOT.exists() and any(OUTPUT_ROOT.iterdir()):
        raise SystemExit(
            f"{OUTPUT_ROOT} already contains prepared images.\n"
            "Review that folder before creating another prepared dataset."
        )

    if not PRIMARY_ROOT.exists():
        raise FileNotFoundError(f"Large dataset not found: {PRIMARY_ROOT}")

    if not EWASTE_ROOT.exists():
        raise FileNotFoundError(f"E-waste folder not found: {EWASTE_ROOT}")

    all_records = []

    # Read the eight established categories from the large dataset.
    for source_folder, category in PRIMARY_CATEGORY_MAP.items():
        folder = PRIMARY_ROOT / source_folder

        if not folder.exists():
            raise FileNotFoundError(f"Missing source folder: {folder}")

        all_records.extend(
            collect_images(
                folder=folder,
                category=category,
                source_name=f"merged_dataset/{source_folder}",
            )
        )

    # Read the new e-waste images from raw_data.
    all_records.extend(
        collect_images(
            folder=EWASTE_ROOT,
            category="e-waste",
            source_name="raw_data/e-waste",
        )
    )

    # Group records by file fingerprint so exact duplicates can be removed.
    records_by_hash = defaultdict(list)

    for record in all_records:
        records_by_hash[record["sha256"]].append(record)

    clean_records = []
    skipped_conflicts = 0
    skipped_duplicates = 0

    for same_hash_records in records_by_hash.values():
        categories = {record["category"] for record in same_hash_records}

        # The same image must never train with two different labels.
        if len(categories) > 1:
            skipped_conflicts += len(same_hash_records)
            continue

        # Keep just one copy of each exact duplicate image.
        canonical_record = min(
            same_hash_records,
            key=lambda record: str(record["source_path"]),
        )

        clean_records.append(canonical_record)
        skipped_duplicates += len(same_hash_records) - 1

    # Group the clean images by model category.
    images_by_category = defaultdict(list)

    for record in clean_records:
        images_by_category[record["category"]].append(record)

    # Check every expected category has at least one usable image.
    missing_categories = sorted(
        category
        for category in EXPECTED_CATEGORIES
        if not images_by_category[category]
    )

    if missing_categories:
        raise ValueError(f"No usable images for: {missing_categories}")

    # Create the new output folders.
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    selected_records = []

    for category in sorted(EXPECTED_CATEGORIES):
        candidates = images_by_category[category]

        # E-waste has a small collection, so keep every clean e-waste image.
        # Other categories are capped to keep training time manageable.
        if category == "e-waste":
            selected = candidates
        else:
            sample_size = min(MAX_IMAGES_PER_ESTABLISHED_CATEGORY, len(candidates))
            selected = random.sample(candidates, sample_size)

        category_output_folder = OUTPUT_ROOT / category
        category_output_folder.mkdir(exist_ok=True)

        for index, record in enumerate(selected, start=1):
            source_path = record["source_path"]

            # A hash-based name prevents filename clashes between source folders.
            destination_name = (
                f"{index:05d}_{record['sha256'][:12]}"
                f"{source_path.suffix.lower()}"
            )
            destination_path = category_output_folder / destination_name

            # Copy only: the original image remains untouched.
            shutil.copy2(source_path, destination_path)

            selected_records.append(
                {
                    "category": category,
                    "source_name": record["source_name"],
                    "source_path": str(source_path),
                    "copied_path": str(destination_path),
                    "sha256": record["sha256"],
                }
            )

    # Save a record of every image that entered the working training copy.
    with MANIFEST_PATH.open("w", newline="", encoding="utf-8") as output_file:
        fieldnames = [
            "category",
            "source_name",
            "source_path",
            "copied_path",
            "sha256",
        ]

        writer = csv.DictWriter(output_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(selected_records)

    selected_counts = Counter(record["category"] for record in selected_records)

    print("\nPREPARED DATASET")
    print("=" * 50)
    print(f"Clean source images found: {len(clean_records)}")
    print(f"Exact duplicate files skipped: {skipped_duplicates}")
    print(f"Conflicting-label files skipped: {skipped_conflicts}")

    print("\nImages copied for each category:")
    for category in sorted(EXPECTED_CATEGORIES):
        print(f"  {category}: {selected_counts[category]}")

    print(f"\nPrepared images: {OUTPUT_ROOT}")
    print(f"Manifest: {MANIFEST_PATH}")

    print(
        "\nNote: e-waste currently has fewer original images than other categories. "
        "The training script will compensate with augmentation and balanced sampling."
    )


if __name__ == "__main__":
    main()
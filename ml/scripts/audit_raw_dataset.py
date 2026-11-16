# ml/scripts/audit_raw_dataset.py
#
# Purpose:
# Check the raw image dataset before training.
#
# This script:
# - Never edits, moves, or deletes your downloaded images.
# - Confirms the nine app categories are present.
# - Removes accidental spaces from folder names while checking categories.
# - Counts images per category.
# - Finds exact duplicate files.
# - Writes a simple report inside ml/data/raw_audit/.
#
# Run from the project root:
# python ml/scripts/audit_raw_dataset.py

from collections import Counter, defaultdict
from pathlib import Path
import csv
import hashlib
import json


# The downloaded dataset. This folder is read-only.
SOURCE_ROOT = Path("/Users/mac/Downloads/raw_data")

# Reports are saved here. This does NOT affect the original dataset.
OUTPUT_ROOT = Path("ml/data/raw_audit")
MANIFEST_PATH = OUTPUT_ROOT / "raw_manifest.csv"
REPORT_PATH = OUTPUT_ROOT / "raw_audit_report.json"

# These are the nine categories the updated model will support.
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

# Only these file types count as images.
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def is_image(path: Path) -> bool:
    """Return True when a file has a supported image extension."""
    return path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS


def file_hash(path: Path) -> str:
    """
    Create a fingerprint for one image.

    Matching fingerprints mean the files are exact duplicates.
    The original image files are never changed.
    """
    digest = hashlib.sha256()

    with path.open("rb") as image_file:
        while chunk := image_file.read(1024 * 1024):
            digest.update(chunk)

    return digest.hexdigest()


def main() -> None:
    # Stop early if the downloaded folder cannot be found.
    if not SOURCE_ROOT.exists():
        raise FileNotFoundError(f"Dataset folder not found: {SOURCE_ROOT}")

    # Find category folders. strip() removes accidental spaces in folder names.
    category_folders = sorted(
        folder for folder in SOURCE_ROOT.iterdir() if folder.is_dir()
    )
    found_categories = {folder.name.strip() for folder in category_folders}

    # Show any unexpected or missing category folders before training.
    missing_categories = sorted(EXPECTED_CATEGORIES - found_categories)
    unexpected_categories = sorted(found_categories - EXPECTED_CATEGORIES)

    records = []
    hashes_to_records = defaultdict(list)

    # Read every image and collect simple facts about it.
    for category_folder in category_folders:
        # Use a clean category name even if the download folder has extra spaces.
        category = category_folder.name.strip()

        # Ignore folders that are not one of our nine supported categories.
        if category not in EXPECTED_CATEGORIES:
            continue

        for image_path in sorted(category_folder.rglob("*")):
            if not is_image(image_path):
                continue

            record = {
                "source_path": str(image_path),
                "category": category,
                "size_bytes": image_path.stat().st_size,
                "sha256": file_hash(image_path),
            }

            records.append(record)
            hashes_to_records[record["sha256"]].append(record)

    # Mark one canonical file for each duplicate group.
    # Files with the same image but different labels are excluded for review.
    for same_hash_records in hashes_to_records.values():
        categories_in_group = {item["category"] for item in same_hash_records}

        if len(categories_in_group) > 1:
            status = "label_conflict"
        elif len(same_hash_records) == 1:
            status = "unique"
        else:
            status = "duplicate"

        # The alphabetically first path becomes the one kept for later preparation.
        canonical_path = min(item["source_path"] for item in same_hash_records)

        for item in same_hash_records:
            item["duplicate_status"] = status
            item["duplicate_group_size"] = len(same_hash_records)
            item["use_in_next_step"] = (
                status != "label_conflict"
                and item["source_path"] == canonical_path
            )

    # Create the report folder. The raw dataset itself remains untouched.
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    # Save every image record, including duplicates, for traceability.
    fieldnames = [
        "source_path",
        "category",
        "size_bytes",
        "sha256",
        "duplicate_status",
        "duplicate_group_size",
        "use_in_next_step",
    ]

    with MANIFEST_PATH.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    # Count all images and the safe unique images available for preparation.
    raw_count_by_category = Counter(item["category"] for item in records)
    usable_count_by_category = Counter(
        item["category"] for item in records if item["use_in_next_step"]
    )

    duplicate_groups = sum(
        1 for group in hashes_to_records.values() if len(group) > 1
    )

    label_conflict_groups = sum(
        1
        for group in hashes_to_records.values()
        if len({item["category"] for item in group}) > 1
    )

    # Save a short summary which is easier to read than the full CSV manifest.
    report = {
        "dataset_path": str(SOURCE_ROOT),
        "expected_categories": sorted(EXPECTED_CATEGORIES),
        "missing_categories": missing_categories,
        "unexpected_categories": unexpected_categories,
        "total_images": len(records),
        "raw_count_by_category": dict(sorted(raw_count_by_category.items())),
        "usable_unique_count_by_category": dict(
            sorted(usable_count_by_category.items())
        ),
        "exact_duplicate_groups": duplicate_groups,
        "label_conflict_groups": label_conflict_groups,
        "manifest_path": str(MANIFEST_PATH),
    }

    with REPORT_PATH.open("w", encoding="utf-8") as output_file:
        json.dump(report, output_file, indent=2)

    # Print the important results in the terminal.
    print("\nRAW DATASET AUDIT")
    print("=" * 50)
    print(f"Images found: {report['total_images']}")
    print(f"Missing categories: {missing_categories or 'None'}")
    print(f"Unexpected categories: {unexpected_categories or 'None'}")
    print(f"Exact duplicate groups: {duplicate_groups}")
    print(f"Label-conflict groups: {label_conflict_groups}")

    print("\nUsable unique images per category:")
    for category in sorted(EXPECTED_CATEGORIES):
        print(f"  {category}: {usable_count_by_category[category]}")

    print(f"\nFull manifest: {MANIFEST_PATH}")
    print(f"Summary report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
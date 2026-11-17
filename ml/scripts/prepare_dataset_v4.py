"""Prepare Wastewise v4 with a broader, balanced E-waste category.

v4 keeps the audited v3 prepared images and adds selected E-Tadweer Image
Dataset (ETID) examples under the existing ``e-waste`` label. The downloaded
data and the v3 dataset are read-only inputs: this script only copies files
into ``ml/data/v4/prepared`` and writes a manifest.

ETID batteries are intentionally excluded. Wastewise already has a dedicated
``battery`` class and electrical devices/accessories should not dilute it.
"""

from collections import Counter, defaultdict
from pathlib import Path
import csv
import hashlib
import random
import shutil


V3_ROOT = Path("ml/data/v3/prepared")
ETID_ROOT = Path(
    "ml/data/v4/raw/etid/extracted/E-Tadweer Image Dataset (ETID)"
)
OUTPUT_ROOT = Path("ml/data/v4/prepared")
MANIFEST_PATH = Path("ml/data/v4/prepared_manifest.csv")
RANDOM_SEED = 42
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# Keep all cables because they are the weak real-world case. Cap each large
# ETID subclass so phones/PCBs do not dominate what the single e-waste label
# learns. Battery is intentionally absent.
ETID_LIMITS = {
    "Cable": 183,
    "Keyboard": 250,
    "Laptop": 250,
    "Mobile": 250,
    "Mouse": 250,
    "PCB": 250,
}


def is_image(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as image_file:
        while chunk := image_file.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def record(path: Path, category: str, source_name: str) -> dict[str, str | Path]:
    return {
        "source_path": path,
        "category": category,
        "source_name": source_name,
        "sha256": file_hash(path),
    }


def main() -> None:
    if OUTPUT_ROOT.exists() and any(OUTPUT_ROOT.iterdir()):
        raise SystemExit(f"{OUTPUT_ROOT} already contains files; use a fresh folder.")
    if not V3_ROOT.exists():
        raise FileNotFoundError(f"Missing v3 dataset: {V3_ROOT}")
    if not ETID_ROOT.exists():
        raise FileNotFoundError(f"Missing ETID dataset: {ETID_ROOT}")

    random_generator = random.Random(RANDOM_SEED)
    records: list[dict[str, str | Path]] = []

    # Keep the complete, audited v3 dataset as the baseline.
    for category_folder in sorted(V3_ROOT.iterdir()):
        if not category_folder.is_dir():
            continue
        for image_path in sorted(category_folder.iterdir()):
            if is_image(image_path):
                records.append(record(image_path, category_folder.name, "v3"))

    # Add a category-balanced ETID subset as one broad e-waste class.
    for etid_category, limit in ETID_LIMITS.items():
        source_folder = ETID_ROOT / etid_category
        candidates = [path for path in sorted(source_folder.iterdir()) if is_image(path)]
        if len(candidates) < limit:
            raise ValueError(f"{etid_category} has only {len(candidates)} images; expected {limit}.")
        selected = candidates if len(candidates) == limit else random_generator.sample(candidates, limit)
        records.extend(
            record(path, "e-waste", f"ETID/{etid_category}") for path in selected
        )

    # Exact duplicates are removed. If an exact image is ever found with two
    # labels, omit it entirely rather than creating contradictory training data.
    by_hash: dict[str, list[dict[str, str | Path]]] = defaultdict(list)
    for image_record in records:
        by_hash[str(image_record["sha256"])].append(image_record)

    cleaned: list[dict[str, str | Path]] = []
    duplicates_skipped = 0
    conflicts_skipped = 0
    for matches in by_hash.values():
        categories = {str(match["category"]) for match in matches}
        if len(categories) > 1:
            conflicts_skipped += len(matches)
            continue
        cleaned.append(min(matches, key=lambda match: str(match["source_path"])))
        duplicates_skipped += len(matches) - 1

    OUTPUT_ROOT.mkdir(parents=True)
    manifest_rows: list[dict[str, str]] = []
    counts: Counter[str] = Counter()
    for image_record in sorted(cleaned, key=lambda value: (str(value["category"]), str(value["source_path"]))):
        category = str(image_record["category"])
        output_folder = OUTPUT_ROOT / category
        output_folder.mkdir(exist_ok=True)
        destination = output_folder / f"{counts[category] + 1:05d}_{str(image_record['sha256'])[:12]}{Path(str(image_record['source_path'])).suffix.lower()}"
        shutil.copy2(Path(str(image_record["source_path"])), destination)
        counts[category] += 1
        manifest_rows.append(
            {
                "category": category,
                "source_name": str(image_record["source_name"]),
                "source_path": str(image_record["source_path"]),
                "copied_path": str(destination),
                "sha256": str(image_record["sha256"]),
            }
        )

    with MANIFEST_PATH.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=manifest_rows[0].keys())
        writer.writeheader()
        writer.writerows(manifest_rows)

    print("Prepared v4 dataset")
    for category in sorted(counts):
        print(f"  {category}: {counts[category]}")
    print(f"Exact duplicates skipped: {duplicates_skipped}")
    print(f"Conflicting-label files skipped: {conflicts_skipped}")
    print(f"Manifest: {MANIFEST_PATH}")


if __name__ == "__main__":
    main()

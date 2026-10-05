from pathlib import Path
import csv
import random
import shutil

# The original dataset: read from here, never edit it.
SOURCE_ROOT = Path(
    "/Users/mac/Downloads/Merged Waste Classification Dataset (MWCD)/final_merged_dataset"
)

# The smaller training copy we will create.
OUTPUT_ROOT = Path("ml/data/balanced")
MANIFEST_PATH = Path("ml/data/balanced_manifest.csv")

# Using the same seed means we can reproduce the exact same sample later.
RANDOM_SEED = 42

# Each model category gets 1,000 images.
# Paper and cardboard share one model category, with 500 from each source folder.
CATEGORY_PLAN = {
    "battery": {"battery": 1000},
    "paper_cardboard": {"paper": 500, "cardboard": 500},
    "glass": {"glass": 1000},
    "metal": {"metal": 1000},
    "organic_waste": {"organic": 1000},
    "plastic": {"plastic": 1000},
    "textile": {"textile": 1000},
    "general_waste": {"trash": 1000},
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def get_images(folder: Path) -> list[Path]:
    """Return all image files inside one raw dataset folder."""
    return [
        path
        for path in folder.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    ]


def main() -> None:
    random.seed(RANDOM_SEED)

    # Stop instead of mixing a new sample with an old one.
    if OUTPUT_ROOT.exists() and any(OUTPUT_ROOT.iterdir()):
        raise SystemExit(
            f"{OUTPUT_ROOT} already contains files. "
            "Do not run this script again until we review it."
        )

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    records = []

    for target_category, sources in CATEGORY_PLAN.items():
        target_folder = OUTPUT_ROOT / target_category
        target_folder.mkdir(exist_ok=True)

        for source_folder_name, sample_size in sources.items():
            source_folder = SOURCE_ROOT / source_folder_name
            images = get_images(source_folder)

            if len(images) < sample_size:
                raise ValueError(
                    f"{source_folder_name} has only {len(images)} images; "
                    f"we need {sample_size}."
                )

            selected_images = random.sample(images, sample_size)

            for image_path in selected_images:
                # Prefix with source folder so names cannot clash after merging.
                destination_name = f"{source_folder_name}__{image_path.name}"
                destination_path = target_folder / destination_name

                shutil.copy2(image_path, destination_path)

                records.append(
                    {
                        "model_category": target_category,
                        "source_folder": source_folder_name,
                        "source_path": str(image_path),
                        "copied_path": str(destination_path),
                    }
                )

    # This is the record of exactly which images entered training.
    with MANIFEST_PATH.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)

    print(f"Created {len(records)} balanced training images.")
    print(f"Images: {OUTPUT_ROOT}")
    print(f"Manifest: {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
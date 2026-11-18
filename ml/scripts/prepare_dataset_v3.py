"""Prepare the reproducible nine-class Wastewise v3 dataset.

This reuses the audited v2 preparation logic but points E-waste at the
329-image download.  It writes a new v3 working copy, never changing v2 or
anything in Downloads.
"""

from pathlib import Path

import prepare_dataset_v2 as v2


# The new download contains 329 files, 328 of which are unique after the
# preparation script's exact-duplicate check.
v2.EWASTE_ROOT = Path("/Users/mac/Downloads/e-waste 2")
v2.OUTPUT_ROOT = Path("ml/data/v3/prepared")
v2.MANIFEST_PATH = Path("ml/data/v3/prepared_manifest.csv")


if __name__ == "__main__":
    v2.main()

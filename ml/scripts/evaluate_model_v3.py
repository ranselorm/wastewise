"""Evaluate the nine-class v3 model on its untouched test split."""

from pathlib import Path

import evaluate_model as evaluator


evaluator.DATA_ROOT = Path("ml/data/v3/splits")
evaluator.MODEL_ROOT = Path("ml/models/v3")
evaluator.REPORTS_ROOT = Path("ml/reports/v3")
evaluator.MODEL_PATH = evaluator.MODEL_ROOT / "wastewise_mobilenet_v3_small.pt"
evaluator.CLASSES_PATH = evaluator.MODEL_ROOT / "wastewise_classes.json"


if __name__ == "__main__":
    evaluator.main()

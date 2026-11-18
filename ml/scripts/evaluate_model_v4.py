"""Evaluate the isolated v4 model on its untouched test split."""

from pathlib import Path

import evaluate_model as evaluator


evaluator.DATA_ROOT = Path("ml/data/v4/splits")
evaluator.MODEL_ROOT = Path("ml/models/v4")
evaluator.REPORTS_ROOT = Path("ml/reports/v4")
evaluator.MODEL_PATH = evaluator.MODEL_ROOT / "wastewise_mobilenet_v3_small.pt"
evaluator.CLASSES_PATH = evaluator.MODEL_ROOT / "wastewise_classes.json"


if __name__ == "__main__":
    evaluator.main()

"""Train Wastewise's nine-class v3 MobileNet model.

The shared trainer uses weighted sampling, so the 328-image E-waste class is
seen as often as the established categories during training.
"""

from pathlib import Path

import train_model as trainer


trainer.DATA_ROOT = Path("ml/data/v3/splits")
trainer.MODEL_ROOT = Path("ml/models/v3")
trainer.MODEL_PATH = trainer.MODEL_ROOT / "wastewise_mobilenet_v3_small.pt"
trainer.CLASSES_PATH = trainer.MODEL_ROOT / "wastewise_classes.json"
trainer.HISTORY_PATH = trainer.MODEL_ROOT / "training_history.json"
trainer.EPOCHS = 12


if __name__ == "__main__":
    trainer.main()

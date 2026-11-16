# Wastewise Llama Progress Tracker

Local policy scope: Cambridge, UK.

## 1. Local Llama foundation

- [x] Choose Llama 3.2 1B Instruct.
- [x] Download the original Hugging Face model.
- [x] Create a separate export environment.
- [x] Export the model to ExecuTorch 4-bit (789 MB).
- [x] Export the model to ExecuTorch 8-bit (1.4 GB).
- [x] Run both exports locally before Android integration.

## 2. Baseline testing

- [x] Test plastic and battery prompts with the source model.
- [x] Test the 4-bit export.
- [x] Test the 8-bit export.
- [x] Record that exact pre-written output is reliable.
- [x] Record that free-form guidance can omit or add disposal details.
- [x] Decide that re-exporting alone is not enough.

## 3. Dataset foundation

- [x] Create `dataset/train.jsonl` for training records.
- [x] Create `dataset/eval.jsonl` for unseen evaluation records.
- [x] Create the source and review log in `dataset/sources.md`.
- [x] Set Cambridge, UK as the local-policy scope.
- [x] Add first source-checked candidate records for battery, plastic, paper/cardboard, glass, metal, organic waste, textile, general waste, and planned e-waste.
- [x] Team review and sign-off current category sources and rules (26 Oct 2026).

## 4. Build the full fine-tuning dataset

- [x] Create Batches 2 to 4: 36 further source-checked candidate scenarios.
- [x] Team approve Batches 2 to 4 and allocate 30 records to training and 6 to evaluation.
- [x] Create and approve Batches 5 to 19 in clear 12-record batches.

Current approved set: 200 training records and 50 evaluation records.

- [x] Create Batch 1: 12 source-checked candidate scenarios in `dataset/review_batch_001.jsonl`.
- [x] Team approve Batch 1 and allocate 8 records to training and 4 to evaluation.
- [x] Turn each category into real scenarios, not repeated wording.
- [x] Include normal, dirty/contaminated, unclear, and low-confidence cases where relevant.
- [x] Include follow-up questions for broad categories such as battery, glass, metal, plastic, and e-waste.
- [x] Keep around 80% of approved records in `train.jsonl` and 20% in `eval.jsonl`.
- [x] Reach the first target of 250 approved records.
- [x] Validate every JSON Lines record before training.

## 5. Add e-waste to image classification

- [ ] Collect and label e-waste images for a ninth MobileNet category.
- [ ] Balance the new class against the existing eight categories.
- [ ] Retrain MobileNet with `e_waste` included.
- [ ] Test accuracy and confusion with battery, metal, plastic, and general waste.
- [ ] Export and test the updated classifier on Android.

## 6. Fine-tune Llama

- [x] Prepare a Google Colab GPU notebook for LoRA/QLoRA fine-tuning.
- [x] Complete first QLoRA experiment: adapter, settings, and 50 held-out answers downloaded.
- [x] Review first experiment: it failed the reliability gate (wrong bin rule, invented route, and unsafe low-confidence answers).
- [x] Add 32 approved reliability examples in `dataset/review_batch_020_reliability.jsonl`.
- [x] Run the second training experiment with 232 combined approved records; it still failed the reliability gate.
- [x] Add a 12-example training-canary diagnostic to distinguish failed learning from failed generalisation.
- [x] Run the training-canary diagnostic and use its result to choose the next training change.
- [x] Review every answer from the untouched 50-record `eval.jsonl` set.
- [x] Compare the second experiment with the current 4-bit baseline.

### Competition Pivot: Code-Guarded In-Context Prompting

- [x] Review Meta Edge AI Challenge Problem Statement 3 requirements (fine-tuning is not required).
- [x] Remove legacy `server/` backend to satisfy 100% offline edge privacy.
- [x] Pivot from LoRA fine-tuning to Code-Guarded In-Context Prompting using the existing base 4-bit `.pte` export.
- [x] Create a small, item-specific local wording test in `ml/llama/test_prompt.py`.
- [x] Test the base 4-bit model with six verified Cambridge fact packs.
- [x] Record the result honestly: the model preserved some routes but omitted required facts in four of six checks. It is not ready to be the sole source of disposal guidance.

### Verified policy layer

- [x] Start a separate local Cambridge policy module (`cambridge_policy.py`).
- [x] Add item-specific initial rules for battery, glass, plastic, textiles, paper/cardboard, metal, organic waste, general waste and e-waste.
- [x] Add local checks proving low-confidence and unsupported categories do not receive a guessed disposal route.
- [ ] Expand the reviewed policy set before connecting it to the mobile app.
- [x] Add a separate local diagnostic that measures whether Llama preserves a selected fact pack when rewriting it.
- [x] Run the wording diagnostic against six selected fact packs and record the result: Llama is not approved as the source of displayed disposal facts.
- [x] Add a deterministic renderer which displays every selected verified fact or one clarification question.
- [x] Create one tested decision-flow entry point for all eight current classifier categories.
- [x] Verify that low-confidence and unsupported categories never receive a guessed disposal route.
- [x] Define the simple Llama boundary: only high-confidence, supported classifications supply a verified fact pack to Llama; all other photos stay in the app and request a retake.
- [x] Add an eight-category strict local Llama wording gate for high-confidence fact packs.
- [x] Pass the strict local wording gate: 8/8 supported categories preserved their complete fact packs exactly.

## 7. Model Export & Status

- [x] Export base Llama 3.2 1B Instruct to ExecuTorch 4-bit (`ml/llama/exported/model.pte` - 789 MB).
- [x] Verified that the base model runs locally on Mac CPU using `ml/llama/test_prompt.py`.
- [x] Establish and pass a local eight-category fact-preservation test for the chosen prompt.

## 8. Android integration and device testing

- [x] Add the chosen `.pte` model and compatible tokenizer to the Android build as local assets.
- [x] Add a native ExecuTorch Llama bridge. It receives only app-selected Cambridge facts after a confident classification.
- [x] Keep low-confidence or unsupported photos in the app and show a retake message; do not call Llama.
- [ ] Test the complete offline flow on an Android device.
- [ ] Measure model load time, response time, memory use, and app size.

## 9. Final quality checks

- [ ] Test every category with normal and difficult examples.
- [ ] Confirm no internet, API key, or server is needed.
- [ ] Confirm changing local facts are supplied at response time, not permanently baked into the model.
- [ ] Update the testing notes with final results.
- [ ] Prepare the challenge demo and explain the on-device architecture.

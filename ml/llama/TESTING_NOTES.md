# Llama Setup and Testing Notes

## Why we started this

Wastewise already classifies a photo into a waste category. The next part is to give the user a useful explanation of what to do with that waste.

For the Edge AI challenge, both Llama and ExecuTorch need to run on an Arm-based device. That means the final app cannot depend on a server, API key, paid credits, or an internet connection after it has been installed.

Our intended flow is:

```text
User takes or selects a photo
  -> the on-device classifier returns a category and confidence score
  -> Wastewise gives Llama the approved facts for that category
  -> Llama writes the explanation locally
  -> the app shows disposal and recycling guidance
```

The classifier decides what the item is. Llama explains what the user should do with the result.

## What we tried first

At first, we explored hosted Llama providers because it looked like the quickest way to test the idea. That did not fit the project properly. It required the internet, an API key, and in some cases paid credits. It also meant the model was not actually running on the phone.

We stopped that route and decided to run Llama locally instead.

## Downloading the model

We chose Meta's official **Llama 3.2 1B Instruct** model from Hugging Face. We chose the 1B version because it is the smallest instruction model in that release and is more realistic for a phone than the larger versions.

The Meta repository is gated, so access had to be requested and approved before we could download it.

We downloaded the model into:

```text
ml/llama/source/
```

The download had 13 files and was about **4.95 GB**. The main files are:

- `model.safetensors` - the original Llama model weights.
- `tokenizer.json` - the file that turns text into tokens for Llama and turns generated tokens back into readable text.
- `config.json` - the model settings and architecture.

This is the normal Hugging Face model format. It is useful for testing on a laptop, but it cannot be put straight into the Android app.

## Exporting for ExecuTorch

To prepare the model for Android, we created a separate Python environment at:

```text
ml/llama/export-env/
```

We installed the Optimum and ExecuTorch export tools there. Keeping this separate avoids mixing the Llama export packages with the computer-vision training environment.

We then used Optimum to export the Hugging Face model to an ExecuTorch `.pte` file using the XNNPACK CPU backend. XNNPACK is a sensible first choice because it is designed for CPU inference on devices such as Android phones.

The first export used:

```text
Maximum sequence length: 256 tokens
Linear layers: 8-bit activations and 4-bit weights (8da4w)
Embedding layers: 4-bit weights (4w)
Custom attention and KV cache: enabled
```

The export completed and created:

```text
ml/llama/exported/model.pte
```

The exported model is **789 MB**. This is much smaller than the source model and is the type of file ExecuTorch can load in an Android app.

## Our first local test

Before touching the Android app, we wrote `ml/llama/test_local.py` to run the `.pte` model locally.

We made one early mistake: the test allowed a maximum sequence length of 128 tokens, but the formatted prompt itself was 129 tokens long. Llama only had space to produce one word: `Here`.

That was not a model problem. We changed the limit to 256 tokens, which matches the exported model, and the model could then generate a full response.

## How we are giving Llama guidance

We found that giving Llama only a category, such as `plastic`, can result in an answer that sounds believable but adds its own disposal advice. That is not good enough for an app about waste disposal.

The safer approach is to give Llama the approved Wastewise facts first. For example, for plastic we provide facts such as:

```text
- Empty and rinse it when appropriate.
- Recycle it only if the local scheme accepts it.
- Otherwise use general waste.
- Check local guidance when unsure.
```

Llama still writes the response shown to the user. The facts simply keep the response tied to what Wastewise has approved, instead of letting the model guess about local recycling rules.

## How we are testing the model

We do not want to integrate the model into Android and then discover that it gives poor answers. For every test case, we run the same prompt through:

1. The original Hugging Face Llama model.
2. The exported ExecuTorch `.pte` model.

This lets us see whether a problem comes from the original model, the prompt, or the export settings.

## Results so far

### 4-bit and 8-bit exports

The first export is 4-bit and **789 MB**. We also exported an 8-bit version at:

```text
ml/llama/exported-8w/model.pte
```

The 8-bit file is **1.4 GB**. It is slower and too large to be the ideal mobile choice.

Both models can follow an exact, pre-written three-line response. This proves that the ExecuTorch models run correctly and can preserve approved content.

### What failed

When we asked either model to create its own friendly explanation from the approved battery facts, both made the same important mistakes:

- They treated the collection-point instruction as if it applied only to damaged batteries.
- They added unapproved destinations such as a service station or recycling centre.
- They did not reliably keep the instruction to follow local guidance before transport.

The 8-bit version did not solve this problem. More precision improved some earlier answers, but it did not make the model reliable enough to freely write safety-critical disposal guidance.

## What this means

Quantizing and exporting makes a model smaller and runnable on a device. It does not teach the model Wastewise's disposal rules.

Prompting with approved facts helps, but prompting alone is not enough for a small model to consistently produce correct guidance. The final app still needs local verified facts as its source of truth.

## Pivot: Code-Guarded In-Context Prompting (No Fine-Tuning Needed)

### Alignment with Competition Requirements
Reviewing **Problem Statement 3 (Smart Recycling and Waste Segregation Assistant)** of the Meta Edge AI Challenge confirmed that **fine-tuning is not required**. The mandatory requirements are:
1. Classify waste materials (MobileNetV3 ExecuTorch).
2. Provide disposal recommendations & explain recycling options (Llama).
3. Demonstrate edge deployment with ExecuTorch on an Arm-based device.
4. Run 100% locally with zero internet dependency (the legacy `server/` backend has been deleted).

### Why Code-Guarded In-Context Prompting is the Best Approach
Fine-tuning a 1-billion parameter model on a small dataset introduces severe downsides:
- **Catastrophic forgetting & safety refusals:** Previous prompts caused Llama's guardrails to trigger ("I can't fulfill this request").
- **Rigid bylaws:** If Cambridge council changes a bin color or rule, a fine-tuned model requires a full retraining, validation gate, and re-export cycle.
- **Math weakness:** A 1B model cannot reliably evaluate floating-point confidence thresholds (e.g. knowing if 0.58 is low confidence).

Instead, separating **Logic (Code)** from **Natural Language (Llama)** provides the optimal architecture:
1. **The Code** checks the vision model's confidence:
   - If confidence < 60%: Code instructs Llama to ask for confirmation/clearer photo (no bins mentioned).
   - If confidence >= 60%: Code retrieves verified facts from a local dictionary and injects them into the prompt.
2. **Llama** acts as the conversational voice, rephrasing the verified facts into friendly, natural 1–2 sentence guidance.

### Current Local Test Result (`ml/llama/test_prompt.py`)

The exported 4-bit model (`ml/llama/exported/model.pte`, 789 MB) runs locally.
That proves the on-device runtime works, but it does **not** prove the answers
are ready for users.

On 30 October 2026, a six-case wording test used item-specific Cambridge fact
packs. The model kept the required facts in two cases. In four others it left
out an important fact, such as the destination bin or a preparation step. One
answer added a confusing extra sentence.

**Conclusion:** Llama is promising for friendly wording, but the base model is
not yet reliable enough to decide or freely summarise disposal instructions.
We will not claim 100% accuracy, zero hallucinations, or mobile speed until a
larger, repeatable device test passes.

The mobile app has not been changed as part of this test.

## Current app boundary

```text
Photo -> classifier category + confidence
  -> unclear, low-confidence, or unsupported: app says “Please retake the photo.”
  -> confident supported category: app selects verified local facts
  -> Llama rewrites only those facts into friendly numbered wording
```

Llama is never called for an uncertain or out-of-scope photo. It is the
wording layer after the app has selected the applicable facts; it does not
choose a bin or route. If wording cannot run, the app displays the same
verified facts directly, as one answer.

## Android integration: 31 October 2026

The app now contains the offline Llama bridge and packages the existing 4-bit
model (789 MB) plus its ExecuTorch tokenizer (2.1 MB) as Android assets.

```text
confident classifier result -> app-selected Cambridge facts -> local Llama -> one result
unclear result              -> app asks for a retake                 -> no Llama call
```

The bridge compiles. The remaining proof is a real Android-device run: load
the model, generate one result for each category, and measure app size, memory
and response time.

## Eight-category wording gate: 31 October 2026

Using the actual 4-bit ExecuTorch export, the strict local wording gate passed
all eight supported classifier routes: battery, general waste, glass, metal,
organic waste, paper/cardboard, plastic, and textile. Each response preserved
the complete selected fact pack and its numbered-line format (8/8).

This is a strong local check of this exact prompt and fact pack. It does not
replace Android device testing or prove correctness for unreviewed items. The
local policy remains the source of truth.

## Policy wording test: 31 October 2026

We tested the base 4-bit model again using six decisions selected by the new
local Cambridge policy layer. Four responses reproduced the selected facts
well. However, the model dropped the household-bin-lid condition for a small
battery, used bullet points instead of the requested numbered format for scrap
metal, and added an unnecessary preface for an electrical item.

This confirms the split of responsibilities:

```text
Policy code chooses the verified facts.
The app asks for a retake before Llama is called when a photo is unclear,
low-confidence, or outside the supported categories.
Llama writes the selected facts for confident supported categories.
```

Users see one answer, never a model answer beside a fallback.

package com.ranselorm.wastewise

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.pytorch.executorch.extension.llm.LlmCallback
import org.pytorch.executorch.extension.llm.LlmGenerationConfig
import org.pytorch.executorch.extension.llm.LlmModule
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executors

/**
 * Android bridge for the local ExecuTorch Llama model.
 *
 * The model never receives the photo or selects disposal instructions. It is
 * given only policy facts already selected by the TypeScript app after a
 * confident image classification, and makes those facts easier to read.
 */
class WastewiseLlamaModule(
  private val appContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(appContext) {

  // These two files are packaged inside the Android app. The PTE file contains
  // the 4-bit Llama model; the tokenizer converts words to/from model tokens.
  private val modelAsset = "wastewise_llama_1b.pte"
  private val tokenizerAsset = "wastewise_tokenizer.model"

  // Generation runs one request at a time. This avoids two scan results trying
  // to use the same on-device Llama context simultaneously.
  private val generationExecutor = Executors.newSingleThreadExecutor()

  // Llama is loaded only when a high-confidence scan needs friendly wording.
  // The facts themselves are selected before this point by disposalPolicy.ts.
  private val model: LlmModule by lazy {
    LlmModule(
      copyAssetToFiles(modelAsset),
      copyAssetToFiles(tokenizerAsset),
      /* temperature = */ 0.0f,
    ).also { it.load() }
  }

  override fun getName() = "WastewiseLlama"

  @ReactMethod
  fun explainFacts(facts: com.facebook.react.bridge.ReadableArray, promise: Promise) {
    // React Native passes the verified fact strings from TypeScript as an array.
    // Empty lines are ignored so the model receives only meaningful instructions.
    val factLines = buildList {
      for (index in 0 until facts.size()) {
        facts.getString(index)?.trim()?.takeIf { it.isNotEmpty() }?.let(::add)
      }
    }

    if (factLines.isEmpty()) {
      // Do not call Llama without a policy-selected fact pack.
      promise.reject("EMPTY_GUIDANCE", "Wastewise needs verified facts to explain.")
      return
    }

    generationExecutor.execute {
      try {
        val response = StringBuilder()
        var generationError: String? = null

        // The prompt carries the safety boundary: Llama may make wording more
        // natural, but it must not select bins, locations, or disposal rules.
        val prompt = buildPrompt(factLines)

        // Start every answer with a blank conversation context so a previous
        // item cannot influence the next person's disposal guidance.
        model.resetContext()
        model.generate(
          prompt,
          LlmGenerationConfig.create()
            .echo(false) // Return only newly generated text, not the prompt.
            .maxNewTokens(120) // Enough for a few short instructions.
            .seqLen(512) // Keeps the complete prompt + answer within context.
            .temperature(0.0f) // Prefer repeatable, not creative, responses.
            .build(),
          object : LlmCallback {
            override fun onResult(token: String) {
              // The native runner streams output token by token; collect it
              // until generation finishes, then return one complete string.
              response.append(token)
            }

            override fun onError(errorCode: Int, message: String) {
              generationError = "Llama error $errorCode: $message"
            }
          },
        )

        if (generationError != null) {
          // App.tsx catches this and shows the original verified facts instead.
          promise.reject("LLAMA_GENERATION_FAILED", generationError)
          return@execute
        }

        val wording = response.toString().trim()
        if (wording.isEmpty()) {
          // An empty answer is treated like a failure so users never see a
          // blank result screen.
          promise.reject("LLAMA_EMPTY_RESPONSE", "Llama returned no guidance.")
          return@execute
        }

        promise.resolve(
          Arguments.createMap().apply {
            putString("text", wording)
          },
        )
      } catch (error: Exception) {
        // Loading/generation failures also go back to App.tsx, whose safe
        // fallback is the exact app-selected Cambridge fact pack.
        promise.reject("LLAMA_UNAVAILABLE", error.message, error)
      }
    }
  }

  private fun buildPrompt(facts: List<String>): String = buildString {
    // Only the selected fact lines are interpolated below. Llama never sees the
    // photo, raw classifier scores, or the full disposal-policy dictionary.
    append("You are Wastewise, a warm and clear Cambridge recycling assistant.\n")
    append("Make each verified fact sound natural and encouraging, in plain UK English.\n")
    append("Keep every instruction, bin, location, and rule exactly the same. Do not add or remove any advice.\n")
    append("Return exactly one short numbered step for each fact, with no heading or extra text.\n\n")
    facts.forEachIndexed { index, fact ->
      append("${index + 1}. $fact\n")
    }
  }

  private fun copyAssetToFiles(assetName: String): String {
    val destination = File(appContext.filesDir, assetName)

    // Like the classifier, the model is bundled inside the APK. Copy it once to
    // app-private storage because the ExecuTorch LLM runner needs file paths.
    if (!destination.exists() || destination.length() == 0L) {
      appContext.assets.open(assetName).use { input ->
        FileOutputStream(destination).use { output ->
          input.copyTo(output)
        }
      }
    }

    return destination.absolutePath
  }
}

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

  private val modelAsset = "wastewise_llama_1b.pte"
  private val tokenizerAsset = "wastewise_tokenizer.model"
  private val generationExecutor = Executors.newSingleThreadExecutor()

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
    val factLines = buildList {
      for (index in 0 until facts.size()) {
        facts.getString(index)?.trim()?.takeIf { it.isNotEmpty() }?.let(::add)
      }
    }

    if (factLines.isEmpty()) {
      promise.reject("EMPTY_GUIDANCE", "Wastewise needs verified facts to explain.")
      return
    }

    generationExecutor.execute {
      try {
        val response = StringBuilder()
        var generationError: String? = null
        val prompt = buildPrompt(factLines)

        model.resetContext()
        model.generate(
          prompt,
          LlmGenerationConfig.create()
            .echo(false)
            .maxNewTokens(120)
            .seqLen(512)
            .temperature(0.0f)
            .build(),
          object : LlmCallback {
            override fun onResult(token: String) {
              response.append(token)
            }

            override fun onError(errorCode: Int, message: String) {
              generationError = "Llama error $errorCode: $message"
            }
          },
        )

        if (generationError != null) {
          promise.reject("LLAMA_GENERATION_FAILED", generationError)
          return@execute
        }

        val wording = response.toString().trim()
        if (wording.isEmpty()) {
          promise.reject("LLAMA_EMPTY_RESPONSE", "Llama returned no guidance.")
          return@execute
        }

        promise.resolve(
          Arguments.createMap().apply {
            putString("text", wording)
          },
        )
      } catch (error: Exception) {
        promise.reject("LLAMA_UNAVAILABLE", error.message, error)
      }
    }
  }

  private fun buildPrompt(facts: List<String>): String = buildString {
    append("You are Wastewise, a friendly Cambridge recycling assistant.\n")
    append("Rewrite only the verified facts below. Do not add, remove, or change instructions, bins, locations, or rules.\n")
    append("Return exactly one short numbered sentence for each fact, with no heading.\n\n")
    facts.forEachIndexed { index, fact ->
      append("${index + 1}. $fact\n")
    }
  }

  private fun copyAssetToFiles(assetName: String): String {
    val destination = File(appContext.filesDir, assetName)

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

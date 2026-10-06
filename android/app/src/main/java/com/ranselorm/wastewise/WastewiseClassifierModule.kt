package com.ranselorm.wastewise

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Module as ExecuTorchModule
import org.pytorch.executorch.Tensor
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import kotlin.math.exp
import kotlin.math.roundToInt

class WastewiseClassifierModule(
  private val appContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(appContext) {

  private val modelFileName = "wastewise_mobilenet_v3_small.pte"

  // This order must match the order saved during model training.
  private val classNames = listOf(
    "battery",
    "general_waste",
    "glass",
    "metal",
    "organic_waste",
    "paper_cardboard",
    "plastic",
    "textile",
  )

  // The model is loaded once when the app first needs it.
  private val model: ExecuTorchModule by lazy {
    ExecuTorchModule.load(copyModelFromAssets())
  }

  override fun getName() = "WastewiseClassifier"

  @ReactMethod
  fun classifyImage(imageUri: String, promise: Promise) {
    try {
      val inputTensor = makeInputTensor(imageUri)

      // ExecuTorch runs the model locally on the Android device.
      val scores = model
        .forward(EValue.from(inputTensor))[0]
        .toTensor()
        .dataAsFloatArray

      val bestIndex = scores.indices.maxBy { scores[it] }
      val confidence = softmax(scores)[bestIndex]

      val result = Arguments.createMap().apply {
        putString("category", classNames[bestIndex])
        putDouble("confidence", confidence.toDouble())
      }

      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("CLASSIFICATION_FAILED", error.message, error)
    }
  }

  private fun copyModelFromAssets(): String {
    val modelFile = File(appContext.filesDir, modelFileName)

    // Copy the packaged Android asset into a file ExecuTorch can load.
    if (!modelFile.exists()) {
      appContext.assets.open(modelFileName).use { input ->
        FileOutputStream(modelFile).use { output ->
          input.copyTo(output)
        }
      }
    }

    return modelFile.absolutePath
  }

  private fun makeInputTensor(imageUri: String): Tensor {
    val bitmap = loadBitmap(imageUri)
    val preparedBitmap = resizeAndCentreCrop(bitmap)

    val pixels = FloatArray(1 * 3 * 224 * 224)
    val imagePixels = IntArray(224 * 224)

    preparedBitmap.getPixels(
      imagePixels,
      0,
      224,
      0,
      0,
      224,
      224,
    )

    for (y in 0 until 224) {
      for (x in 0 until 224) {
        val pixel = imagePixels[y * 224 + x]

        val red = ((pixel shr 16) and 0xFF) / 255f
        val green = ((pixel shr 8) and 0xFF) / 255f
        val blue = (pixel and 0xFF) / 255f

        // Same ImageNet normalisation used during Python training.
        pixels[0 * 224 * 224 + y * 224 + x] = (red - 0.485f) / 0.229f
        pixels[1 * 224 * 224 + y * 224 + x] = (green - 0.456f) / 0.224f
        pixels[2 * 224 * 224 + y * 224 + x] = (blue - 0.406f) / 0.225f
      }
    }

    return Tensor.fromBlob(pixels, longArrayOf(1, 3, 224, 224))
  }

  private fun loadBitmap(imageUri: String): Bitmap {
    val uri = Uri.parse(imageUri)

    val inputStream: InputStream? =
      if (uri.scheme == "content") {
        appContext.contentResolver.openInputStream(uri)
      } else {
        appContext.contentResolver.openInputStream(uri)
      }

    return inputStream.use { stream ->
      BitmapFactory.decodeStream(stream)
        ?: throw IllegalArgumentException("Could not read the selected image.")
    }
  }

  private fun resizeAndCentreCrop(bitmap: Bitmap): Bitmap {
    // Match Python: Resize(shorter side = 256), then centre crop 224 x 224.
    val scale = 256f / minOf(bitmap.width, bitmap.height)
    val scaledWidth = (bitmap.width * scale).roundToInt()
    val scaledHeight = (bitmap.height * scale).roundToInt()

    val resized = Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)

    val left = (resized.width - 224) / 2
    val top = (resized.height - 224) / 2

    return Bitmap.createBitmap(resized, left, top, 224, 224)
  }

  private fun softmax(scores: FloatArray): FloatArray {
    val highestScore = scores.maxOrNull() ?: 0f
    val values = scores.map { score -> exp((score - highestScore).toDouble()).toFloat() }
    val total = values.sum()

    return values.map { value -> value / total }.toFloatArray()
  }
}
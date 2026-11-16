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

  // This is the small image-classification model bundled with the Android app.
  // It identifies the item category; it does not provide disposal guidance.
  private val modelFileName = "wastewise_mobilenet_v3_small.pte"

  // This order must match the order used when the MobileNet model was trained.
  // The model returns eight scores, and each position maps to one name here.
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

  // The model is copied out of the app bundle and loaded only when it is first
  // needed. `by lazy` prevents startup work before someone scans a photo.
  private val model: ExecuTorchModule by lazy {
    ExecuTorchModule.load(copyModelFromAssets())
  }

  override fun getName() = "WastewiseClassifier"

  @ReactMethod
  fun classifyImage(imageUri: String, promise: Promise) {
    try {
      // 1. Convert the phone/gallery image into the exact tensor shape and
      // normalisation MobileNet expects: [1, 3, 224, 224].
      val inputTensor = makeInputTensor(imageUri)

      // 2. ExecuTorch runs MobileNet entirely on the Android device. Nothing
      // about the photo is sent to a server.
      val scores = model
        .forward(EValue.from(inputTensor))[0]
        .toTensor()
        .dataAsFloatArray

      // 3. Pick the largest score as the category and turn all raw scores into
      // a 0–1 probability distribution so the app can apply its confidence gate.
      val bestIndex = scores.indices.maxBy { scores[it] }
      val confidence = softmax(scores)[bestIndex]

      // 4. Return only the classification result to TypeScript. The app—not
      // this model—decides whether the confidence is high enough to continue.
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

    // Android packages the model inside the APK. ExecuTorch needs a normal file
    // path, so we copy it once into the app's private storage on first use.
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
    // Read the chosen image, then make it match the preprocessing used during
    // Python training. Keeping these steps identical is vital for accuracy.
    val bitmap = loadBitmap(imageUri)
    val preparedBitmap = resizeAndCentreCrop(bitmap)

    // MobileNet expects one RGB image in channels-first format:
    // batch=1, red channel, green channel, blue channel, height=224, width=224.
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

        // Convert 0–255 colours into 0–1 values, then use the same ImageNet
        // normalisation values used when the model was trained.
        pixels[0 * 224 * 224 + y * 224 + x] = (red - 0.485f) / 0.229f
        pixels[1 * 224 * 224 + y * 224 + x] = (green - 0.456f) / 0.224f
        pixels[2 * 224 * 224 + y * 224 + x] = (blue - 0.406f) / 0.225f
      }
    }

    return Tensor.fromBlob(pixels, longArrayOf(1, 3, 224, 224))
  }

  private fun loadBitmap(imageUri: String): Bitmap {
    val uri = Uri.parse(imageUri)

    // Both camera and gallery images are represented by Android content URIs.
    // The Android content resolver opens the image without uploading it.
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
    // Match Python exactly: resize the shorter side to 256, then take a centred
    // 224 × 224 crop. This prevents a train/app preprocessing mismatch.
    val scale = 256f / minOf(bitmap.width, bitmap.height)
    val scaledWidth = (bitmap.width * scale).roundToInt()
    val scaledHeight = (bitmap.height * scale).roundToInt()

    val resized = Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)

    val left = (resized.width - 224) / 2
    val top = (resized.height - 224) / 2

    return Bitmap.createBitmap(resized, left, top, 224, 224)
  }

  private fun softmax(scores: FloatArray): FloatArray {
    // The model's raw outputs are logits, not percentages. Softmax converts
    // them into values that add up to 1. We subtract the highest score first
    // for numerical stability.
    val highestScore = scores.maxOrNull() ?: 0f
    val values = scores.map { score -> exp((score - highestScore).toDouble()).toFloat() }
    val total = values.sum()

    return values.map { value -> value / total }.toFloatArray()
  }
}

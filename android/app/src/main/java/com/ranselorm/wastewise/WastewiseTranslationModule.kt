package com.ranselorm.wastewise

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions

/**
 * Uses Google ML Kit's on-device translation models. The first translation for
 * a language downloads its model; after that, the downloaded language pair can
 * work without a translation API key or a server request.
 */
class WastewiseTranslationModule(
  private val appContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(appContext) {
  private var translator: Translator? = null
  private var targetLanguage: String? = null

  override fun getName() = "WastewiseTranslation"

  @ReactMethod
  fun getSupportedLanguageCodes(promise: Promise) {
    try {
      val languages = Arguments.createArray()
      TranslateLanguage.getAllLanguages().sorted().forEach(languages::pushString)
      promise.resolve(languages)
    } catch (error: Exception) {
      promise.reject("TRANSLATION_LANGUAGES_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun translateEnglish(text: String, requestedTargetLanguage: String, promise: Promise) {
    if (text.isBlank() || requestedTargetLanguage == TranslateLanguage.ENGLISH) {
      promise.resolve(text)
      return
    }

    val supportedTarget = TranslateLanguage.fromLanguageTag(requestedTargetLanguage)
    if (supportedTarget == null) {
      promise.reject("UNSUPPORTED_LANGUAGE", "This language is not available on this device.")
      return
    }

    try {
      val activeTranslator = translatorFor(supportedTarget)
      activeTranslator
        .downloadModelIfNeeded(DownloadConditions.Builder().build())
        .addOnSuccessListener {
          activeTranslator
            .translate(text)
            .addOnSuccessListener { translated -> promise.resolve(translated) }
            .addOnFailureListener { error ->
              promise.reject("TRANSLATION_FAILED", error.message, error)
            }
        }
        .addOnFailureListener { error ->
          promise.reject("TRANSLATION_MODEL_DOWNLOAD_FAILED", error.message, error)
        }
    } catch (error: Exception) {
      promise.reject("TRANSLATION_FAILED", error.message, error)
    }
  }

  private fun translatorFor(target: String): Translator {
    if (translator != null && targetLanguage == target) return translator!!

    translator?.close()
    translator = Translation.getClient(
      TranslatorOptions.Builder()
        .setSourceLanguage(TranslateLanguage.ENGLISH)
        .setTargetLanguage(target)
        .build(),
    )
    targetLanguage = target
    return translator!!
  }

  override fun invalidate() {
    translator?.close()
    translator = null
    targetLanguage = null
    super.invalidate()
  }
}

package com.example.executorchllamademo

import android.content.Context
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions

class WasteTranslator(private val context: Context) {
    private val preferences = context.getSharedPreferences(
        "wastewise_language_preferences", Context.MODE_PRIVATE
    )
    private var translator: Translator? = null
    private var currentTarget: String? = null

    companion object {
        const val DEFAULT_LANGUAGE = "en"
        private const val KEY_LANGUAGE = "selected_language"
        val languages = linkedMapOf(
            "English" to "en", "Telugu" to "te", "Hindi" to "hi",
            "Tamil" to "ta", "Malayalam" to "ml", "Kannada" to "kn",
            "Bengali" to "bn", "Marathi" to "mr", "Gujarati" to "gu",
            "Urdu" to "ur", "Punjabi" to "pa", "Arabic" to "ar",
            "Chinese" to "zh", "Japanese" to "ja", "Korean" to "ko",
            "French" to "fr", "German" to "de", "Spanish" to "es",
            "Italian" to "it", "Portuguese" to "pt", "Russian" to "ru",
            "Turkish" to "tr", "Dutch" to "nl", "Greek" to "el",
            "Polish" to "pl", "Swedish" to "sv", "Danish" to "da",
            "Norwegian" to "no", "Finnish" to "fi", "Czech" to "cs",
            "Hungarian" to "hu", "Romanian" to "ro", "Ukrainian" to "uk",
            "Vietnamese" to "vi", "Thai" to "th", "Indonesian" to "id",
            "Malay" to "ms", "Swahili" to "sw", "Hebrew" to "he",
            "Persian" to "fa"
        )
    }

    fun getSelectedLanguage(): String =
        preferences.getString(KEY_LANGUAGE, DEFAULT_LANGUAGE) ?: DEFAULT_LANGUAGE

    fun saveSelectedLanguage(languageCode: String) {
        preferences.edit().putString(KEY_LANGUAGE, languageCode).apply()
    }

    fun getLanguageName(languageCode: String): String =
        languages.entries.firstOrNull { it.value == languageCode }?.key ?: "English"

    fun translate(
        text: String,
        targetLanguage: String,
        onSuccess: (String) -> Unit,
        onError: (Exception) -> Unit
    ) {
        if (targetLanguage == DEFAULT_LANGUAGE || text.isBlank()) {
            onSuccess(text)
            return
        }
        val supported = TranslateLanguage.fromLanguageTag(targetLanguage)
        if (supported == null) {
            onError(IllegalArgumentException("Unsupported language: $targetLanguage"))
            return
        }
        try {
            val active = getTranslator(supported)
            active.downloadModelIfNeeded(DownloadConditions.Builder().build())
                .addOnSuccessListener {
                    active.translate(text)
                        .addOnSuccessListener(onSuccess)
                        .addOnFailureListener(onError)
                }
                .addOnFailureListener(onError)
        } catch (error: Exception) {
            onError(error)
        }
    }

    private fun getTranslator(targetLanguage: String): Translator {
        if (translator != null && currentTarget == targetLanguage) return translator!!
        translator?.close()
        val options = TranslatorOptions.Builder()
            .setSourceLanguage(TranslateLanguage.ENGLISH)
            .setTargetLanguage(targetLanguage)
            .build()
        translator = Translation.getClient(options)
        currentTarget = targetLanguage
        return translator!!
    }

    fun close() {
        translator?.close()
        translator = null
        currentTarget = null
    }
}

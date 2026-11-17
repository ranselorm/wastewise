package com.example.executorchllamademo

import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext

@Composable
fun TranslatedLlamaMessage(message: String, selectedLanguage: String) {
    val context = LocalContext.current
    val translator = remember(context) { WasteTranslator(context) }
    var translatedText by remember(message, selectedLanguage) { mutableStateOf(message) }
    var isTranslating by remember(message, selectedLanguage) { mutableStateOf(false) }

    DisposableEffect(translator) { onDispose { translator.close() } }
    LaunchedEffect(message, selectedLanguage) {
        translatedText = message
        isTranslating = false
        if (selectedLanguage != "en" && message.isNotBlank()) {
            isTranslating = true
            translator.translate(
                text = message,
                targetLanguage = selectedLanguage,
                onSuccess = { result ->
                    translatedText = result
                    isTranslating = false
                },
                onError = {
                    translatedText = message
                    isTranslating = false
                }
            )
        }
    }
    if (isTranslating) LinearProgressIndicator()
    Text(text = translatedText)
}

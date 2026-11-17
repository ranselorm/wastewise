package com.example.executorchllamademo

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

@Composable
fun LanguageTranslationScreen(llamaResponse: String) {
    val context = LocalContext.current
    val translator = remember(context) { WasteTranslator(context) }
    var selectedLanguage by remember { mutableStateOf(translator.getSelectedLanguage()) }
    DisposableEffect(translator) { onDispose { translator.close() } }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Text("WasteWise AI Assistant", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(12.dp))
        LanguageSelector(
            selectedLanguage = selectedLanguage,
            onLanguageSelected = { language ->
                selectedLanguage = language
                translator.saveSelectedLanguage(language)
            }
        )
        Spacer(modifier = Modifier.height(16.dp))
        TranslatedLlamaMessage(
            message = llamaResponse,
            selectedLanguage = selectedLanguage
        )
    }
}

package com.example.executorchllamademo

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier

@Composable
fun LanguageSelector(selectedLanguage: String, onLanguageSelected: (String) -> Unit) {
    var showDialog by remember { mutableStateOf(false) }
    val selectedName = WasteTranslator.languages.entries
        .firstOrNull { it.value == selectedLanguage }?.key ?: "English"

    OutlinedButton(onClick = { showDialog = true }) { Text("🌐 $selectedName") }
    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text("Select Language") },
            text = {
                LazyColumn {
                    items(WasteTranslator.languages.toList()) { entry ->
                        TextButton(
                            onClick = {
                                onLanguageSelected(entry.second)
                                showDialog = false
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) { Text(entry.first) }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showDialog = false }) { Text("Close") }
            }
        )
    }
}

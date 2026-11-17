package com.example.executorchllamademo

/** Add the returned instruction to the existing Llama prompt before model-specific formatting. */
fun buildLanguagePrompt(userMessage: String, selectedLanguage: String): String {
    val languageName = WasteTranslator.languages.entries
        .firstOrNull { it.value == selectedLanguage }?.key ?: "English"
    return """
        You are WasteWise, a helpful recycling assistant.
        Respond in $languageName.
        Explain recycling and waste disposal clearly.
        Keep answers simple and accurate.

        User: $userMessage
        Assistant:
    """.trimIndent()
}

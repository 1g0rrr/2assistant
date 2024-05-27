const languageCodes = {
    "en": "en-US",
    "uk": "uk-UA",
    "ru": "ru-RU",
    "de": "de-DE",
    "pl": "pl-PL",
    "fr": "fr-FR",
    "es": "es-ES",
    "it": "it-IT",
    "nl": "nl-NL",
    "pt": "pt-PT",
    "ja": "ja-JP",
    "zh": "zh-CN",
    "ko": "ko-KR",
    "sv": "sv-SE",
    "da": "da-DK",
    "no": "no-NO",
    "fi": "fi-FI",
    "tr": "tr-TR",
    "el": "el-GR",
    "id": "id-ID",
    "ro": "ro-RO",
    "cz": "cs-CZ",
};

const languageNames = {
    "en": "English",
    "uk": "Ukrainian",
    "ru": "Russian",
    "de": "Deutsch",
    "pl": "Polish",
    "fr": "French",
    "es": "Spanish",
    "it": "Italian",
    "nl": "Dutch",
    "pt": "Portuguese",
    "ja": "Japanese",
    "zh": "Chinese (Simplified)",
    "ko": "Korean",
    "sv": "Swedish",
    "da": "Danish",
    "no": "Norwegian",
    "fi": "Finnish",
    "tr": "Turkish",
    "el": "Greek",
    "id": "Indonesian",
    "ro": "Romanian",
    "cz": "Czech",
};

function getLanguageNameFromXX(smallCode) {
    return languageNames[smallCode];
}

function getLanguageXXXXFromXX(smallCode) {
    return languageCodes[smallCode];
}

function checkIfLanguageXXSupported(languageCode) {
    return languageCodes[languageCode] !== undefined;
}

exports.languages = {
    getLanguageNameFromXX,
    getLanguageXXXXFromXX,
    checkIfLanguageXXSupported,
};
/**
 * Wave AI — Voice Chat — Multi-Language Support
 */
export const LANGUAGE_CONFIGS = {
  "en-US": { name: "English (US)", ttsRate: 1.0, recognitionModel: "standard", rightToLeft: false },
  "en-GB": { name: "English (UK)", ttsRate: 1.0, recognitionModel: "standard", rightToLeft: false },
  "sw-KE": { name: "Swahili", ttsRate: 0.95, recognitionModel: "standard", rightToLeft: false },
  "fr-FR": { name: "French", ttsRate: 1.0, recognitionModel: "standard", rightToLeft: false },
  "es-ES": { name: "Spanish", ttsRate: 1.05, recognitionModel: "standard", rightToLeft: false },
  "ar-SA": { name: "Arabic", ttsRate: 0.95, recognitionModel: "standard", rightToLeft: true },
  "hi-IN": { name: "Hindi", ttsRate: 0.95, recognitionModel: "standard", rightToLeft: false },
  "zh-CN": { name: "Chinese (Simplified)", ttsRate: 0.9, recognitionModel: "standard", rightToLeft: false },
  "pt-BR": { name: "Portuguese (Brazil)", ttsRate: 1.0, recognitionModel: "standard", rightToLeft: false },
  "yo-NG": { name: "Yoruba", ttsRate: 0.95, recognitionModel: "enhanced", rightToLeft: false },
  "ha-NG": { name: "Hausa", ttsRate: 0.95, recognitionModel: "enhanced", rightToLeft: false },
  "am-ET": { name: "Amharic", ttsRate: 0.9, recognitionModel: "enhanced", rightToLeft: false },
  "de-DE": { name: "German", ttsRate: 1.0, recognitionModel: "standard", rightToLeft: false },
};

export class MultiLanguageSupport {
  constructor() { this.currentLanguage = "en-US"; this.fallback = "en-US"; }

  setLanguage(code) { if (LANGUAGE_CONFIGS[code]) { this.currentLanguage = code; return true; } return false; }
  getConfig(code = null) { return LANGUAGE_CONFIGS[code || this.currentLanguage] || LANGUAGE_CONFIGS[this.fallback]; }
  isSupported(code) { return !!LANGUAGE_CONFIGS[code]; }
  getAllLanguages() { return Object.entries(LANGUAGE_CONFIGS).map(([code, config]) => ({ code, ...config })); }
  isRTL(code = null) { return this.getConfig(code).rightToLeft; }
  getTextDirection(code = null) { return this.isRTL(code) ? "rtl" : "ltr"; }
  getRecommendedRate(code = null) { return this.getConfig(code).ttsRate; }

  getUIPhrases(code = null) {
    const lang = (code || this.currentLanguage).split("-")[0];
    const phrases = {
      en: { tap_to_speak: "Tap to speak", listening: "Listening...", processing: "Processing...", speaking: "Speaking..." },
      sw: { tap_to_speak: "Bonyeza kuongea", listening: "Sikiliza...", processing: "Inashughulikia...", speaking: "Inasema..." },
      fr: { tap_to_speak: "Appuyez pour parler", listening: "Écoute...", processing: "Traitement...", speaking: "Parle..." },
      ar: { tap_to_speak: "اضغط للتحدث", listening: "جارٍ الاستماع...", processing: "جارٍ المعالجة...", speaking: "يتحدث..." },
    };
    return phrases[lang] || phrases.en;
  }
}
export const multiLanguageSupport = new MultiLanguageSupport();

/**
 * Wave AI — Voice Chat — Pronunciation Trainer
 * Help users improve pronunciation through speech comparison.
 */
export const PRONUNCIATION_EXERCISES = {
  english: [
    { word: "recipe", ipa: "/ˈresɪpi/", tips: "Three syllables: RES-i-pee. Not 'recip'." },
    { word: "entrepreneur", ipa: "/ˌɒntrəprəˈnɜː/", tips: "ON-truh-pruh-NUR" },
    { word: "particularly", ipa: "/pəˈtɪkjʊlərli/", tips: "par-TIK-yoo-lar-lee" },
    { word: "specifically", ipa: "/spəˈsɪfɪkli/", tips: "speh-SIF-ik-lee" },
    { word: "comfortable", ipa: "/ˈkʌmftəbəl/", tips: "KUMF-tuh-bul (3 syllables, not 4)" },
    { word: "february", ipa: "/ˈfebrʊəri/", tips: "FEB-roo-air-ee" },
    { word: "library", ipa: "/ˈlaɪbrəri/", tips: "LY-brer-ee" },
    { word: "temperature", ipa: "/ˈtemprɪtʃə/", tips: "TEM-pruh-chur" },
    { word: "Wednesday", ipa: "/ˈwenzdeɪ/", tips: "The 'd' is silent: WENZ-day" },
    { word: "colonel", ipa: "/ˈkɜːnəl/", tips: "Sounds like 'kernel'" },
  ],
  swahili: [
    { word: "habari", ipa: "/ha.ba.ɾi/", tips: "Ha-BA-ri — greeting, means 'news'" },
    { word: "asante", ipa: "/a.san.te/", tips: "A-SAN-te — thank you" },
    { word: "jambo", ipa: "/dʒam.bo/", tips: "JAM-bo — hello" },
    { word: "karibu", ipa: "/ka.ɾi.bu/", tips: "KA-ri-bu — welcome" },
  ],
};

export class PronunciationTrainer {
  constructor() { this.SR = window.SpeechRecognition || window.webkitSpeechRecognition; this.currentExercise = null; this.score = 0; this.attempts = 0; }

  get isSupported() { return !!this.SR; }

  getExercise(language = "english", index = null) {
    const exercises = PRONUNCIATION_EXERCISES[language] || PRONUNCIATION_EXERCISES.english;
    return index !== null ? exercises[index % exercises.length] : exercises[Math.floor(Math.random() * exercises.length)];
  }

  async testPronunciation(targetWord, language = "en-US") {
    if (!this.isSupported) return { success: false, error: "Speech recognition not supported" };
    return new Promise((resolve) => {
      const recognition = new this.SR();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;
      const timeout = setTimeout(() => { recognition.abort(); resolve({ success: false, error: "No speech detected" }); }, 10000);
      recognition.onresult = (e) => {
        clearTimeout(timeout);
        const spoken = e.results[0][0].transcript.toLowerCase().trim();
        const target = targetWord.toLowerCase().trim();
        const score = this._calculateSimilarity(spoken, target);
        resolve({ success: true, spoken, target, score, grade: this._grade(score), feedback: this._feedback(score, spoken, target) });
      };
      recognition.onerror = (e) => { clearTimeout(timeout); resolve({ success: false, error: e.error }); };
      recognition.start();
    });
  }

  _calculateSimilarity(a, b) {
    if (a === b) return 1;
    if (!a || !b) return 0;
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = a[i - 1] === b[j - 1] ? matrix[i - 1][j - 1] : 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
    }
    const distance = matrix[a.length][b.length];
    return 1 - distance / Math.max(a.length, b.length);
  }

  _grade(score) {
    if (score >= 0.9) return { letter: "A", label: "Excellent! 🌟" };
    if (score >= 0.75) return { letter: "B", label: "Good! 👍" };
    if (score >= 0.6) return { letter: "C", label: "Fair — keep practicing" };
    return { letter: "D", label: "Needs practice — try again" };
  }

  _feedback(score, spoken, target) {
    if (score >= 0.9) return `Perfect pronunciation of "${target}"!`;
    if (score >= 0.75) return `Good attempt! You said "${spoken}" — close to "${target}"`;
    return `You said "${spoken}" but the target is "${target}". Try breaking it into syllables.`;
  }
}
export const pronunciationTrainer = new PronunciationTrainer();

/**
 * Wave AI — Human Personality Engine
 * Deep understanding of human psychology, personality types,
 * emotions, behaviors, motivations, and mental health.
 */

export const PERSONALITY_FRAMEWORKS = {
  bigFive: {
    name: "Big Five (OCEAN)",
    traits: {
      Openness: { high: "Creative, curious, imaginative, loves new experiences", low: "Conventional, practical, prefers routine", percentage: "~30% high scorers" },
      Conscientiousness: { high: "Organized, disciplined, dependable, goal-oriented", low: "Spontaneous, flexible, may struggle with deadlines", percentage: "~40% high scorers" },
      Extraversion: { high: "Outgoing, energetic, seeks social stimulation", low: "Introverted, prefer solitude, reserved", percentage: "~50/50 split" },
      Agreeableness: { high: "Cooperative, trusting, empathetic, kind", low: "Competitive, skeptical, challenging", percentage: "~60% high scorers" },
      Neuroticism: { high: "Emotionally reactive, prone to stress and anxiety", low: "Emotionally stable, calm under pressure", percentage: "~30% high scorers" },
    },
  },

  mbti: {
    name: "Myers-Briggs Type Indicator (16 Types)",
    types: {
      INTJ: { nickname: "The Architect", strengths: "Strategic, logical, determined", weakness: "Arrogant, dismissive of emotions", famous: "Elon Musk, Isaac Newton" },
      INTP: { nickname: "The Thinker", strengths: "Analytical, objective, open-minded", weakness: "Absent-minded, condescending", famous: "Albert Einstein, Bill Gates" },
      ENTJ: { nickname: "The Commander", strengths: "Efficient, energetic, confident", weakness: "Stubborn, impatient, intolerant", famous: "Steve Jobs, Franklin Roosevelt" },
      ENTP: { nickname: "The Debater", strengths: "Innovative, strategic, charismatic", weakness: "Argumentative, insensitive", famous: "Barack Obama, Mark Twain" },
      INFJ: { nickname: "The Advocate", strengths: "Insightful, principled, passionate", weakness: "Perfectionist, private, burnout-prone", famous: "Martin Luther King Jr., Plato" },
      INFP: { nickname: "The Mediator", strengths: "Empathetic, creative, idealistic", weakness: "Impractical, self-critical", famous: "J.R.R. Tolkien, Princess Diana" },
      ENFJ: { nickname: "The Protagonist", strengths: "Charismatic, empathetic, reliable", weakness: "Overly idealistic, condescending", famous: "Nelson Mandela, Oprah Winfrey" },
      ENFP: { nickname: "The Campaigner", strengths: "Curious, energetic, creative", weakness: "Disorganized, easily stressed", famous: "Robin Williams, Walt Disney" },
      ISTJ: { nickname: "The Logistician", strengths: "Honest, reliable, methodical", weakness: "Stubborn, insensitive, judgmental", famous: "Queen Elizabeth II, Warren Buffett" },
      ISFJ: { nickname: "The Defender", strengths: "Warm, caring, loyal, dedicated", weakness: "Shy, represses feelings", famous: "Mother Teresa, Rosa Parks" },
      ESTJ: { nickname: "The Executive", strengths: "Organized, dedicated, strong-willed", weakness: "Inflexible, uncomfortable with emotion", famous: "Michelle Obama, Henry Ford" },
      ESFJ: { nickname: "The Consul", strengths: "Caring, loyal, popular, organized", weakness: "Needy, approval-seeking", famous: "Bill Clinton, Taylor Swift" },
      ISTP: { nickname: "The Virtuoso", strengths: "Optimistic, creative, practical", weakness: "Stubborn, insensitive, private", famous: "Michael Jordan, Clint Eastwood" },
      ISFP: { nickname: "The Adventurer", strengths: "Flexible, charming, sensitive", weakness: "Unpredictable, overly competitive", famous: ["Rihanna", "Lana Del Rey"] },
      ESTP: { nickname: "The Entrepreneur", strengths: "Bold, rational, direct, perceptive", weakness: "Impatient, risk-prone", famous: "Donald Trump, Madonna" },
      ESFP: { nickname: "The Entertainer", strengths: "Bold, original, aesthetic, social", weakness: "Sensitive, conflict-avoidant", famous: "Marilyn Monroe, Elvis Presley" },
    },
  },

  enneagram: {
    name: "Enneagram (9 Types)",
    types: [
      { number: 1, name: "The Reformer", core: "Need to be right and perfect", fear: "Being wrong or corrupt", desire: "Integrity and balance" },
      { number: 2, name: "The Helper", core: "Need to be needed and loved", fear: "Being unwanted", desire: "To feel loved" },
      { number: 3, name: "The Achiever", core: "Need to succeed and be admired", fear: "Worthlessness", desire: "To feel valuable" },
      { number: 4, name: "The Individualist", core: "Need to be unique and authentic", fear: "Having no identity", desire: "To be themselves" },
      { number: 5, name: "The Investigator", core: "Need to understand everything", fear: "Incompetence", desire: "To be capable" },
      { number: 6, name: "The Loyalist", core: "Need for security and support", fear: "Abandonment", desire: "To have security" },
      { number: 7, name: "The Enthusiast", core: "Need for freedom and joy", fear: "Being deprived", desire: "Satisfaction" },
      { number: 8, name: "The Challenger", core: "Need to be strong and in control", fear: "Being controlled", desire: "Self-protection" },
      { number: 9, name: "The Peacemaker", core: "Need for peace and harmony", fear: "Conflict", desire: "Peace of mind" },
    ],
  },
};

export const HUMAN_EMOTIONS = {
  primary: {
    joy: { triggers: ["achievement", "connection", "beauty", "gratitude"], physiology: "Dopamine & serotonin release", expression: "Smiling, laughter, light body" },
    sadness: { triggers: ["loss", "failure", "separation", "empathy"], physiology: "Cortisol, low serotonin", expression: "Crying, slumped posture, quietness" },
    anger: { triggers: ["injustice", "frustration", "threat", "violation"], physiology: "Adrenaline, cortisol surge", expression: "Raised voice, clenched fists, flushed face" },
    fear: { triggers: ["danger", "uncertainty", "new situations", "rejection"], physiology: "Amygdala activation, fight-flight-freeze", expression: "Wide eyes, pale, trembling, rapid heartbeat" },
    disgust: { triggers: ["contamination", "moral violation", "social taboos"], physiology: "Nausea, gag reflex", expression: "Wrinkled nose, turned away" },
    surprise: { triggers: ["unexpected events, both positive and negative"], physiology: "Sudden alertness, adrenaline", expression: "Wide eyes, open mouth, raised eyebrows" },
  },
  complex: ["nostalgia", "awe", "schadenfreude", "sonder", "hiraeth", "saudade", "gratitude", "hope", "shame", "guilt", "pride", "envy", "jealousy", "loneliness", "boredom"],
};

export const HUMAN_MOTIVATIONS = {
  maslowHierarchy: [
    { level: 1, need: "Physiological", examples: ["food", "water", "sleep", "shelter", "warmth"] },
    { level: 2, need: "Safety", examples: ["security", "employment", "health", "property"] },
    { level: 3, need: "Love & Belonging", examples: ["friendship", "intimacy", "family", "belonging"] },
    { level: 4, need: "Esteem", examples: ["achievement", "status", "recognition", "respect"] },
    { level: 5, need: "Self-Actualization", examples: ["creativity", "morality", "problem-solving", "authenticity"] },
  ],
  intrinsicVsExtrinsic: {
    intrinsic: "Motivation from internal rewards — curiosity, purpose, passion, meaning",
    extrinsic: "Motivation from external rewards — money, grades, praise, status",
    selfDetermination: ["Autonomy (control over choices)", "Competence (mastery of skills)", "Relatedness (connection to others)"],
  },
};

export const PSYCHOLOGICAL_CONCEPTS = {
  cognitiveBiases: [
    { bias: "Confirmation bias", description: "Seeking information that confirms existing beliefs" },
    { bias: "Dunning-Kruger effect", description: "Less skilled people overestimate ability; experts underestimate it" },
    { bias: "Anchoring", description: "Over-reliance on first piece of information encountered" },
    { bias: "Availability heuristic", description: "Judging likelihood based on how easily examples come to mind" },
    { bias: "Sunk cost fallacy", description: "Continuing behavior due to previously invested resources" },
    { bias: "Bandwagon effect", description: "Adopting beliefs because many others hold them" },
    { bias: "Recency bias", description: "Giving more weight to recent events" },
    { bias: "Attribution error", description: "Attributing others' actions to character, own to circumstances" },
  ],
  defenseM: ["denial", "repression", "projection", "displacement", "sublimation", "rationalization", "regression", "humor"],
  mentalHealth: {
    common: ["Depression", "Anxiety disorders", "PTSD", "OCD", "Bipolar disorder", "ADHD", "Schizophrenia"],
    treatments: ["Cognitive Behavioral Therapy (CBT)", "Medication", "Mindfulness", "Exercise", "Social support", "EMDR", "DBT"],
    globalStats: "1 in 4 people will experience a mental health condition in their lifetime",
  },
};

export function analyzePersonalityInput(text) {
  const words = text.toLowerCase();
  const traits = [];
  if (/creative|art|imagine|invent|idea/.test(words)) traits.push("High Openness");
  if (/plan|organize|schedule|deadline|goal/.test(words)) traits.push("High Conscientiousness");
  if (/people|party|social|friends|talk/.test(words)) traits.push("Extraversion");
  if (/alone|quiet|read|think|solitude/.test(words)) traits.push("Introversion");
  if (/help|care|kind|empathy|others/.test(words)) traits.push("High Agreeableness");
  if (/worry|stress|anxious|nervous/.test(words)) traits.push("High Neuroticism");
  return traits.length > 0 ? traits : ["Balanced personality profile"];
}

export function getMoodAdvice(mood) {
  const advice = {
    sad: ["It's okay to feel sad — emotions are valid. Try: a short walk, talking to someone you trust, or journaling your thoughts.", "Sadness often signals what matters to us. Be gentle with yourself today."],
    anxious: ["Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s.", "Ground yourself: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste."],
    happy: ["Wonderful! Savor this feeling — research shows consciously appreciating joy makes it last longer.", "Share your happiness — it multiplies when shared!"],
    angry: ["Take 10 deep breaths before responding to anything.", "Physical movement (walking, exercise) is the fastest way to process anger."],
    stressed: ["Break your task into 3 specific next actions. Vague goals create stress.", "The Pomodoro technique: 25 minutes focus, 5 minute break. Repeat."],
    bored: ["Boredom is creativity waiting to happen. Try something you've never done before.", "Learn one new thing today — a word, a skill, a fact about the world."],
  };
  const key = Object.keys(advice).find(k => mood.toLowerCase().includes(k));
  return key ? advice[key][Math.floor(Math.random() * advice[key].length)] : "Whatever you're feeling is valid. I'm here to talk.";
}

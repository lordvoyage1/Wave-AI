/**
 * Wave AI — Voice Chat — Conversation Manager
 * Manages multi-turn voice conversation state, context, and flow.
 */
export class ConversationManager {
  constructor() {
    this.history = [];
    this.context = {};
    this.sessionId = `session_${Date.now()}`;
    this.startTime = Date.now();
    this.turnCount = 0;
    this.language = "en-US";
    this.userName = null;
    this.topic = null;
    this.mood = "neutral";
    this.maxHistory = 20;
  }

  addTurn(role, text, metadata = {}) {
    const turn = { role, text, timestamp: Date.now(), turnIndex: this.turnCount, metadata };
    this.history.push(turn);
    if (this.history.length > this.maxHistory) this.history = this.history.slice(-this.maxHistory);
    if (role === "user") {
      this.turnCount++;
      this._updateContext(text);
    }
    return turn;
  }

  _updateContext(userText) {
    const lower = userText.toLowerCase();
    if (!this.userName) {
      const nameMatch = lower.match(/my name is (\w+)|i'm (\w+)|i am (\w+)/);
      if (nameMatch) this.userName = (nameMatch[1] || nameMatch[2] || nameMatch[3]);
    }
    const topics = { technology: /ai|machine learning|code|software|tech/, music: /music|song|band|concert/, food: /food|eat|restaurant|cooking/, sports: /sport|football|basketball|soccer/, travel: /travel|trip|vacation|country/ };
    for (const [t, pattern] of Object.entries(topics)) { if (pattern.test(lower)) { this.topic = t; break; } }
    const moods = { happy: /happy|great|amazing|wonderful|excited/, sad: /sad|depressed|upset|crying|terrible/, frustrated: /frustrated|angry|annoying|hate|worst/ };
    for (const [m, pattern] of Object.entries(moods)) { if (pattern.test(lower)) { this.mood = m; break; } }
  }

  buildSystemPrompt(basePrompt = "") {
    let prompt = basePrompt || "You are Wave AI, a helpful intelligent assistant.";
    if (this.userName) prompt += ` The user's name is ${this.userName}.`;
    if (this.topic) prompt += ` Current topic: ${this.topic}.`;
    if (this.mood !== "neutral") prompt += ` User seems ${this.mood} — respond with appropriate empathy.`;
    prompt += " Keep voice responses concise (1-3 sentences). Be warm and conversational.";
    return prompt;
  }

  getRecentHistory(turns = 6) { return this.history.slice(-turns * 2); }
  formatForAPI() { return this.getRecentHistory().map(t => ({ role: t.role === "assistant" ? "assistant" : "user", content: t.text })); }
  getSessionDuration() { return Date.now() - this.startTime; }
  getStats() { return { turns: this.turnCount, duration: this.getSessionDuration(), userName: this.userName, topic: this.topic, mood: this.mood, messageCount: this.history.length }; }
  clear() { this.history = []; this.turnCount = 0; this.topic = null; this.mood = "neutral"; }
  exportTranscript() { return this.history.map(t => `[${t.role.toUpperCase()}]: ${t.text}`).join("\n"); }
  getLastUserMessage() { return this.history.filter(t => t.role === "user").slice(-1)[0]?.text || ""; }
  getLastAIResponse() { return this.history.filter(t => t.role === "assistant").slice(-1)[0]?.text || ""; }
}

export const conversationManager = new ConversationManager();

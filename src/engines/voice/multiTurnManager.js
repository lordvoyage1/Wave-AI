/**
 * Wave AI — Voice Chat — Multi-Turn Conversation Manager
 */
export class MultiTurnVoiceManager {
  constructor() { this.turns = []; this.context = { topic: null, entities: [], facts: [] }; this.maxTurns = 15; }

  addUserTurn(text) {
    const turn = { role: "user", text, timestamp: Date.now(), entities: this._extractEntities(text) };
    this.turns.push(turn);
    this._updateContext(turn);
    if (this.turns.length > this.maxTurns * 2) this.turns = this.turns.slice(-this.maxTurns * 2);
    return turn;
  }

  addAITurn(text) {
    const turn = { role: "assistant", text, timestamp: Date.now() };
    this.turns.push(turn);
    return turn;
  }

  _extractEntities(text) {
    const entities = [];
    const words = text.split(/\s+/);
    const capitalized = words.filter(w => /^[A-Z][a-z]{2,}$/.test(w));
    entities.push(...capitalized.map(w => ({ type: "proper_noun", value: w })));
    const numbers = text.match(/\b\d+(?:\.\d+)?\b/g) || [];
    entities.push(...numbers.map(n => ({ type: "number", value: n })));
    return entities;
  }

  _updateContext(turn) {
    const topics = { weather: /weather|temperature|rain|sunny|cold|hot|wind/, tech: /ai|computer|phone|app|software/, food: /eat|food|restaurant|cook|meal/, health: /sick|health|doctor|medicine|exercise/ };
    for (const [topic, pattern] of Object.entries(topics)) { if (pattern.test(turn.text.toLowerCase())) { this.context.topic = topic; break; } }
    this.context.entities.push(...turn.entities);
    if (this.context.entities.length > 20) this.context.entities = this.context.entities.slice(-20);
  }

  getContextualPrompt(basePrompt = "") {
    let context = basePrompt;
    if (this.context.topic) context += ` Current topic: ${this.context.topic}.`;
    if (this.context.entities.length > 0) { const recent = [...new Set(this.context.entities.map(e => e.value))].slice(-5).join(", "); context += ` Referenced: ${recent}.`; }
    return context;
  }

  buildAPIMessages(systemPrompt) {
    const msgs = [{ role: "system", content: systemPrompt }];
    const recent = this.turns.slice(-10);
    for (const turn of recent) msgs.push({ role: turn.role, content: turn.text });
    return msgs;
  }

  detectRepetition() {
    const userTurns = this.turns.filter(t => t.role === "user");
    if (userTurns.length < 2) return false;
    const last = userTurns[userTurns.length - 1].text.toLowerCase();
    const prev = userTurns[userTurns.length - 2].text.toLowerCase();
    return last === prev || (last.length > 5 && prev.includes(last));
  }

  getTurnCount() { return this.turns.filter(t => t.role === "user").length; }
  getHistory() { return [...this.turns]; }
  clear() { this.turns = []; this.context = { topic: null, entities: [], facts: [] }; }
}
export const multiTurnManager = new MultiTurnVoiceManager();

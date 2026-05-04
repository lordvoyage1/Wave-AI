/**
 * Wave AI — Voice Chat — Voice Feedback System
 * Collect and analyze voice interaction quality feedback.
 */
const FEEDBACK_KEY = "wave_voice_feedback";

export class VoiceFeedbackSystem {
  constructor() { this.sessions = this._load(); }

  _load() { try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]"); } catch { return []; } }
  _save() { try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(this.sessions.slice(-100))); } catch {} }

  recordSession(data) {
    const session = {
      id: `vf_${Date.now()}`,
      timestamp: Date.now(),
      duration: data.duration || 0,
      turns: data.turns || 0,
      recognitionAccuracy: data.recognitionAccuracy || null,
      userRating: null,
      language: data.language || "en-US",
      issues: [],
    };
    this.sessions.unshift(session);
    this._save();
    return session.id;
  }

  rateSession(sessionId, rating, comment = "") {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return false;
    session.userRating = rating;
    session.userComment = comment;
    session.ratedAt = Date.now();
    this._save();
    return true;
  }

  reportIssue(sessionId, issue) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return false;
    session.issues.push({ issue, reportedAt: Date.now() });
    this._save();
    return true;
  }

  getStats() {
    const rated = this.sessions.filter(s => s.userRating !== null);
    const avgRating = rated.length ? rated.reduce((s, r) => s + r.userRating, 0) / rated.length : 0;
    const commonIssues = {};
    this.sessions.forEach(s => s.issues.forEach(i => { commonIssues[i.issue] = (commonIssues[i.issue] || 0) + 1; }));
    return { totalSessions: this.sessions.length, ratedSessions: rated.length, avgRating: Math.round(avgRating * 10) / 10, commonIssues };
  }

  getRecentSessions(n = 10) { return this.sessions.slice(0, n); }
  clear() { this.sessions = []; this._save(); }
}
export const voiceFeedbackSystem = new VoiceFeedbackSystem();

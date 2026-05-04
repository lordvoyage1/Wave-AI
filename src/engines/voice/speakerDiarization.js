/**
 * Wave AI — Voice Chat — Speaker Diarization
 * Segment audio by speaker identity.
 */
export class SpeakerDiarizer {
  constructor() { this.speakers = new Map(); this.segments = []; this.currentSpeaker = null; this.speakerCount = 0; }

  processTranscript(transcript, timestamp, audioLevel) {
    const speakerKey = this._determineSpeaker(audioLevel, timestamp);
    const segment = { id: `seg_${this.segments.length + 1}`, speaker: speakerKey, text: transcript, timestamp, audioLevel };
    this.segments.push(segment);
    if (!this.speakers.has(speakerKey)) { this.speakers.set(speakerKey, { id: speakerKey, label: `Speaker ${this.speakers.size + 1}`, segmentCount: 0, wordCount: 0 }); }
    const speaker = this.speakers.get(speakerKey);
    speaker.segmentCount++;
    speaker.wordCount += transcript.split(/\s+/).length;
    return segment;
  }

  _determineSpeaker(audioLevel, timestamp) {
    if (!this.currentSpeaker) { this.currentSpeaker = "SPEAKER_0"; return this.currentSpeaker; }
    const lastSegment = this.segments[this.segments.length - 1];
    const gap = lastSegment ? timestamp - lastSegment.timestamp : 0;
    if (gap > 3000) {
      const nextId = `SPEAKER_${this.speakers.size % 2}`;
      this.currentSpeaker = nextId;
    }
    return this.currentSpeaker;
  }

  getSpeakers() { return [...this.speakers.values()]; }
  getSegments() { return [...this.segments]; }
  clear() { this.speakers.clear(); this.segments = []; this.currentSpeaker = null; this.speakerCount = 0; }

  formatTranscript() {
    return this.segments.map(s => { const speaker = this.speakers.get(s.speaker); return `**${speaker?.label || s.speaker}**: ${s.text}`; }).join("\n\n");
  }

  exportJSON() { return JSON.stringify({ speakers: this.getSpeakers(), segments: this.getSegments(), exportedAt: new Date().toISOString() }, null, 2); }
}
export const speakerDiarizer = new SpeakerDiarizer();

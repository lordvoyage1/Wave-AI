/**
 * Wave AI — Video Generation — Storyboard Creator
 */
import { sendChatMessage } from "@/lib/aiService";

export class StoryboardCreator {
  constructor() { this.scenes = []; this.style = "cinematic"; this.fps = 30; }

  async generateFromPrompt(prompt, sceneCount = 5) {
    const aiPrompt = `Create a ${sceneCount}-scene video storyboard for: "${prompt}"\n\nFor each scene provide:\n1. Scene title\n2. Visual description (what camera sees)\n3. Audio/narration text\n4. Duration in seconds\n5. Transition type (fade/cut/dissolve)\n\nFormat as JSON array.`;
    try {
      const response = await sendChatMessage(aiPrompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const scenes = JSON.parse(jsonMatch[0]);
        this.scenes = scenes.map((s, i) => ({ id: `scene_${i + 1}`, index: i, ...s, transition: s.transition || "fade", duration: s.duration || 5 }));
        return { success: true, scenes: this.scenes };
      }
    } catch {}
    this.scenes = this._generateDefaultScenes(prompt, sceneCount);
    return { success: true, scenes: this.scenes };
  }

  _generateDefaultScenes(prompt, count) {
    return Array.from({ length: count }, (_, i) => ({
      id: `scene_${i + 1}`,
      index: i,
      title: `Scene ${i + 1}`,
      visual: `${prompt} - angle ${i + 1}`,
      audio: i === 0 ? `Introduction to ${prompt}` : i === count - 1 ? `Conclusion of ${prompt}` : `Exploring ${prompt}`,
      duration: 5,
      transition: ["fade", "cut", "dissolve", "slide_left", "zoom_in"][i % 5],
    }));
  }

  addScene(scene) {
    const id = `scene_${Date.now()}`;
    this.scenes.push({ id, index: this.scenes.length, duration: 5, transition: "fade", ...scene });
    return id;
  }

  removeScene(id) { this.scenes = this.scenes.filter(s => s.id !== id).map((s, i) => ({ ...s, index: i })); }
  reorderScene(id, newIndex) {
    const idx = this.scenes.findIndex(s => s.id === id);
    if (idx === -1) return;
    const [scene] = this.scenes.splice(idx, 1);
    this.scenes.splice(newIndex, 0, scene);
    this.scenes = this.scenes.map((s, i) => ({ ...s, index: i }));
  }

  getTotalDuration() { return this.scenes.reduce((s, scene) => s + scene.duration, 0); }
  getScenes() { return [...this.scenes]; }
  clear() { this.scenes = []; }
  exportJSON() { return JSON.stringify({ scenes: this.scenes, style: this.style, fps: this.fps, totalDuration: this.getTotalDuration() }, null, 2); }
}
export const storyboardCreator = new StoryboardCreator();

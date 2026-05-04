/**
 * Wave AI — Voice Chat — Voice Commands
 * Natural language voice command recognition and execution.
 */

export const VOICE_COMMANDS = {
  stop: { patterns: [/\bstop\b|\bhalt\b|\bcancel\b/i], action: "stop", description: "Stop current operation" },
  repeat: { patterns: [/\brepeat\b|\bsay again\b|\brepeat that\b/i], action: "repeat", description: "Repeat last response" },
  louder: { patterns: [/\blocuder\b|\bspeak up\b|\blouder\b|\bincrease volume\b/i], action: "louder", description: "Increase volume" },
  quieter: { patterns: [/\bquieter\b|\bsofter\b|\blower\b|\bdecrease volume\b/i], action: "quieter", description: "Decrease volume" },
  faster: { patterns: [/\bfaster\b|\bspeak faster\b|\bspeed up\b/i], action: "faster", description: "Increase speech rate" },
  slower: { patterns: [/\bslower\b|\bspeak slowly\b|\bslow down\b/i], action: "slower", description: "Decrease speech rate" },
  newChat: { patterns: [/\bnew chat\b|\bstart over\b|\breset\b|\bclear history\b/i], action: "newChat", description: "Start new conversation" },
  help: { patterns: [/\bwhat can you do\b|\bhelp\b|\bcommands\b/i], action: "help", description: "Show available commands" },
  weather: { patterns: [/\bweather\b|\btemperature\b|\bforecast\b/i], action: "weather", description: "Get weather info" },
  time: { patterns: [/\bwhat time\b|\bcurrent time\b|\bwhat's the time\b/i], action: "time", description: "Get current time" },
  date: { patterns: [/\bwhat date\b|\btoday's date\b|\bwhat day\b/i], action: "date", description: "Get current date" },
  joke: { patterns: [/\btell.*joke\b|\bjoke\b|\bmake me laugh\b/i], action: "joke", description: "Tell a joke" },
  news: { patterns: [/\blatest news\b|\bnews\b|\bheadlines\b/i], action: "news", description: "Get latest news" },
  music: { patterns: [/\bplay music\b|\bplay.*song\b|\bmusic\b/i], action: "music", description: "Music request" },
  translate: { patterns: [/\btranslate\b|\bhow do you say\b/i], action: "translate", description: "Translation request" },
};

export function detectVoiceCommand(transcript) {
  const lower = transcript.toLowerCase().trim();
  for (const [name, command] of Object.entries(VOICE_COMMANDS)) {
    for (const pattern of command.patterns) {
      if (pattern.test(lower)) {
        return { command: name, action: command.action, raw: transcript };
      }
    }
  }
  return null;
}

export class VoiceCommandHandler {
  constructor(voiceCore) {
    this.voiceCore = voiceCore;
    this.lastResponse = "";
    this.volume = 1.0;
    this.rate = 1.0;
    this.handlers = new Map();
    this._registerDefaults();
  }

  register(action, handler) { this.handlers.set(action, handler); }

  _registerDefaults() {
    this.register("stop", () => { this.voiceCore?.stopSpeaking(); this.voiceCore?.stopListening(); return null; });
    this.register("repeat", () => this.lastResponse || "I haven't said anything yet.");
    this.register("louder", () => { this.volume = Math.min(1, this.volume + 0.2); this.voiceCore?.setVolume?.(this.volume); return "Volume increased."; });
    this.register("quieter", () => { this.volume = Math.max(0.1, this.volume - 0.2); this.voiceCore?.setVolume?.(this.volume); return "Volume decreased."; });
    this.register("faster", () => { this.rate = Math.min(2, this.rate + 0.2); this.voiceCore?.setRate?.(this.rate); return "Speaking faster now."; });
    this.register("slower", () => { this.rate = Math.max(0.5, this.rate - 0.2); this.voiceCore?.setRate?.(this.rate); return "Speaking slower now."; });
    this.register("newChat", () => { this.voiceCore?.clearHistory?.(); return "Starting a fresh conversation. How can I help you?"; });
    this.register("time", () => `The current time is ${new Date().toLocaleTimeString()}.`);
    this.register("date", () => `Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`);
    this.register("joke", () => {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "I told my computer I needed a break. Now it won't stop sending me Kit-Kat ads.",
        "Why did the AI go to school? To improve its learning curve!",
        "What's a computer's favorite snack? Microchips!",
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    });
    this.register("help", () => "I can answer questions, tell jokes, check the time and date, adjust my speed and volume, and much more. Just talk to me naturally!");
  }

  async handle(transcript) {
    const command = detectVoiceCommand(transcript);
    if (!command) return null;
    const handler = this.handlers.get(command.action);
    if (!handler) return null;
    const response = await handler(transcript);
    if (response) this.lastResponse = response;
    return response;
  }

  setLastResponse(text) { this.lastResponse = text; }
}

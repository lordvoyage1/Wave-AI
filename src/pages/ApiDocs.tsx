import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Code2, Terminal, Zap, Lock, Globe, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Live Orb — same orb image, smaller, with animations ────────────── */
function MiniOrb({ size = 90 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(79,127,255,0.25) 0%, rgba(155,92,255,0.12) 45%, transparent 70%)",
          animation: "miniOrbGlow 3s ease-in-out infinite",
        }}
      />
      {/* Pulse ring */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -3,
          border: "1.5px solid rgba(155,92,255,0.25)",
          borderRadius: "50%",
          animation: "miniOrbPulse 2.5s ease-in-out infinite",
        }}
      />
      {/* Orb image */}
      <div
        className="rounded-full overflow-hidden"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          animation: "miniOrbFloat 5s ease-in-out infinite",
          willChange: "transform",
          boxShadow: `0 0 ${size * 0.2}px rgba(79,127,255,0.4), 0 ${size * 0.06}px ${size * 0.15}px rgba(0,0,0,0.3)`,
        }}
      >
        <img
          src="/orb.png"
          alt="Wave AI"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "50%" }}
          draggable={false}
        />
      </div>
    </div>
  );
}

/* ─── Code box with copy button ──────────────────────────────────────── */
function CodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-[#0d1117]">
      <button
        onClick={copy}
        className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-white/15 transition-all opacity-0 group-hover:opacity-100"
      >
        {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        className="p-4 text-xs font-mono overflow-x-auto scrollbar-thin"
        style={{ color: "#a5f3a0", lineHeight: 1.65 }}
      >
        {code}
      </pre>
    </div>
  );
}

/* ─── Build snippets at render time (dynamic base URL) ───────────────── */
function buildSnippets(base: string) {
  return {
    chat: `GET https://api.princetechn.com/api/ai/gpt4o?apikey=prince&q=Your+question

Response:
{
  "result": "AI response text here"
}`,
    codeGen: `GET https://apiskeith.top/ai/codegen?q=Write+a+REST+API+in+Node.js

Response:
{
  "result": "Code block returned as markdown string"
}`,
    image: `GET https://api.princetechn.com/api/ai/fluximg?apikey=prince&prompt=A+mountain+at+sunrise

Response: "https://cdn.example.com/generated-image.jpg"`,
    video: `GET https://api.princetechn.com/api/ai/veo3/generate?apikey=prince
  &prompt=A+cinematic+drone+shot+over+mountains

Response:
{
  "result": "https://cdn.example.com/video.mp4"
}`,
    tts: `GET https://api.princetechn.com/api/ai/tts
  ?apikey=prince
  &text=Hello+world
  &voice=en_us_female

Available voices: en_us_female, en_us_male, en_uk_female, en_uk_male, en_au_female`,
    vision: `GET https://api.princetechn.com/api/ai/vision
  ?apikey=prince
  &url=https://example.com/image.jpg
  &prompt=What+is+in+this+image?

Response:
{
  "result": "The image shows..."
}`,
    post: `POST https://apis.xcasper.space/api/ai/gemini
Content-Type: application/json

{
  "message": "What is quantum computing?"
}

Response:
{
  "response": "Quantum computing is..."
}`,
    jsExample: `// Wave AI — Deployed at: ${base}
// Built by Wave Platforms, Inc. | CEO: Meddy Mususwa

async function askWaveAI(question) {
  const url = "https://api.princetechn.com/api/ai/gpt4o"
    + "?apikey=prince&q=" + encodeURIComponent(question);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const data = await res.json();
  return data.result || data.response || data.answer;
}

const answer = await askWaveAI("What is the capital of France?");
console.log(answer); // "The capital of France is Paris."`,
  };
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function ApiDocs() {
  const navigate = useNavigate();
  const [base, setBase] = useState("https://wave-ai.app");

  useEffect(() => {
    if (typeof window !== "undefined") setBase(window.location.origin);
  }, []);

  const SNIPPETS = buildSnippets(base);

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fc] text-slate-800">
      <div className="max-w-3xl mx-auto px-5 py-10 pb-20">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-10 min-h-[44px]"
        >
          <ChevronLeft size={15} /> Back
        </button>

        {/* Hero with live orb */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="mb-5">
            <MiniOrb size={100} />
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, #4f7fff 0%, #9b5cff 50%, #f472b6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            API Documentation
          </h1>
          <p className="text-sm text-slate-400 max-w-sm">
            Wave AI integration reference. Current deployment:{" "}
            <code className="text-primary font-mono text-[0.8em] px-1 py-0.5 bg-primary/8 rounded">
              {base}
            </code>
          </p>
          <p className="text-xs text-slate-300 mt-2">
            Built by Wave Platforms, Inc. · CEO: Meddy Mususwa
          </p>
        </div>

        <div className="space-y-10 text-sm">

          {/* Overview */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Zap size={15} className="text-amber-400" /> Overview
            </h2>
            <p className="text-slate-500 mb-4 leading-relaxed text-sm">
              Wave AI powers all its capabilities — chat, code, image, video, TTS, and vision — through a unified intelligent backend with automatic failover routing. All features are accessible through simple HTTP calls.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Architecture</p>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  Intelligent multi-provider routing with automatic failover
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                  Parallel request batching for minimum response latency
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0" />
                  Abort controller support for user-initiated cancellation
                </div>
              </div>
            </div>
          </section>

          {/* Endpoints */}
          <section>
            <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
              <Terminal size={15} className="text-emerald-500" /> Endpoints
            </h2>
            <div className="space-y-6">
              {[
                { title: "Chat",                desc: "General conversation and question answering with intelligent response routing.", code: SNIPPETS.chat },
                { title: "Code Generation",     desc: "Generate production-ready code in any language.", code: SNIPPETS.codeGen },
                { title: "Image Generation",    desc: "Generates a photorealistic image. Returns the URL directly as a string.", code: SNIPPETS.image },
                { title: "Video Generation",    desc: "Generates a cinematic video clip from a prompt.", code: SNIPPETS.video },
                { title: "Text-to-Speech",      desc: "Converts text to natural-sounding speech. Returns audio file URL.", code: SNIPPETS.tts },
                { title: "Vision Analysis",     desc: "Analyzes an image URL and answers your prompt about it.", code: SNIPPETS.vision },
                { title: "POST endpoints",      desc: "Additional providers accepting POST with JSON body.", code: SNIPPETS.post },
              ].map(({ title, desc, code }) => (
                <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                  <p className="text-slate-400 text-xs mb-3">{desc}</p>
                  <CodeBox code={code} />
                </div>
              ))}
            </div>
          </section>

          {/* JS Example */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Globe size={15} className="text-blue-500" /> JavaScript Example
            </h2>
            <CodeBox code={SNIPPETS.jsExample} />
          </section>

          {/* Notes */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Lock size={15} className="text-violet-500" /> Notes
            </h2>
            <ul className="space-y-2.5 text-slate-500 text-sm">
              {[
                "All endpoints support CORS and can be called from browsers.",
                "The apikey=prince key is a demo key — rate limits may apply.",
                "Always set a timeout (15–20s) since AI responses may take time.",
                "Response field names vary by provider — check for result, response, answer.",
                "Wave AI automatically selects the best available model for each request.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Developer info */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Code2 size={15} className="text-emerald-500" /> Developer Information
            </h2>
            <div className="space-y-2 text-sm text-slate-500">
              <p><strong className="text-slate-700">Product:</strong> Wave AI</p>
              <p><strong className="text-slate-700">Company:</strong> Wave Platforms, Inc.</p>
              <p><strong className="text-slate-700">CEO:</strong> Meddy Mususwa</p>
              <p><strong className="text-slate-700">Copyright:</strong> ®2026 Wave Platforms, Inc.™</p>
              <p className="text-xs text-slate-400 mt-3">Wave AI is a brand product of Wave Platforms. All rights reserved.</p>
            </div>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
          <button onClick={() => navigate("/about")} className="text-sm text-primary hover:underline">
            ← About
          </button>
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl wave-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-sm"
          >
            Open Wave AI
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-300 mt-6">
          ®2026 Wave Platforms, Inc.™ · All rights reserved.
        </p>
      </div>
    </div>
  );
}

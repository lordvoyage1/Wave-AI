import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send, Plus, Trash2, Download, Copy, Check,
  Paperclip, X, Play, Square, Volume2,
  Image as ImageIcon, FileText, Archive, Film,
  RotateCcw, Mic, MicOff, User, Phone, PhoneOff,
  Search, LogOut, ChevronRight, Lock,
  MessageSquare, Code2, Wand2, Globe, Info, Key, Shield, Zap, Star, Eye,
  Home, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateId, formatTime, formatDate, formatFileSize, truncate } from "@/lib/utils";
import { Message, Chat, FileAttachment } from "@/types";
import { VOICES } from "@/constants/models";
import SynthVisualizer from "@/components/features/SynthVisualizer";
import OnboardingModal, { hasSeenOnboarding } from "@/components/features/OnboardingModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  detectIntent, sendChatMessage, generateCode,
  generateImage, generateVideo, buildTTSUrl,
  analyzeImage, analyzeFileContent, ImageModel,
} from "@/lib/aiService";

/* ─────────────────────────── persistence ──────────────────────────────── */
const STORE = "wave_chats_v1";
function saveChats(chats: Chat[]) {
  try {
    localStorage.setItem(STORE, JSON.stringify(chats.map(c => ({
      ...c,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
      messages: c.messages.slice(-120).map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      })),
    }))));
  } catch { /* storage full */ }
}
function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(STORE) || localStorage.getItem("alva_chats_v4");
    if (!raw) return [];
    return JSON.parse(raw).map((c: Record<string, unknown>) => ({
      ...c,
      createdAt: new Date(c.createdAt as string),
      updatedAt: new Date(c.updatedAt as string),
      messages: ((c.messages as Record<string, unknown>[]) || []).map(m => ({
        ...m,
        timestamp: new Date(m.timestamp as string),
      })),
    })) as Chat[];
  } catch { return []; }
}
function makeChat(): Chat {
  return { id: generateId(), title: "New conversation", messages: [], createdAt: new Date(), updatedAt: new Date() };
}
function deriveTitle(msgs: Message[]): string {
  const u = msgs.find(m => m.role === "user");
  if (!u) return "New conversation";
  return u.content.slice(0, 48) + (u.content.length > 48 ? "…" : "");
}

/* ─────────────────────── markdown renderer ─────────────────────────────── */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      out.push(<CodeBlock key={`cb-${i}`} code={code.join("\n")} lang={lang} />);
      i++; continue;
    }
    if (line.startsWith("### ")) { out.push(<h3 key={i} className="text-sm font-semibold mt-3 mb-1 text-foreground">{line.slice(4)}</h3>); i++; continue; }
    if (line.startsWith("## "))  { out.push(<h2 key={i} className="text-base font-semibold mt-3 mb-1 text-foreground">{line.slice(3)}</h2>); i++; continue; }
    if (line.startsWith("# "))   { out.push(<h1 key={i} className="text-lg font-bold mt-3 mb-1 text-foreground">{line.slice(2)}</h1>); i++; continue; }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) { items.push(lines[i].slice(2)); i++; }
      out.push(<ul key={i} className="list-disc pl-5 my-1.5 space-y-0.5">{items.map((it, j) => <li key={j} className="text-sm">{inlineFmt(it)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, "")); i++; }
      out.push(<ol key={i} className="list-decimal pl-5 my-1.5 space-y-0.5">{items.map((it, j) => <li key={j} className="text-sm">{inlineFmt(it)}</li>)}</ol>);
      continue;
    }
    if (line.startsWith("> ")) { out.push(<blockquote key={i} className="border-l-2 border-primary/40 pl-3 my-1.5 text-sm text-muted-foreground italic">{line.slice(2)}</blockquote>); i++; continue; }
    if (line === "---" || line === "***") { out.push(<hr key={i} className="border-border my-3" />); i++; continue; }
    if (!line.trim()) { out.push(<div key={i} className="h-1.5" />); i++; continue; }
    out.push(<p key={i} className="text-sm leading-relaxed">{inlineFmt(line)}</p>);
    i++;
  }
  return out;
}

function inlineFmt(text: string): React.ReactNode {
  const segs = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return segs.map((s, i) => {
    if (s.startsWith("**") && s.endsWith("**")) return <strong key={i} className="font-semibold">{s.slice(2, -2)}</strong>;
    if (s.startsWith("*") && s.endsWith("*") && s.length > 2) return <em key={i}>{s.slice(1, -1)}</em>;
    if (s.startsWith("`") && s.endsWith("`") && s.length > 2) return <code key={i} className="px-1 py-0.5 rounded bg-primary/10 text-primary text-[0.82em] font-mono">{s.slice(1, -1)}</code>;
    const lm = s.match(/^\[(.+?)\]\((.+?)\)$/);
    if (lm) return <a key={i} href={lm[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline">{lm[1]}</a>;
    return <span key={i}>{s}</span>;
  });
}

/* ─────────────────────────── CodeBlock ─────────────────────────────────── */
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const copy = () => { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const dl = () => {
    const extMap: Record<string, string> = { javascript:"js",typescript:"ts",tsx:"tsx",jsx:"jsx",python:"py",go:"go",rust:"rs",java:"java",html:"html",css:"css",sql:"sql",bash:"sh" };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    a.download = `code.${extMap[lang] || "txt"}`;
    a.click();
  };
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 bg-[#1a1a2e]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-[#13132b]">
        <span className="text-[11px] font-mono text-slate-400">{lang || "code"}</span>
        <div className="flex items-center gap-1">
          <button onClick={dl} style={{ touchAction: "manipulation" }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors" title="Download"><Download size={11} /></button>
          <button onClick={copy} style={{ touchAction: "manipulation" }} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-colors hover:bg-white/10", copied ? "text-emerald-400" : "text-slate-400 hover:text-slate-200")}>
            {copied ? <Check size={10} /> : <Copy size={10} />}{copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <div className="relative flex">
        {lines.length > 1 && (
          <div className="w-10 flex flex-col items-end pr-2.5 py-3.5 select-none border-r border-slate-700/30 flex-shrink-0">
            {lines.map((_, j) => <span key={j} className="text-[11px] font-mono text-slate-600 leading-5">{j + 1}</span>)}
          </div>
        )}
        <pre className={cn("flex-1 py-3.5 pr-4 overflow-x-auto scrollbar-thin text-[13px] font-mono leading-5", lines.length > 1 ? "pl-3" : "pl-4")} style={{ color: "#a5f3a0" }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => <span key={i} className="typing-dot w-2 h-2 rounded-full bg-primary/40" style={{ animationDelay: `${i * 0.2}s` }} />)}
    </div>
  );
}

function OrbAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0"
      style={{
        width: size, height: size,
        boxShadow: "0 0 8px rgba(79,127,255,0.4)",
        animation: "avatarPulse 3s ease-in-out infinite",
        willChange: "box-shadow",
      }}
    >
      <img src="/orb.png" alt="Wave AI" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
    </div>
  );
}

type RingState = "idle" | "thinking" | "speaking" | "listening";

function AIRing({ state, size = 120 }: { state: RingState; size?: number }) {
  const isActive = state !== "idle";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(79,127,255,0.18) 0%, rgba(155,92,255,0.08) 50%, transparent 70%)",
          animation: isActive ? "aiOrbGlowActive 1s ease-in-out infinite" : "aiOrbGlow 3s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -4,
          border: `1.5px solid rgba(155,92,255,${isActive ? 0.4 : 0.15})`,
          borderRadius: "50%",
          animation: isActive ? "aiOrbPulseActive 0.9s ease-in-out infinite" : "aiOrbPulse 3s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: size * 0.78, height: size * 0.78,
          animation: state === "thinking" ? "aiOrbBounce 0.8s ease-in-out infinite" : state === "listening" ? "aiOrbShake 0.5s ease-in-out infinite" : "aiOrbFloat 5s ease-in-out infinite",
          willChange: "transform",
          boxShadow: `0 0 ${size * 0.15}px rgba(79,127,255,${isActive ? 0.55 : 0.3}), 0 ${size * 0.04}px ${size * 0.1}px rgba(0,0,0,0.25)`,
        }}
      >
        <img src="/orb.png" alt="Wave AI" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "50%" }} draggable={false} />
        {isActive && (
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,127,255,0.3) 0%, transparent 65%)", animation: "aiOrbSheen 0.8s ease-in-out infinite", willChange: "opacity" }} />
        )}
      </div>
      {state === "thinking" && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 items-end">
          {[0,1,2].map(i => <span key={i} className="typing-dot w-1 h-1 rounded-full bg-primary/70" />)}
        </div>
      )}
      {state === "listening" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Mic size={size * 0.18} className="text-white drop-shadow-lg" style={{ filter: "drop-shadow(0 0 4px #f43f5e)" }} />
        </div>
      )}
      {state === "speaking" && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <SynthVisualizer isActive barCount={5} className="h-4" />
        </div>
      )}
    </div>
  );
}

function GuestGate({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <OrbAvatar size={52} />
      <div className="mt-4 mb-2">
        <h3 className="text-base font-semibold text-slate-800">Account required</h3>
      </div>
      <p className="text-xs text-slate-400 mb-5 max-w-[220px] leading-relaxed">
        Sign in to generate images, create videos, and download content.
      </p>
      <button
        onClick={onSignIn}
        style={{ touchAction: "manipulation", background: "linear-gradient(135deg,#4f7fff,#9b5cff,#f472b6)" }}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-all min-h-[44px]"
      >
        Sign in / Create account
      </button>
    </div>
  );
}

function MessageBubble({ msg, onRetry, canDownload }: { msg: Message; onRetry?: () => void; canDownload: boolean }) {
  const [copied, setCopied] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [vidErr, setVidErr] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const copy = () => { navigator.clipboard.writeText(msg.content).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const toggleAudio = () => {
    if (!msg.audioUrl) return;
    if (!audioRef.current) { audioRef.current = new Audio(msg.audioUrl); audioRef.current.onended = () => setPlaying(false); }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setPlaying(true); }
  };

  if (msg.role === "user") {
    return (
      <div className="flex justify-end items-end gap-2.5 px-4 py-2 group">
        <div className="max-w-[80%] space-y-1.5">
          {msg.files?.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
              {f.type.startsWith("image/") ? <ImageIcon size={12} className="text-violet-500 flex-shrink-0" /> : f.name.endsWith(".zip") ? <Archive size={12} className="text-amber-500 flex-shrink-0" /> : <FileText size={12} className="text-blue-500 flex-shrink-0" />}
              <span className="text-xs text-slate-600 truncate">{f.name}</span>
              <span className="text-[10px] text-slate-400 flex-shrink-0">{formatFileSize(f.size)}</span>
            </div>
          ))}
          {msg.files?.find(f => f.type.startsWith("image/"))?.dataUrl && (
            <img src={msg.files!.find(f => f.type.startsWith("image/"))!.dataUrl} alt="Uploaded" className="rounded-xl max-h-52 object-contain border border-slate-200 w-full" />
          )}
          <div className="bg-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm">{msg.content}</div>
          <div className="text-right"><span className="text-[10px] text-slate-400">{formatTime(msg.timestamp)}</span></div>
        </div>
        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
          <User size={12} className="text-slate-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 px-4 py-2 group fade-slide-up">
      <div className="flex-shrink-0 mt-0.5"><OrbAvatar size={28} /></div>
      <div className="flex-1 min-w-0 max-w-[88%]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold gradient-shimmer">Wave AI</span>
          <span className="text-[10px] text-slate-400">{formatTime(msg.timestamp)}</span>
        </div>
        {msg.error && (
          <div className="rounded-2xl rounded-tl-sm px-4 py-3 border border-red-200 bg-red-50 text-sm text-red-600">
            {msg.content}
            {onRetry && <button onClick={onRetry} style={{ touchAction: "manipulation" }} className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 hover:text-slate-700"><RotateCcw size={11} /> Try again</button>}
          </div>
        )}
        {msg.type === "image-result" && msg.imageUrl && !imgErr && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-w-xs">
            <img src={msg.imageUrl} alt={msg.content} onError={() => setImgErr(true)} className="w-full object-cover block" loading="lazy" />
            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500 line-clamp-1 flex-1">{msg.content}</p>
              {canDownload ? (
                <a href={msg.imageUrl} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-primary flex-shrink-0"><Download size={10} /> Save</a>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-slate-300 flex-shrink-0 cursor-not-allowed"><Lock size={10} /> Save</span>
              )}
            </div>
          </div>
        )}
        {msg.type === "image-result" && (imgErr || !msg.imageUrl) && (
          <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-slate-50 border border-slate-200 text-sm text-slate-500">Image generation in progress. Try again with a different prompt.</div>
        )}
        {msg.type === "video-result" && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-w-md">
            {msg.videoUrl && !vidErr ? (
              <video controls className="w-full aspect-video bg-black" src={msg.videoUrl} onError={() => setVidErr(true)} />
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-6 gap-3">
                <Film size={24} className="text-slate-400" />
                <p className="text-sm text-center text-slate-500 max-w-xs">{msg.content}</p>
                {msg.videoUrl && canDownload && <a href={msg.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open Video ↗</a>}
              </div>
            )}
          </div>
        )}
        {msg.type === "audio-result" && msg.audioUrl && (
          <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white shadow-sm px-4 py-4 max-w-xs">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={toggleAudio} style={{ touchAction: "manipulation" }} className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-sm", playing ? "wave-gradient text-white" : "bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200")}>
                {playing ? <Square size={11} /> : <Play size={11} />}
              </button>
              <div className="flex-1">
                {playing && <SynthVisualizer isActive barCount={10} className="h-5 mb-1" />}
                <p className="text-xs text-slate-500">{VOICES.find(v => v.id === msg.content?.split("|")[1])?.label || "Voice"}</p>
              </div>
              {canDownload && <a href={msg.audioUrl} download className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><Download size={13} /></a>}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3">"{msg.content?.split("|")[0]}"</p>
          </div>
        )}
        {!msg.error && !["image-result", "video-result", "audio-result"].includes(msg.type) && (
          <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white border border-slate-100 shadow-sm text-sm text-slate-800 leading-relaxed msg-text">
            {renderMarkdown(msg.content)}
          </div>
        )}
        {!msg.error && !["image-result", "video-result"].includes(msg.type) && (
          <div className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={copy} style={{ touchAction: "manipulation" }} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors min-h-[28px]">
              {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}{copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Voice call modal ──────────────────────────────── */
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

function VoiceModal({ onClose, onSend }: { onClose: () => void; onSend: (t: string) => void }) {
  const [status, setStatus] = useState<"idle" | "listening" | "processing">("idle");
  const [transcript, setTranscript] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");
  const mountedRef = useRef(true);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const hasSR = !!SR;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; recRef.current?.stop(); window.speechSynthesis?.cancel(); };
  }, []);

  const startListen = () => {
    if (!hasSR || !mountedRef.current) return;
    transcriptRef.current = "";
    setTranscript("");
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => { if (mountedRef.current) setStatus("listening"); };
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      transcriptRef.current = t;
      if (mountedRef.current) setTranscript(t);
    };
    rec.onend = async () => {
      const t = transcriptRef.current.trim();
      if (!t || !mountedRef.current) { if (mountedRef.current) setStatus("idle"); return; }
      if (mountedRef.current) setStatus("processing");
      onSend(t);
      try {
        const resp = await sendChatMessage(t);
        if (!mountedRef.current) return;
        setSpeaking(true);
        const utt = new SpeechSynthesisUtterance(resp);
        utt.onend = () => { if (mountedRef.current) { setSpeaking(false); setStatus("idle"); setTranscript(""); } };
        window.speechSynthesis.speak(utt);
      } catch { if (mountedRef.current) setStatus("idle"); }
    };
    rec.onerror = () => { if (mountedRef.current) setStatus("idle"); };
    recRef.current = rec;
    rec.start();
  };

  const stopAll = () => { recRef.current?.stop(); window.speechSynthesis?.cancel(); if (mountedRef.current) { setSpeaking(false); setStatus("idle"); setTranscript(""); } };
  const ringState: RingState = status === "listening" ? "listening" : status === "processing" || speaking ? "thinking" : "idle";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border border-slate-100">
        <div className="flex items-center justify-center gap-2 mb-6">
          <OrbAvatar size={32} />
          <span className="font-semibold text-base text-slate-800">Wave AI</span>
        </div>
        <div className="flex justify-center mb-6">
          <AIRing state={ringState} size={130} />
        </div>
        {(status === "listening" || speaking) && (
          <div className="flex justify-center mb-4"><SynthVisualizer isActive barCount={12} className="h-6" /></div>
        )}
        <div className="min-h-[44px] mb-6">
          {transcript && <p className="text-sm text-slate-700 leading-relaxed px-2">{transcript}</p>}
          {!transcript && status === "idle" && !speaking && <p className="text-sm text-slate-400">{hasSR ? "Tap the mic to speak" : "Speech not supported in this browser"}</p>}
          {status === "processing" && <p className="text-sm text-primary font-medium">Wave AI is thinking…</p>}
          {speaking && <p className="text-sm text-emerald-500 font-medium">Wave AI is speaking…</p>}
        </div>
        <div className="flex items-center justify-center gap-4">
          {status === "idle" && !speaking && (
            <button onClick={startListen} disabled={!hasSR} style={{ touchAction: "manipulation" }} className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all", hasSR ? "wave-gradient text-white hover:opacity-90 call-pulse" : "bg-slate-100 text-slate-400 cursor-not-allowed")}>
              <Mic size={22} />
            </button>
          )}
          {(status === "listening" || speaking) && (
            <button onClick={stopAll} style={{ touchAction: "manipulation" }} className="w-14 h-14 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all">
              <MicOff size={22} />
            </button>
          )}
          <button onClick={() => { stopAll(); onClose(); }} style={{ touchAction: "manipulation" }} className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all">
            <PhoneOff size={18} />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-5">{hasSR ? "Use Chrome or Edge for best results" : "Use Chrome or Edge for voice support"}</p>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  { icon: MessageSquare, text: "Let's get to know each other",  color: "text-primary" },
  { icon: Zap,           text: "Learn how to use Wave AI",      color: "text-violet-500" },
  { icon: Star,          text: "Talk about my goals",           color: "text-pink-500" },
  { icon: Code2,         text: "Write a React component",       color: "text-emerald-500" },
  { icon: ImageIcon,     text: "Generate a landscape image",    color: "text-blue-500" },
  { icon: Film,          text: "Create a cinematic video clip", color: "text-amber-500" },
];

const IMG_MODELS: { id: ImageModel; label: string }[] = [
  { id: "flux",         label: "Photorealistic" },
  { id: "text2img",     label: "Quick" },
  { id: "pollinations", label: "Artistic" },
];

type TabId = "home" | "analyse" | "voice" | "account";

export default function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isGuest = !user;

  const [tab, setTab] = useState<TabId>("home");
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    try {
      // Re-use already-parsed chats from module scope rather than reading localStorage twice
      const raw = localStorage.getItem(STORE) || localStorage.getItem("alva_chats_v4");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { id: string }[];
      return parsed.length > 0 ? parsed[0].id : null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [voice, setVoice] = useState("en_us_female");
  const [imgModel, setImgModel] = useState<ImageModel>("flux");
  const abortRef = useRef<AbortController | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const [analyseMode, setAnalyseMode] = useState<"image" | "video">("image");
  const [analysePrompt, setAnalysePrompt] = useState("");
  const [analyseResult, setAnalyseResult] = useState<{ type: "image" | "video"; url: string; prompt: string } | null>(null);
  const [analyseLoading, setAnalyseLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding for first-time visitors — use requestIdleCallback so it
  // never blocks the initial paint.
  useEffect(() => {
    if (hasSeenOnboarding()) return;
    const show = () => setShowOnboarding(true);
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(show, { timeout: 800 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(show, 500);
    return () => clearTimeout(t);
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;
  const messages = activeChat?.messages ?? [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, isLoading]);
  useEffect(() => { const t = setTimeout(() => saveChats(chats), 500); return () => clearTimeout(t); }, [chats]);

  const adjustTA = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const newChat = useCallback(() => {
    const c = makeChat();
    setChats(p => [c, ...p]);
    setActiveChatId(c.id);
    setHistoryOpen(false);
    setInput("");
    setFiles([]);
    setTimeout(() => textareaRef.current?.focus(), 60);
  }, []);

  const delChat = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(p => p.filter(c => c.id !== id));
    setActiveChatId(prev => {
      if (prev !== id) return prev;
      const rest = chats.filter(c => c.id !== id);
      return rest.length > 0 ? rest[0].id : null;
    });
  }, [chats]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const sel = Array.from(e.target.files || []);
    if (!sel.length) return;
    const processed: FileAttachment[] = await Promise.all(sel.map(async file => {
      const att: FileAttachment = { name: file.name, type: file.type, size: file.size };
      if (file.type.startsWith("image/")) {
        att.dataUrl = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
      } else if (file.size < 3 * 1024 * 1024) {
        att.content = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsText(file); });
      }
      return att;
    }));
    setFiles(p => [...p, ...processed]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const handleSend = useCallback(async (customText?: string) => {
    const text = (customText ?? input).trim();
    if ((!text && files.length === 0) || isLoading) return;

    let chatId = activeChatId;
    if (!chatId) {
      const c = makeChat();
      setChats(p => [c, ...p]);
      setActiveChatId(c.id);
      chatId = c.id;
    }

    const userMsg: Message = {
      id: generateId(), role: "user", type: "text",
      content: text || `Analyzing: ${files.map(f => f.name).join(", ")}`,
      timestamp: new Date(),
      files: files.length > 0 ? [...files] : undefined,
    };

    setChats(p => p.map(c => {
      if (c.id !== chatId) return c;
      const msgs = [...c.messages, userMsg];
      return { ...c, messages: msgs, title: c.messages.length === 0 ? deriveTitle(msgs) : c.title, updatedAt: new Date() };
    }));
    setInput("");
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    // Abort any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const signal = ctrl.signal;
    setIsLoading(true);

    const hasImage = files.some(f => f.type.startsWith("image/"));
    const intent = detectIntent(text, hasImage);

    if (isGuest && (intent.type === "image" || intent.type === "video")) {
      const guestMsg: Message = {
        id: generateId(), role: "assistant", type: "text",
        content: "Image and video generation requires a free account. Create one in seconds to unlock this feature.",
        timestamp: new Date(),
      };
      setChats(p => p.map(c => c.id !== chatId ? c : { ...c, messages: [...c.messages, guestMsg], updatedAt: new Date() }));
      setIsLoading(false);
      return;
    }

    const history = (activeChat?.messages || [])
      .filter(m => ["text", "code", "vision-result", "file-result"].includes(m.type))
      .slice(-10).map(m => ({ role: m.role, content: m.content }));

    let reply: Message;
    try {
      if (signal.aborted) return;
      if (intent.type === "image") {
        const url = await generateImage(text, imgModel);
        reply = { id: generateId(), role: "assistant", type: "image-result", content: text, imageUrl: url, timestamp: new Date() };
      } else if (intent.type === "video") {
        const result = await generateVideo(text, signal);
        reply = { id: generateId(), role: "assistant", type: "video-result", content: text, videoUrl: result || undefined, timestamp: new Date() };
      } else if (intent.type === "tts") {
        const speakText = text.replace(/\b(say|speak|read\s+aloud|narrate|voice|text\s+to\s+speech|tts)\b:?\s*/gi, "").trim() || text;
        reply = { id: generateId(), role: "assistant", type: "audio-result", content: `${speakText}|${voice}`, audioUrl: buildTTSUrl(speakText, voice), timestamp: new Date() };
      } else if (intent.type === "vision" || hasImage) {
        const imgFile = files.find(f => f.type.startsWith("image/"));
        const imgUrl = imgFile?.dataUrl || text.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)/i)?.[0] || "";
        if (imgUrl) {
          const result = await analyzeImage(imgUrl, text || "Describe this image in detail", signal);
          reply = { id: generateId(), role: "assistant", type: "vision-result", content: result, timestamp: new Date() };
        } else {
          const result = await sendChatMessage(text, history, signal);
          reply = { id: generateId(), role: "assistant", type: "text", content: result, timestamp: new Date() };
        }
      } else if (intent.type === "code") {
        const result = await generateCode(text, intent.codeLanguage, history, signal);
        reply = { id: generateId(), role: "assistant", type: "code", content: result, codeLanguage: intent.codeLanguage, timestamp: new Date() };
      } else if (files.length > 0 && !hasImage) {
        const file = files[0];
        const result = await analyzeFileContent(file.name, file.content || `[Binary: ${file.name}]`, text || "Analyze this file", history, signal);
        reply = { id: generateId(), role: "assistant", type: "file-result", content: result, timestamp: new Date() };
      } else {
        const result = await sendChatMessage(text, history, signal);
        reply = { id: generateId(), role: "assistant", type: "text", content: result, timestamp: new Date() };
      }
    } catch (err: unknown) {
      // Aborted by user — don't show error
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsLoading(false);
        return;
      }
      reply = { id: generateId(), role: "assistant", type: "error", content: "Something went wrong. Please try again.", error: true, timestamp: new Date() };
    }

    if (signal.aborted) { setIsLoading(false); return; }
    setChats(p => p.map(c => c.id !== chatId ? c : { ...c, messages: [...c.messages, reply!], updatedAt: new Date() }));
    setIsLoading(false);
    abortRef.current = null;
  }, [input, files, isLoading, activeChatId, activeChat, imgModel, voice, isGuest]);

  const handleKD = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const requestMicPermission = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      if (stream) stream.getTracks().forEach(t => t.stop());
    } catch { /* silently ignore */ }
  }, []);

  const handleAnalyse = async () => {
    if (!analysePrompt.trim() || analyseLoading) return;
    if (isGuest) { navigate("/login"); return; }
    setAnalyseLoading(true);
    setAnalyseResult(null);
    try {
      if (analyseMode === "image") {
        const url = await generateImage(analysePrompt, imgModel);
        setAnalyseResult({ type: "image", url, prompt: analysePrompt });
      } else {
        const url = await generateVideo(analysePrompt);
        setAnalyseResult({ type: "video", url: url || "", prompt: analysePrompt });
      }
    } catch { /* noop */ }
    setAnalyseLoading(false);
  };

  const filteredChats = searchQ.trim() ? chats.filter(c => c.title.toLowerCase().includes(searchQ.toLowerCase())) : chats;
  const grouped = React.useMemo(() => {
    const g: Record<string, Chat[]> = {};
    filteredChats.forEach(c => { const l = formatDate(c.updatedAt); if (!g[l]) g[l] = []; g[l].push(c); });
    return g;
  }, [filteredChats]);

  const ringState: RingState = isLoading ? "thinking" : "idle";

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f8f9fc] overflow-hidden relative">

      {/* Onboarding modal */}
      {showOnboarding && (
        <OnboardingModal onDone={() => setShowOnboarding(false)} />
      )}

      {/* History drawer */}
      {historyOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setHistoryOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-800">Conversations</span>
              <div className="flex items-center gap-1">
                <button onClick={newChat} style={{ touchAction: "manipulation" }} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px]"><Plus size={15} /></button>
                <button onClick={() => setHistoryOpen(false)} style={{ touchAction: "manipulation" }} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px]"><X size={15} /></button>
              </div>
            </div>
            <div className="px-3 py-2.5 border-b border-slate-100">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search…" className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-primary/40 transition-colors" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
              {Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 gap-2">
                  <MessageSquare size={16} className="text-slate-300" />
                  <p className="text-xs text-slate-400">{searchQ ? "No results" : "No conversations yet"}</p>
                </div>
              ) : Object.entries(grouped).map(([label, group]) => (
                <div key={label} className="mb-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 py-1">{label}</p>
                  {group.map(chat => (
                    <button key={chat.id} onClick={() => { setActiveChatId(chat.id); setHistoryOpen(false); }}
                      style={{ touchAction: "manipulation" }}
                      className={cn("w-full flex items-center gap-2 px-3 py-2.5 mx-1 rounded-xl text-left transition-all group", activeChatId === chat.id ? "bg-primary/8 text-primary" : "text-slate-600 hover:bg-slate-50")}>
                      <MessageSquare size={12} className="flex-shrink-0 mt-0.5" />
                      <span className="flex-1 text-xs truncate">{chat.title}</span>
                      <button onClick={e => delChat(chat.id, e)} style={{ touchAction: "manipulation" }} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-500 transition-all flex-shrink-0"><Trash2 size={10} /></button>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">

        {/* ════ HOME TAB ════ */}
        {tab === "home" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center px-4 pt-12 pb-3 bg-[#f8f9fc] flex-shrink-0">
              <button onClick={() => setHistoryOpen(true)} style={{ touchAction: "manipulation" }} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200 transition-colors">
                <ChevronRight size={18} />
              </button>
              <div className="flex-1 flex justify-center">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <SynthVisualizer isActive barCount={5} className="h-3" />
                    <span className="text-xs text-slate-500 font-medium">Thinking…</span>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-400 truncate max-w-[200px]">
                    {activeChat?.title && activeChat.title !== "New conversation" ? truncate(activeChat.title, 40) : ""}
                  </span>
                )}
              </div>
              <button onClick={newChat} style={{ touchAction: "manipulation" }} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200 transition-colors">
                <Plus size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin pb-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center px-5 pt-6 pb-4">
                  <div className="mb-6">
                    <AIRing state={ringState} size={140} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Where should we start?</h2>
                  <p className="text-sm text-slate-400 text-center mb-8 max-w-xs leading-relaxed">Ask me anything — or pick a suggestion below.</p>
                  {isGuest && (
                    <div className="w-full max-w-sm mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                      <Lock size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-700 font-medium mb-1">Guest mode</p>
                        <p className="text-xs text-amber-600 leading-relaxed">
                          Chat is free. Image & video generation requires an account.{" "}
                          <button onClick={() => navigate("/login")} style={{ touchAction: "manipulation" }} className="underline font-semibold">Sign in free</button>
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="w-full space-y-2.5 max-w-sm">
                    {SUGGESTIONS.map(({ icon: Icon, text, color }) => (
                      <button key={text} onClick={() => { setInput(text); setTimeout(() => textareaRef.current?.focus(), 50); }}
                        style={{ touchAction: "manipulation" }}
                        className="suggestion-chip w-full">
                        <Icon size={16} className={color} />
                        <span className="text-sm text-slate-600">{text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-3 space-y-0.5">
                  {messages.map((m, i) => (
                    <MessageBubble
                      key={m.id}
                      msg={m}
                      canDownload={!isGuest}
                      onRetry={m.error && i === messages.length - 1 ? () => {
                        const lastUser = [...messages].reverse().find(x => x.role === "user");
                        if (lastUser) {
                          setChats(p => p.map(c => c.id === activeChatId ? { ...c, messages: c.messages.filter(x => x.id !== m.id) } : c));
                          setInput(lastUser.content);
                        }
                      } : undefined}
                    />
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-2.5 px-4 py-2 fade-slide-up">
                      <OrbAvatar size={28} />
                      <div className="rounded-2xl rounded-tl-sm bg-white border border-slate-100 shadow-sm"><TypingDots /></div>
                    </div>
                  )}
                  <div ref={bottomRef} className="h-4" />
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-4 pt-2 pb-2 bg-[#f8f9fc]" style={{ paddingBottom: "calc(var(--tab-height) + max(8px, env(safe-area-inset-bottom)) + 8px)" }}>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 max-w-[180px] shadow-sm">
                      {f.type.startsWith("image/") && f.dataUrl ? <img src={f.dataUrl} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0" /> : <FileText size={11} className="text-blue-500 flex-shrink-0" />}
                      <span className="text-xs truncate text-slate-600">{f.name}</span>
                      <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} style={{ touchAction: "manipulation" }} className="text-slate-400 hover:text-slate-600 flex-shrink-0 w-5 h-5 flex items-center justify-center"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2 bg-white rounded-2xl border border-slate-200 shadow-sm px-3 py-2 focus-within:border-primary/40 transition-colors">
                <button onClick={() => fileInputRef.current?.click()} style={{ touchAction: "manipulation" }} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0">
                  <Paperclip size={16} />
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.txt,.js,.ts,.tsx,.jsx,.py,.go,.rs,.java,.html,.css,.json,.md,.sh,.yaml,.sql,.zip,.csv" className="hidden" onChange={handleFileSelect} />
                <textarea ref={textareaRef} value={input} onChange={e => { setInput(e.target.value); adjustTA(); }} onKeyDown={handleKD} placeholder="Talk or type…" rows={1} disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 resize-none outline-none leading-relaxed scrollbar-none disabled:opacity-50" style={{ maxHeight: 160, minHeight: 24 }} />
                {isLoading ? (
                  <button onClick={stopGeneration}
                    style={{ touchAction: "manipulation", background: "#f43f5e" }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold text-white flex-shrink-0 min-h-[36px]">
                    <Square size={11} /> Stop
                  </button>
                ) : (
                  <button onClick={() => handleSend()} disabled={!input.trim() && files.length === 0}
                    style={{ touchAction: "manipulation" }}
                    className={cn("w-9 h-9 flex items-center justify-center rounded-2xl flex-shrink-0 transition-all shadow-sm", (input.trim() || files.length > 0) ? "wave-gradient text-white hover:opacity-90" : "bg-slate-100 text-slate-400 cursor-not-allowed")}>
                    <Send size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ ANALYSE TAB ════ */}
        {tab === "analyse" && (
          <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ paddingBottom: "calc(var(--tab-height) + env(safe-area-inset-bottom))" }}>
            <div className="px-5 pt-12 pb-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Create</h1>
              <p className="text-sm text-slate-400 mb-6">Generate images and videos with Wave AI</p>
              {isGuest ? (
                <GuestGate onSignIn={() => navigate("/login")} />
              ) : (
                <>
                  <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
                    {(["image", "video"] as const).map(mode => (
                      <button key={mode} onClick={() => setAnalyseMode(mode)} style={{ touchAction: "manipulation" }}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]", analyseMode === mode ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                        {mode === "image" ? <ImageIcon size={15} /> : <Film size={15} />}
                        {mode === "image" ? "Image" : "Video"}
                      </button>
                    ))}
                  </div>
                  {analyseMode === "image" && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wide">Style</p>
                      <div className="flex gap-2">
                        {IMG_MODELS.map(m => (
                          <button key={m.id} onClick={() => setImgModel(m.id)} style={{ touchAction: "manipulation" }}
                            className={cn("flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all min-h-[44px]", imgModel === m.id ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/30")}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wide">Voice (for TTS)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {VOICES.slice(0, 6).map(v => (
                        <button key={v.id} onClick={() => setVoice(v.id)} style={{ touchAction: "manipulation" }}
                          className={cn("py-2.5 px-3 rounded-xl text-xs border transition-all text-left min-h-[44px]", voice === v.id ? "bg-primary/8 text-primary border-primary/25" : "bg-white text-slate-600 border-slate-200 hover:border-primary/20")}>
                          {v.label.split("—")[0].trim()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wide">Prompt</p>
                    <textarea value={analysePrompt} onChange={e => setAnalysePrompt(e.target.value)}
                      placeholder={analyseMode === "image" ? "A mountain at golden hour, ultra realistic…" : "A cinematic drone shot over a coastal city at sunset…"}
                      rows={3} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/40 resize-none transition-colors shadow-sm" />
                  </div>
                  <button onClick={handleAnalyse} disabled={!analysePrompt.trim() || analyseLoading} style={{ touchAction: "manipulation" }}
                    className={cn("w-full py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 min-h-[52px]", analysePrompt.trim() && !analyseLoading ? "wave-gradient text-white hover:opacity-90" : "bg-slate-100 text-slate-400 cursor-not-allowed")}>
                    {analyseLoading ? <><RotateCcw size={14} className="animate-spin" /> Generating…</> : <><Wand2 size={14} /> Generate {analyseMode === "image" ? "Image" : "Video"}</>}
                  </button>
                  {analyseResult && (
                    <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white fade-slide-up">
                      {analyseResult.type === "image" ? (
                        <img src={analyseResult.url} alt={analyseResult.prompt} className="w-full object-cover" loading="lazy" />
                      ) : analyseResult.url ? (
                        <video controls className="w-full aspect-video bg-black" src={analyseResult.url} />
                      ) : (
                        <div className="aspect-video bg-slate-100 flex items-center justify-center p-6">
                          <p className="text-sm text-slate-500 text-center">Video generation in progress. Check back shortly.</p>
                        </div>
                      )}
                      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-500 flex-1 truncate">{analyseResult.prompt}</p>
                        <a href={analyseResult.url} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary ml-3 flex-shrink-0 hover:underline">
                          <Download size={11} /> Save
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ════ VOICE TAB ════ */}
        {tab === "voice" && (
          <div className="flex-1 flex flex-col items-center justify-center px-5 pb-24">
            <div className="text-center max-w-sm w-full">
              <div className="flex justify-center mb-8">
                <AIRing state="idle" size={160} />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Voice Assistant</h1>
              <p className="text-sm text-slate-400 mb-10 leading-relaxed">Have a real conversation with Wave AI. Speak your question and hear the answer.</p>
              <div className="space-y-3 mb-10">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Response Voice</p>
                <div className="grid grid-cols-2 gap-2">
                  {VOICES.map(v => (
                    <button key={v.id} onClick={() => setVoice(v.id)} style={{ touchAction: "manipulation" }}
                      className={cn("py-2.5 px-3 rounded-xl text-xs border transition-all text-left min-h-[44px]", voice === v.id ? "bg-primary/8 text-primary border-primary/25 font-medium" : "bg-white text-slate-600 border-slate-200 hover:border-primary/20")}>
                      {v.label.split("—")[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowCallModal(true)} style={{ touchAction: "manipulation" }} className="w-full py-4 rounded-2xl wave-gradient text-white font-semibold text-base shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 call-pulse min-h-[56px]">
                <Phone size={20} /> Start Voice Call
              </button>
              <p className="text-xs text-slate-400 mt-4">
                {typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition) ? "Browser speech API ready" : "Use Chrome or Edge for voice support"}
              </p>
            </div>
          </div>
        )}

        {/* ════ ACCOUNT TAB ════ */}
        {tab === "account" && (
          <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ paddingBottom: "calc(var(--tab-height) + env(safe-area-inset-bottom))" }}>
            <div className="px-5 pt-12 pb-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-6">Account</h1>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
                <div className="flex items-center gap-4">
                  <OrbAvatar size={56} />
                  <div className="flex-1 min-w-0">
                    {user ? (
                      <>
                        <p className="font-semibold text-slate-800 truncate">{user.username}</p>
                        <p className="text-sm text-slate-400 truncate">{user.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" /> Active
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-slate-800">Guest</p>
                        <p className="text-sm text-slate-400">Not signed in</p>
                      </>
                    )}
                  </div>
                </div>
                {!user && (
                  <button onClick={() => navigate("/login")} style={{ touchAction: "manipulation" }} className="w-full mt-4 py-3 rounded-xl wave-gradient text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm min-h-[48px]">
                    Sign In / Create Account
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5 overflow-hidden">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 pt-4 pb-2">Features</p>
                {[
                  { icon: MessageSquare, label: "Chat & Reasoning",  desc: "Multi-turn conversations with context memory",  color: "text-primary",    free: true },
                  { icon: Code2,         label: "Code Generation",   desc: "Write, debug & refactor any language",          color: "text-emerald-500", free: true },
                  { icon: ImageIcon,     label: "Image Generation",  desc: "Three rendering engines: flux, quick, art",     color: "text-violet-500", free: false },
                  { icon: Film,          label: "Video Synthesis",   desc: "Cinematic video from text prompts",             color: "text-pink-500",   free: false },
                  { icon: Volume2,       label: "Voice Synthesis",   desc: "Natural TTS in multiple voices",                color: "text-blue-500",   free: true },
                  { icon: Eye,           label: "Vision Analysis",   desc: "Analyze images, extract text, identify",       color: "text-amber-500",  free: true },
                  { icon: FileText,      label: "File Analysis",     desc: "Upload code, ZIP, documents",                  color: "text-cyan-500",   free: true },
                  { icon: Phone,         label: "Voice Calls",       desc: "Speak to Wave AI and hear responses",           color: "text-rose-500",   free: true },
                ].map(({ icon: Icon, label, desc, color, free }) => (
                  <div key={label} className="flex items-center gap-3 px-5 py-3.5 border-t border-slate-50 first:border-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    {free ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    ) : (
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center justify-center", user ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-400 border border-slate-200")}>
                        {user ? "✓" : <Lock size={8} />}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5 overflow-hidden">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 pt-4 pb-2">Links</p>
                {[
                  { icon: User,    label: "Edit Profile",         action: () => navigate("/profile") },
                  { icon: Key,     label: "API Documentation",    action: () => navigate("/api-docs") },
                  { icon: Info,    label: "About Wave AI",         action: () => navigate("/about") },
                  { icon: Shield,  label: "Privacy & Terms",       action: () => navigate("/terms") },
                  { icon: Globe,   label: "Wave Platforms, Inc.",  action: () => navigate("/about") },
                ].map(({ icon: Icon, label, action }) => (
                  <button key={label} onClick={action} style={{ touchAction: "manipulation" }} className="w-full flex items-center gap-3 px-5 py-3.5 border-t border-slate-50 first:border-0 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left min-h-[52px]">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-slate-500" />
                    </div>
                    <span className="text-sm text-slate-700 flex-1">{label}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5 overflow-hidden">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 pt-4 pb-2">Preferences</p>
                <div className="flex items-center gap-3 px-5 py-3.5 border-t border-slate-50">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0"><ImageIcon size={15} className="text-slate-500" /></div>
                  <div className="flex-1"><p className="text-sm text-slate-700">Image Style</p><p className="text-xs text-slate-400">Default rendering engine</p></div>
                  <select value={imgModel} onChange={e => setImgModel(e.target.value as ImageModel)} className="text-xs text-primary bg-primary/8 border border-primary/20 rounded-xl px-2.5 py-1.5 outline-none">
                    {IMG_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5 border-t border-slate-50">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0"><Volume2 size={15} className="text-slate-500" /></div>
                  <div className="flex-1"><p className="text-sm text-slate-700">Voice</p><p className="text-xs text-slate-400">TTS voice preference</p></div>
                  <select value={voice} onChange={e => setVoice(e.target.value)} className="text-xs text-primary bg-primary/8 border border-primary/20 rounded-xl px-2.5 py-1.5 outline-none max-w-[120px]">
                    {VOICES.map(v => <option key={v.id} value={v.id}>{v.label.split("—")[0].trim()}</option>)}
                  </select>
                </div>
              </div>

              {user ? (
                <button onClick={async () => { await signOut(); navigate("/"); }} style={{ touchAction: "manipulation" }} className="w-full py-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-sm font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-2 min-h-[52px]">
                  <LogOut size={15} /> Sign Out
                </button>
              ) : (
                <button onClick={() => navigate("/login")} style={{ touchAction: "manipulation" }} className="w-full py-3.5 rounded-2xl wave-gradient text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 min-h-[52px]">
                  Sign In / Create Account
                </button>
              )}

              <p className="text-center text-[11px] text-slate-300 mt-5">
                ®2026 Wave Platforms, Inc.™ · All rights reserved.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM TAB BAR */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{ height: "calc(var(--tab-height) + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#4f7fff55,#9b5cff55,#f472b655,transparent)" }} />
        <div className="h-full bg-white/92 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-2" style={{ height: "var(--tab-height)" }}>
          {([
            { id: "home",    icon: Home   },
            { id: "analyse", icon: Layers },
            { id: "voice",   icon: Mic    },
            { id: "account", icon: User   },
          ] as { id: TabId; icon: React.ElementType }[]).map(({ id, icon: Icon }) => {
            const handleTabClick = () => { if (id === "voice") requestMicPermission(); setTab(id); };
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={handleTabClick}
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200",
                  active ? "scale-105" : ""
                )}
              >
                {active && (
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg,#4f7fff,#9b5cff)" }} />
                )}
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200",
                  active ? "wave-gradient shadow-md" : "bg-transparent"
                )}>
                  <Icon size={20} className={active ? "text-white" : "text-slate-400"} strokeWidth={active ? 2.5 : 1.75} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice modal */}
      {showCallModal && (
        <VoiceModal
          onClose={() => setShowCallModal(false)}
          onSend={text => { setShowCallModal(false); setTab("home"); setTimeout(() => handleSend(text), 100); }}
        />
      )}
    </div>
  );
}

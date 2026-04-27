import { useNavigate } from "react-router-dom";
import { ChevronLeft, Sparkles, Code2, Globe, Mail, Shield, Building2 } from "lucide-react";
import SynthVisualizer from "@/components/features/SynthVisualizer";

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800">
      <div className="max-w-3xl mx-auto px-5 py-16">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-12 min-h-[40px]">
          <ChevronLeft size={15} /> Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
            <img
              src="/orb.png"
              alt="Wave AI"
              className="w-full h-full object-cover"
              onError={e => {
                const el = e.currentTarget.parentElement as HTMLElement;
                if (el) {
                  el.style.background = "linear-gradient(135deg,#4f7fff,#9b5cff,#f472b6)";
                  el.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:white;font-weight:700;font-size:16px">W</span></div>';
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Wave AI</h1>
            <p className="text-sm text-slate-400">Advanced Intelligence Platform</p>
          </div>
          <div className="ml-auto hidden sm:block">
            <SynthVisualizer isActive barCount={10} className="h-7" />
          </div>
        </div>

        <div className="space-y-10 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <Sparkles size={16} className="text-primary" /> What is Wave AI?
            </h2>
            <p className="mb-4">
              Wave AI is a unified AI platform that combines eight major AI capabilities into a single, clean interface. Instead of switching between separate tools for chat, code, images, video, voice, and vision — you do everything in one place by simply describing what you need.
            </p>
            <p>
              Wave AI intelligently detects the type of request you're making and delivers the best response automatically — completely transparently, without you having to configure anything.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <Code2 size={16} className="text-emerald-500" /> Capabilities
            </h2>
            <ul className="space-y-2.5">
              {[
                ["Chat & reasoning", "Natural conversation with deep context memory and emotional intelligence."],
                ["Code generation", "Write, debug, refactor, and explain code in any programming language."],
                ["Image generation", "Create photorealistic and artistic images from text descriptions."],
                ["Video generation", "Generate cinematic video clips from scene descriptions."],
                ["Voice synthesis", "Convert text to natural-sounding speech in multiple voices."],
                ["Vision analysis", "Analyze images, extract text, identify objects, answer visual questions."],
                ["File analysis", "Upload code files, ZIP archives, or documents for instant analysis."],
                ["Voice calls", "Have a full spoken conversation with Wave AI using your microphone."],
              ].map(([name, desc]) => (
                <li key={name} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span><strong className="text-slate-700 font-medium">{name}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <Globe size={16} className="text-blue-500" /> Technology
            </h2>
            <p className="mb-3">
              Wave AI is built on React, TypeScript, and Tailwind CSS. It is a Progressive Web App (PWA), installable on any device — desktop, phone, or tablet — across all modern browsers without going through an app store.
            </p>
            <p>
              Wave AI features intelligent request routing with automatic fallback mechanisms, ensuring high availability and consistently high-quality responses across all capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <Building2 size={16} className="text-violet-500" /> About Wave Platforms, Inc.
            </h2>
            <p className="mb-3">
              Wave AI is a brand product of <strong className="text-slate-700">Wave Platforms, Inc.</strong> — a technology company building intelligent software products focused on accessibility, performance, and user experience.
            </p>
            <p className="mb-3">
              The company is led by CEO <strong className="text-slate-700">Meddy Mususwa</strong>, who founded Wave Platforms with the vision of bringing world-class AI technology to East Africa and beyond.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Follow Wave Platforms</p>
              {[
                { label: "YouTube", href: "https://www.youtube.com/@Wave-platfoms", color: "text-red-500" },
                { label: "WhatsApp Channel", href: "https://whatsapp.com/channel/0029VbDD5xgBlHpjUBmayj30", color: "text-emerald-500" },
                { label: "TikTok", href: "https://www.tiktok.com/@itsmeddy", color: "text-slate-700" },
              ].map(({ label, href, color }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm font-medium hover:underline ${color}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />{label}
                </a>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              ® 2026 Wave Platforms, Inc.™ · Wave AI is a brand product of Wave Platforms. All rights reserved.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <Shield size={16} className="text-emerald-500" /> Privacy & Terms
            </h2>
            <p className="mb-3">
              Wave AI does not store your conversations on external servers unless you choose to sync them. Your data remains private. Chat history is stored locally on your device.
            </p>
            <p>
              By using Wave AI, you agree to use it responsibly and in accordance with applicable laws. Read our full{" "}
              <a href="/terms" className="text-primary underline hover:opacity-80">Terms of Service, Privacy Policy, and all legal documentation →</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <Mail size={16} className="text-rose-500" /> Contact
            </h2>
            <p>
              For business inquiries, partnerships, or support, reach out to Wave Platforms, Inc. via the contact information provided on the official Wave Platforms website.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
          <button onClick={() => navigate("/api-docs")} className="text-sm text-primary hover:underline">
            View API Docs →
          </button>
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl wave-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-sm"
          >
            Open Wave AI
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-300 mt-8">
          ®2026 Wave Platforms, Inc.™ · All rights reserved.
        </p>
      </div>
    </div>
  );
}

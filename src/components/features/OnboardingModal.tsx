import React, { useState, useEffect } from "react";
import { MessageSquare, Layers, Mic, User, ArrowRight, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ONBOARD_KEY = "wave_onboarded_v1";

interface Step {
  id: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  gradient: string;
  title: string;
  subtitle: string;
  bullets: string[];
}

const STEPS: Step[] = [
  {
    id: "chat",
    icon: MessageSquare,
    color: "text-[#4f7fff]",
    bg: "bg-[#4f7fff]/10",
    gradient: "from-[#4f7fff]/20 to-transparent",
    title: "Chat",
    subtitle: "Talk to Wave AI about anything",
    bullets: [
      "Ask questions, get instant answers",
      "Write and debug code together",
      "Analyze your uploaded files",
    ],
  },
  {
    id: "create",
    icon: Layers,
    color: "text-[#9b5cff]",
    bg: "bg-[#9b5cff]/10",
    gradient: "from-[#9b5cff]/20 to-transparent",
    title: "Create",
    subtitle: "Generate images and videos",
    bullets: [
      "Three image rendering engines",
      "AI-powered video generation",
      "Text-to-speech in multiple voices",
    ],
  },
  {
    id: "voice",
    icon: Mic,
    color: "text-[#f472b6]",
    bg: "bg-[#f472b6]/10",
    gradient: "from-[#f472b6]/20 to-transparent",
    title: "Voice",
    subtitle: "Have a real conversation",
    bullets: [
      "Speak naturally, get spoken answers",
      "Hands-free AI interaction",
      "Multiple voice personalities",
    ],
  },
  {
    id: "account",
    icon: User,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    gradient: "from-emerald-500/20 to-transparent",
    title: "Account",
    subtitle: "Your profile and preferences",
    bullets: [
      "Manage your profile and settings",
      "Choose your default voice and style",
      "Access API docs and integrations",
    ],
  },
];

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARD_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARD_KEY, "1");
  } catch {}
}

interface OnboardingModalProps {
  onDone: () => void;
}

export default function OnboardingModal({ onDone }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    markOnboardingSeen();
    setExiting(true);
    setTimeout(onDone, 350);
  };

  const goTo = (next: number) => {
    if (animating) return;
    setSlideDir(next > step ? "left" : "right");
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 220);
  };

  const Icon = current.icon;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: visible && !exiting ? 1 : 0,
        transition: "opacity 0.35s ease",
        pointerEvents: visible && !exiting ? "auto" : "none",
      }}
    >
      <div
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{
          transform: visible && !exiting ? "translateY(0)" : "translateY(32px)",
          transition: "transform 0.35s cubic-bezier(0.34,1.2,0.64,1)",
          maxHeight: "92dvh",
        }}
      >
        {/* Top gradient accent */}
        <div
          className={cn("h-1.5 w-full bg-gradient-to-r", current.gradient.replace("from-", "from-").replace("to-transparent", "to-[#f472b6]/0"))}
          style={{
            background: "linear-gradient(90deg, #4f7fff, #9b5cff, #f472b6)",
          }}
        />

        <div className="px-6 pt-5 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <img src="/orb.png" alt="Wave AI" className="w-7 h-7 rounded-full" style={{ boxShadow: "0 0 8px rgba(79,127,255,0.4)" }} />
              <span className="text-sm font-bold text-slate-800">Wave AI</span>
            </div>
            <button
              onClick={dismiss}
              style={{ touchAction: "manipulation" }}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Welcome headline — only show on step 0 */}
          {step === 0 && (
            <div className="mb-5 text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome to Wave AI</h2>
              <p className="text-xs text-slate-400 leading-relaxed">Here's a quick tour of what you can do.</p>
            </div>
          )}

          {/* Step card */}
          <div
            className="rounded-2xl border border-slate-100 bg-slate-50 p-5 mb-5 overflow-hidden"
            style={{
              opacity: animating ? 0 : 1,
              transform: animating
                ? `translateX(${slideDir === "left" ? "-24px" : "24px"})`
                : "translateX(0)",
              transition: "opacity 0.2s ease, transform 0.22s ease",
            }}
          >
            {/* Icon + title */}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0", current.bg)}>
                <Icon size={22} className={current.color} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-base leading-tight">{current.title}</p>
                <p className="text-xs text-slate-500 leading-snug mt-0.5">{current.subtitle}</p>
              </div>
            </div>

            {/* Feature bullets */}
            <div className="space-y-2.5">
              {current.bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg,#4f7fff,#9b5cff)" }}
                  >
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </div>
                  <p className="text-sm text-slate-600 leading-snug">{b}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  style={{ touchAction: "manipulation" }}
                  className={cn(
                    "transition-all duration-300 flex items-center justify-center rounded-full",
                    i === step
                      ? "w-7 h-7 shadow-sm"
                      : i < step
                      ? "w-6 h-6"
                      : "w-5 h-5 bg-slate-200"
                  )}
                  style={
                    i === step
                      ? { background: "linear-gradient(135deg,#4f7fff,#9b5cff)" }
                      : i < step
                      ? { background: "linear-gradient(135deg,#4f7fff60,#9b5cff60)" }
                      : {}
                  }
                >
                  <StepIcon
                    size={i === step ? 13 : 10}
                    className={i <= step ? "text-white" : "text-slate-400"}
                  />
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            {step > 0 && (
              <button
                onClick={() => goTo(step - 1)}
                style={{ touchAction: "manipulation" }}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors min-h-[48px]"
              >
                Back
              </button>
            )}
            <button
              onClick={isLast ? dismiss : () => goTo(step + 1)}
              style={{
                touchAction: "manipulation",
                background: "linear-gradient(135deg, #4f7fff, #9b5cff, #f472b6)",
              }}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              {isLast ? (
                <>Let's Go!</>
              ) : (
                <>Next <ArrowRight size={14} /></>
              )}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={dismiss}
              style={{ touchAction: "manipulation" }}
              className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors min-h-[36px]"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

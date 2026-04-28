
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PHRASES = [
  "Talk with me",
  "Solve problems with me",
  "Ask for advice",
  "Generate images with me",
  "Write code together",
  "Understand anything",
  "Create videos instantly",
  "Learn something new",
  "Think through ideas",
  "Analyse your files",
  "Build your dreams",
  "Speak — I'll listen",
];

function CyclingText() {
  const [displayText, setDisplayText] = useState(PHRASES[0]);
  const [phase, setPhase] = useState<"show" | "erase" | "type">("show");
  const stateRef = useRef({ idx: 0, char: PHRASES[0].length, timer: 0 as ReturnType<typeof setTimeout> });

  useEffect(() => {
    const s = stateRef.current;
    const schedule = (fn: () => void, ms: number) => { clearTimeout(s.timer); s.timer = setTimeout(fn, ms); };

    const startErase = () => {
      setPhase("erase");
      const erase = () => {
        s.char = Math.max(0, s.char - 1);
        setDisplayText(PHRASES[s.idx].slice(0, s.char));
        if (s.char > 0) schedule(erase, 30);
        else { s.idx = (s.idx + 1) % PHRASES.length; s.char = 0; startType(); }
      };
      schedule(erase, 30);
    };

    const startType = () => {
      setPhase("type");
      const target = PHRASES[s.idx];
      const type = () => {
        s.char = Math.min(s.char + 1, target.length);
        setDisplayText(target.slice(0, s.char));
        if (s.char < target.length) schedule(type, 40);
        else { setPhase("show"); schedule(startErase, 2500); }
      };
      schedule(type, 40);
    };

    schedule(startErase, 2500);
    return () => clearTimeout(s.timer);
  }, []);

  return (
    <span className="inline-flex items-center" style={{ minHeight: "1.5em" }}>
      {displayText}
      <span
        style={{
          display: "inline-block",
          width: 2,
          height: "1em",
          borderRadius: 9999,
          marginLeft: 2,
          background: "linear-gradient(to bottom, #4f7fff, #f472b6)",
          opacity: phase === "show" ? 0 : 1,
          verticalAlign: "middle",
          // uses caretBlink from index.css
          animation: phase === "show" ? "none" : "caretBlink 0.8s step-end infinite",
          willChange: "opacity",
        }}
      />
    </span>
  );
}

function LiveOrb({ size }: { size: number }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer ambient glow — uses orbGlow from index.css */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(79,127,255,0.22) 0%, rgba(155,92,255,0.12) 40%, transparent 70%)",
          animation: "orbGlow 3s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />
      {/* Pulse ring 1 */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -size * 0.04,
          border: "1.5px solid rgba(155,92,255,0.18)",
          borderRadius: "50%",
          animation: "orbPulse1 2.8s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />
      {/* Pulse ring 2 */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -size * 0.1,
          border: "1px solid rgba(79,127,255,0.1)",
          borderRadius: "50%",
          animation: "orbPulse2 4s ease-in-out infinite 0.5s",
          willChange: "transform, opacity",
        }}
      />
      {/* Orb image */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: size * 0.88,
          height: size * 0.88,
          animation: "orbFloat 6s ease-in-out infinite",
          willChange: "transform",
          boxShadow: `0 0 ${size * 0.18}px rgba(79,127,255,0.35), 0 0 ${size * 0.08}px rgba(155,92,255,0.25), 0 ${size * 0.06}px ${size * 0.14}px rgba(0,0,0,0.5)`,
        }}
      >
        <img
          src="/orb.png"
          alt="Wave AI"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "50%" }}
          draggable={false}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "radial-gradient(ellipse 60% 40% at 35% 30%, rgba(79,127,255,0.22) 0%, transparent 65%)",
            animation: "orbSheen 4s ease-in-out infinite",
            willChange: "opacity",
          }}
        />
      </div>
      {/* Orbit spark 1 */}
      <div
        className="absolute"
        style={{
          width: size * 0.055, height: size * 0.055,
          borderRadius: "50%",
          background: "radial-gradient(circle, #4f7fff 0%, transparent 70%)",
          boxShadow: `0 0 ${size * 0.04}px #4f7fff`,
          top: "50%", left: "50%",
          transformOrigin: `${-size * 0.44}px 0`,
          animation: "orbitSpark1 3.2s linear infinite",
          willChange: "transform",
        }}
      />
      {/* Orbit spark 2 */}
      <div
        className="absolute"
        style={{
          width: size * 0.04, height: size * 0.04,
          borderRadius: "50%",
          background: "radial-gradient(circle, #f472b6 0%, transparent 70%)",
          boxShadow: `0 0 ${size * 0.03}px #f472b6`,
          top: "50%", left: "50%",
          transformOrigin: `${-size * 0.5}px 0`,
          animation: "orbitSpark2 5s linear infinite reverse",
          willChange: "transform",
        }}
      />
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orbSize, setOrbSize] = useState(260);

  // All hooks MUST be called before any conditional returns
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setOrbSize(w < 400 ? 200 : w < 640 ? 240 : w < 1024 ? 280 : 320);
    };
    calc();
    window.addEventListener("resize", calc, { passive: true });
    return () => window.removeEventListener("resize", calc);
  }, []);

  const handleStart = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  const handleGuest = useCallback(() => {
    navigate("/app");
  }, [navigate]);

  // Synchronous redirect if signed in — no blank flash
  if (user) return <Navigate to="/app" replace />;

  return (
    <div
      className="min-h-[100dvh] bg-[#060c1a] text-white flex flex-col items-center justify-center relative overflow-hidden select-none"
      style={{ contain: "layout style" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(79,127,255,0.06) 0%, rgba(155,92,255,0.03) 45%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center px-5 text-center w-full max-w-xl mx-auto">
        <LiveOrb size={orbSize} />

        <h1
          className="font-bold mt-5 mb-2 tracking-tight"
          style={{
            fontSize: "clamp(2rem, 8vw, 3.2rem)",
            background: "linear-gradient(135deg, #4f7fff 0%, #9b5cff 50%, #f472b6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.12,
          }}
        >
          Wave AI
        </h1>

        <p
          className="font-medium mb-8 leading-snug"
          style={{
            fontSize: "clamp(0.78rem, 3vw, 0.95rem)",
            color: "rgba(255,255,255,0.38)",
            letterSpacing: "0.02em",
            maxWidth: "30ch",
          }}
        >
          The New Era Begins.
        </p>

        <div
          className="mb-10 font-semibold"
          style={{
            fontSize: "clamp(1.05rem, 4vw, 1.45rem)",
            color: "rgba(255,255,255,0.88)",
            minHeight: "2.2rem",
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
          }}
        >
          <CyclingText />
        </div>

        <button
          onClick={handleStart}
          style={{
            background: "linear-gradient(135deg, #4f7fff 0%, #9b5cff 55%, #f472b6 100%)",
            padding: "14px 40px",
            fontSize: "clamp(0.95rem, 3vw, 1.05rem)",
            borderRadius: 16,
            fontWeight: 700,
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 0 1px rgba(155,92,255,0.25), 0 4px 24px rgba(79,127,255,0.28), 0 8px 48px rgba(155,92,255,0.16)",
            minWidth: 220,
            minHeight: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "opacity 0.1s, transform 0.1s",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
          onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          <span
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#fff", opacity: 0.9, flexShrink: 0,
              animation: "ctaPulse 1.6s ease-in-out infinite",
              willChange: "transform, opacity",
            }}
          />
          Chat With Me Now
        </button>

        <button
          onClick={handleGuest}
          style={{
            marginTop: 14,
            background: "transparent",
            padding: "10px 22px",
            fontSize: "clamp(0.78rem, 2.5vw, 0.85rem)",
            borderRadius: 12,
            fontWeight: 500,
            color: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.12)",
            cursor: "pointer",
            minHeight: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "color 0.15s, border-color 0.15s, background 0.15s",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = "rgba(255,255,255,0.85)";
            el.style.borderColor = "rgba(255,255,255,0.25)";
            el.style.background = "rgba(255,255,255,0.04)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = "rgba(255,255,255,0.55)";
            el.style.borderColor = "rgba(255,255,255,0.12)";
            el.style.background = "transparent";
          }}
        >
          Continue as guest
        </button>
      </div>

      {/* Bottom synth bars — pure CSS, all animations from index.css */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 pointer-events-none overflow-hidden"
        aria-hidden="true"
        style={{ height: 52, paddingBottom: 4 }}
      >
        {Array.from({ length: 36 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 2,
              borderRadius: 9999,
              background: "linear-gradient(to top, #4f7fff, #9b5cff, #f472b6)",
              opacity: 0.15 + (i % 4) * 0.05,
              height: 4 + (i % 7) * 5,
              animation: `bottomBar ${0.7 + (i % 5) * 0.2}s ease-in-out infinite alternate`,
              animationDelay: `${(i * 0.07) % 1.3}s`,
              willChange: "transform",
            }}
          />
        ))}
      </div>
    </div>
  );
}

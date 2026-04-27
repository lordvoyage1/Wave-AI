import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * PageLoader
 * - Shows a thin animated top progress bar AND a centered orb overlay
 *   during route transitions so navigation never feels blank.
 * - The overlay is dismissible by pointer events (pointer-events:none)
 *   so it never blocks user interaction, even if it lingers.
 */
export function PageLoader({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [fade, setFade] = useState(false);
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    const cur = location.pathname;
    const prev = prevRef.current;
    const isNav = prev !== null && prev !== cur;
    prevRef.current = cur;

    if (!isNav) return;

    setShow(true);
    setFade(false);
    const t1 = setTimeout(() => setFade(true), 450);
    const t2 = setTimeout(() => setShow(false), 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [location.pathname]);

  return (
    <>
      {children}
      {show && (
        <>
          {/* Top progress bar */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              zIndex: 9999,
              pointerEvents: "none",
              opacity: fade ? 0 : 1,
              transition: "opacity 0.25s ease",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #4f7fff, #9b5cff, #f472b6)",
                animation: "pageBarFill 0.65s ease-out forwards",
                borderRadius: "0 3px 3px 0",
              }}
            />
          </div>

          {/* Centered orb overlay - never blocks taps */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(248,249,252,0.55)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              opacity: fade ? 0 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: -8,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(155,92,255,0.3)",
                    animation: "orbPulse1 1.6s ease-in-out infinite",
                  }}
                />
                <img
                  src="/orb.png"
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    objectFit: "cover",
                    boxShadow: "0 0 22px rgba(79,127,255,0.4), 0 6px 18px rgba(0,0,0,0.12)",
                    animation: "orbFloat 2.2s ease-in-out infinite",
                  }}
                  draggable={false}
                />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="typing-dot"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#4f7fff,#9b5cff)",
                      animationDelay: `${i * 0.18}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default PageLoader;

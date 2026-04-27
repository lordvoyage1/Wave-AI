import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Show a thin top progress bar during navigation — NEVER blocks taps
export function PageLoader({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [fade, setFade] = useState(false);
  const prevRef = React.useRef<string | null>(null);

  useEffect(() => {
    const cur = location.pathname;
    const prev = prevRef.current;
    const isNav = prev !== null && prev !== cur;
    prevRef.current = cur;

    if (!isNav) return;

    setShow(true);
    setFade(false);
    const t1 = setTimeout(() => setFade(true), 500);
    const t2 = setTimeout(() => setShow(false), 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [location.pathname]);

  return (
    <>
      {children}
      {show && (
        // CRITICAL: pointerEvents ALWAYS none — never block taps
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 9999,
            pointerEvents: "none", // ← never intercepts taps
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
      )}
    </>
  );
}

export default PageLoader;

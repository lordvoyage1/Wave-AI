import React, { Suspense, lazy, useEffect, useState, Component } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "@/pages/Landing";
import LoginPage from "@/pages/Login";
import SignupPage from "@/pages/Signup";
import Home from "@/pages/Home";
import { PageLoader } from "@/components/features/PageLoader";

/* Secondary routes stay lazy — they're rarely visited. Home is bundled
   eagerly so /app renders instantly with no Suspense spinner ever. */
const About    = lazy(() => import("@/pages/About"));
const ApiDocs  = lazy(() => import("@/pages/ApiDocs"));
const Profile  = lazy(() => import("@/pages/Profile"));
const Terms    = lazy(() => import("@/pages/Terms"));
const NotFound = lazy(() => import("@/pages/NotFound"));

/* ── Lightweight page spinner for lazy-loaded secondary routes ──────────
   Includes a "stuck" recovery: if the chunk is still loading after 6s
   (slow network, stale cache, etc.) we show a refresh button so the user
   never sees an infinite spinner with no escape. */
function PageSpinner() {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStuck(true), 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: "#f8f9fc", padding: 24, textAlign: "center",
    }}>
      <img src="/orb.png" alt="Wave AI" style={{ width: 52, height: 52, borderRadius: "50%", animation: "orbFloat 3s ease-in-out infinite", boxShadow: "0 0 20px rgba(79,127,255,0.3)" }} />
      <div style={{ display: "flex", gap: 6 }}>
        {[0,1,2].map(i => (
          <span key={i} className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg,#4f7fff,#9b5cff)", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      {stuck && (
        <>
          <p style={{ fontSize: 12, color: "#94a3b8", maxWidth: 260, lineHeight: 1.5, marginTop: 4 }}>
            Taking longer than usual. Your network may be slow.
          </p>
          <button
            onClick={() => {
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations()
                  .then(rs => Promise.all(rs.map(r => r.unregister())))
                  .catch(() => {})
                  .finally(() => window.location.reload());
              } else {
                window.location.reload();
              }
            }}
            style={{
              background: "linear-gradient(135deg,#4f7fff,#9b5cff)",
              color: "#fff", border: "none", borderRadius: 10, padding: "8px 20px",
              fontSize: 12, fontWeight: 600, cursor: "pointer", minHeight: 38,
            }}
          >
            Reload
          </button>
        </>
      )}
    </div>
  );
}

/* ── Scroll to top on route change ───────────────────────────────────── */
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────
   GUARD DESIGN PRINCIPLES (performance-first):
   
   1. NEVER hide or delay content rendering. Mount immediately.
   2. Auth state is read synchronously from localStorage — no spinner needed.
   3. Redirects happen in the same render pass, not after effects.
   4. Loading state (loading=false always now) is kept for API compatibility.
──────────────────────────────────────────────────────────────────────── */

/* ── Error Boundary — catches render crashes so the spinner never hangs ── */
interface EBState { hasError: boolean; error?: Error }
class ErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(error: Error): EBState { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100dvh", background: "#f8f9fc", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 16, padding: 24, textAlign: "center",
        }}>
          <img src="/orb.png" alt="Wave AI" style={{ width: 52, height: 52, borderRadius: "50%", opacity: 0.5 }} />
          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 280, lineHeight: 1.5 }}>
            Something went wrong loading the app. Please refresh the page.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{
              background: "linear-gradient(135deg,#4f7fff,#9b5cff)",
              color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px",
              fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 44,
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * /app — renders Home (lazy). Home handles guest vs signed-in internally.
 */
function AppRoute({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

/**
 * /login and /signup — redirect to /app if already signed in.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

/**
 * /profile — must be signed in.
 */
function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

/* ── Routes ────────────────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <PageLoader>
      <ScrollTop />
      <Routes>
          <Route path="/"        element={<Landing />} />
          <Route path="/app"     element={<AppRoute><Home /></AppRoute>} />
          <Route path="/login"   element={<AuthGuard><LoginPage /></AuthGuard>} />
          <Route path="/signup"  element={<AuthGuard><SignupPage /></AuthGuard>} />
          {/* Legacy /auth → /login redirect */}
          <Route path="/auth"    element={<Navigate to="/login" replace />} />
          <Route path="/profile" element={<ProfileGuard><Suspense fallback={<PageSpinner />}><Profile /></Suspense></ProfileGuard>} />
          <Route path="/about"   element={<Suspense fallback={<PageSpinner />}><About /></Suspense>} />
          <Route path="/terms"   element={<Suspense fallback={<PageSpinner />}><Terms /></Suspense>} />
          <Route path="/api-docs" element={<Suspense fallback={<PageSpinner />}><ApiDocs /></Suspense>} />
          <Route path="*"        element={<Suspense fallback={<PageSpinner />}><NotFound /></Suspense>} />
        </Routes>
    </PageLoader>
  );
}

/* ── Root ──────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e8eaf0",
              color: "#1e2a3b",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

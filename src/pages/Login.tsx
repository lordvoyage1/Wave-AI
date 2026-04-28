import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, LogIn, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

function AuthOrb() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(79,127,255,0.22) 0%, rgba(155,92,255,0.1) 50%, transparent 70%)",
          animation: "orbGlow 3s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -2,
          border: "1.5px solid rgba(155,92,255,0.2)",
          borderRadius: "50%",
          animation: "orbPulse1 2.8s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />
      <div
        className="rounded-full overflow-hidden"
        style={{
          width: 56, height: 56,
          animation: "orbFloat 5s ease-in-out infinite",
          willChange: "transform",
          boxShadow: "0 0 16px rgba(79,127,255,0.38), 0 4px 14px rgba(0,0,0,0.22)",
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Pre-fill email — first from navigation state, otherwise from the
  // last-used email (so returning users don't have to retype).
  useEffect(() => {
    const state = (window.history.state?.usr as { email?: string }) || {};
    if (state.email) {
      setEmail(state.email);
      return;
    }
    try {
      const saved = localStorage.getItem("wave_last_email");
      if (saved) setEmail(saved);
    } catch { /* ignore */ }
  }, []);

  // Synchronous redirect if signed in — no blank flash
  if (user) return <Navigate to="/app" replace />;

  const canSubmit = !submitting && email.trim().length > 0 && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error: err } = await signIn(email.trim(), password);
      if (!mountedRef.current) return;

      if (err) {
        setError(err);
        return;
      }
      // Success — navigate to app
      navigate("/app", { replace: true });
    } finally {
      // Always reset submitting — prevents stuck state
      if (mountedRef.current) setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fc] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[380px]">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-8 min-h-[44px]"
          style={{ touchAction: "manipulation" }}
        >
          <ChevronLeft size={15} /> Back
        </button>

        {/* Orb + heading */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AuthOrb />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-400">Sign in to your Wave AI account</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={submitting}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/40 focus:bg-white transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-500">Password</label>
              </div>
              <div className="relative">
                <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  disabled={submitting}
                  className="w-full pl-9 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/40 focus:bg-white transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ touchAction: "manipulation" }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center"
                >
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 leading-relaxed">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all mt-1 min-h-[50px] shadow-sm",
                canSubmit
                  ? "wave-gradient text-white hover:opacity-90 active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {submitting ? (
                <span className="flex gap-1.5 items-center">
                  <span className="text-white/80 text-xs mr-1">Signing in</span>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 typing-dot" />
                  ))}
                </span>
              ) : (
                <><LogIn size={14} /> Sign in</>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-5 pt-4 border-t border-slate-50 space-y-2">
            <p className="text-center text-xs text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-primary font-semibold hover:underline"
                style={{ touchAction: "manipulation" }}
              >
                Create one free
              </Link>
            </p>
            <button
              onClick={() => navigate("/app")}
              style={{ touchAction: "manipulation" }}
              className="w-full py-2.5 rounded-xl text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors min-h-[40px]"
            >
              Continue as guest (limited features)
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-300 mt-5">
          ®2026 Wave Platforms, Inc.™ · By continuing you agree to our{" "}
          <Link to="/terms" className="underline hover:text-slate-500 transition-colors">
            terms &amp; privacy
          </Link>.
        </p>
      </div>
    </div>
  );
}

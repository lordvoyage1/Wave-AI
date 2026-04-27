import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ChevronLeft, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

/* Orb — all keyframes live in index.css, no inline <style> */
function AuthOrb() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
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
          width: 62, height: 62,
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

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Redirect if already signed in
  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  // Hard reset submitting after 6s to prevent stuck buttons
  useEffect(() => {
    if (!submitting) return;
    const t = setTimeout(() => { if (mountedRef.current) setSubmitting(false); }, 6000);
    return () => clearTimeout(t);
  }, [submitting]);

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    setError(null);
    setPassword("");
    setConfirm("");
  };

  const strength =
    password.length === 0 ? 0 :
    password.length < 8 ? 1 :
    password.length < 12 ? 2 : 3;
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400"][strength];
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];

  const canSubmit =
    !submitting &&
    email.trim().length > 0 &&
    password.trim().length >= 6 &&
    (mode === "login" || password === confirm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (mode === "signup") {
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
      if (password !== confirm) { setError("Passwords do not match."); return; }
    }

    setSubmitting(true);
    setError(null);

    const { error: err } =
      mode === "login"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, username.trim() || undefined);

    if (!mountedRef.current) return;

    if (err) {
      // Friendly fallback: if account was created but auto-login failed, send to login tab
      if (err.includes("Account created")) {
        setError(null);
        switchMode("login");
        setEmail(email.trim());
        setSubmitting(false);
        return;
      }
      setError(err);
      setSubmitting(false);
      return;
    }

    // Success — navigate immediately. Auth state has already updated synchronously
    // via onAuthStateChange which fires before this await returns.
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fc] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[380px]">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-8 min-h-[44px]"
          style={{ touchAction: "manipulation" }}
        >
          <ChevronLeft size={15} /> Back
        </button>

        {/* Orb + title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AuthOrb />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Wave AI</h1>
          <p className="text-sm text-slate-400">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          {/* Mode tabs */}
          <div className="flex bg-slate-50 rounded-xl p-1 mb-6">
            {(["login", "signup"] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                type="button"
                style={{ touchAction: "manipulation" }}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[36px]",
                  mode === m
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Username (signup only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Username <span className="text-slate-300">(optional)</span>
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="your_username"
                    autoComplete="username"
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/40 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/40 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full pl-9 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/40 focus:bg-white transition-colors"
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
              {mode === "signup" && password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={cn(
                          "h-0.5 flex-1 rounded-full transition-colors",
                          strength >= i ? strengthColor : "bg-slate-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400">{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    autoComplete="new-password"
                    className={cn(
                      "w-full pl-9 pr-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors",
                      confirm.length > 0 && confirm !== password
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 focus:border-primary/40 focus:bg-white"
                    )}
                  />
                </div>
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-[11px] text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>
            )}

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
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all mt-1 min-h-[48px] shadow-sm",
                canSubmit
                  ? "wave-gradient text-white hover:opacity-90 active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {submitting ? (
                <span className="flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white/70 typing-dot"
                    />
                  ))}
                </span>
              ) : (
                <>
                  {mode === "login" ? <LogIn size={14} /> : <ArrowRight size={14} />}
                  {mode === "login" ? "Sign in" : "Create account"}
                </>
              )}
            </button>
          </form>

          {/* Guest */}
          <div className="mt-4 pt-4 border-t border-slate-50">
            <button
              onClick={() => navigate("/app")}
              style={{ touchAction: "manipulation" }}
              className="w-full py-2.5 rounded-xl text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              Continue as guest (limited features)
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-300 mt-5">
          ®2026 Wave Platforms, Inc.™ · By continuing you agree to our terms.
        </p>
      </div>
    </div>
  );
}

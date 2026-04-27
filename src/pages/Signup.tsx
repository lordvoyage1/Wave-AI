import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ChevronLeft, AlertCircle, LogIn } from "lucide-react";
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

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [success, setSuccess] = useState(false);
  const mountedRef = useRef(true);

  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Synchronous redirect if signed in — no blank flash
  if (user && !success) return <Navigate to="/app" replace />;

  const strength =
    password.length === 0 ? 0 :
    password.length < 8 ? 1 :
    password.length < 12 ? 2 : 3;
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400"][strength];
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];

  const passwordsMatch = confirm.length === 0 || password === confirm;
  const canSubmit =
    !submitting &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setSubmitting(true);
    setError(null);
    setEmailTaken(false);

    try {
      const { error: err } = await signUp(email.trim(), password, username.trim() || undefined);
      if (!mountedRef.current) return;

      if (err) {
        // Email already registered — show inline card instead of redirect
        if (err.toLowerCase().includes("already")) {
          setEmailTaken(true);
          return;
        }
        // Account created but auto-login needs user to sign in manually
        if (err === "ACCOUNT_CREATED") {
          setSuccess(true);
          setTimeout(() => navigate("/login", { replace: true }), 2000);
          return;
        }
        setError(err);
        return;
      }

      // Success — onAuthStateChange fires → AuthGuard redirects to /app
      // navigate here too as a safety net
      navigate("/app", { replace: true });
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-[#f8f9fc] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[380px] text-center">
          <div className="flex justify-center mb-5"><AuthOrb /></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Account created!</h2>
          <p className="text-sm text-slate-500 mb-1">Taking you to sign in…</p>
          <div className="flex justify-center mt-4">
            <span className="flex gap-1.5">
              {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-primary typing-dot" />)}
            </span>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Create your account</h1>
          <p className="text-sm text-slate-400">Join Wave AI — it's free</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Username */}
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
                  autoFocus
                  disabled={submitting}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/40 focus:bg-white transition-colors disabled:opacity-60"
                />
              </div>
            </div>

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
                  disabled={submitting}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/40 focus:bg-white transition-colors disabled:opacity-60"
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
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
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
              {password.length > 0 && (
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
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(null); }}
                  placeholder="Re-enter password"
                  required
                  autoComplete="new-password"
                  disabled={submitting}
                  className={cn(
                    "w-full pl-9 pr-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors disabled:opacity-60",
                    !passwordsMatch
                      ? "border-red-300 bg-red-50 focus:border-red-400"
                      : "border-slate-200 focus:border-primary/40 focus:bg-white"
                  )}
                />
              </div>
              {!passwordsMatch && (
                <p className="text-[11px] text-red-500 mt-1">Passwords don't match</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 leading-relaxed">
                {error}
              </div>
            )}

            {/* Email-already-taken inline card */}
            {emailTaken && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">Email already registered</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      <strong>{email}</strong> is already linked to an account. Sign in, or use a different email.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/login", { state: { email } })}
                    style={{ touchAction: "manipulation" }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors min-h-[40px]"
                  >
                    <LogIn size={12} /> Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmailTaken(false); setEmail(""); setError(null); }}
                    style={{ touchAction: "manipulation" }}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-50 transition-colors min-h-[40px]"
                  >
                    Use different email
                  </button>
                </div>
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
                  <span className="text-white/80 text-xs mr-1">Creating account</span>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 typing-dot" />
                  ))}
                </span>
              ) : (
                <><ArrowRight size={14} /> Create account</>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-5 pt-4 border-t border-slate-50 space-y-2">
            <p className="text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
                style={{ touchAction: "manipulation" }}
              >
                Sign in
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

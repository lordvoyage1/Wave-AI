import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  ChevronLeft, User, Mail, Lock, Save, CheckCircle2,
  MessageSquare, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

/* Orb — all keyframes in index.css */
function SmallOrb({ size = 72 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
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
          width: size * 0.85, height: size * 0.85,
          animation: "orbFloat 5s ease-in-out infinite",
          willChange: "transform",
          boxShadow: `0 0 ${size * 0.18}px rgba(79,127,255,0.35), 0 ${size * 0.05}px ${size * 0.12}px rgba(0,0,0,0.2)`,
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

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-100">
        <Icon size={16} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"display" | "password">("display");
  const [stats, setStats] = useState({ chats: 0, messages: 0, joined: "2026" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("wave_chats_v1") || localStorage.getItem("alva_chats_v4");
      if (raw) {
        const parsed = JSON.parse(raw);
        const totalMessages = parsed.reduce(
          (acc: number, c: { messages?: unknown[] }) => acc + (c.messages?.length || 0), 0
        );
        setStats({ chats: parsed.length, messages: totalMessages, joined: "2026" });
      }
    } catch { /* noop */ }
  }, [user]);

  const canSaveDisplay = username.trim().length > 0 && username !== user?.username;
  const canSavePassword =
    newPassword.length >= 6 && confirmPassword.length >= 6 && newPassword === confirmPassword;

  const handleSaveDisplay = async () => {
    if (!canSaveDisplay || saving) return;
    setSaving(true);
    setError(null);
    const { error: err } = await updateProfile({ username: username.trim() });
    setSaving(false);
    if (err) { setError(err); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSavePassword = async () => {
    if (!canSavePassword || saving) return;
    if (newPassword !== confirmPassword) { setError("Passwords don't match."); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await updateProfile({ password: newPassword });
    setSaving(false);
    if (err) { setError(err); return; }
    setNewPassword("");
    setConfirmPassword("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fc] pb-12">
      <div className="max-w-lg mx-auto px-5 pt-12">
        <button
          onClick={() => navigate("/app")}
          style={{ touchAction: "manipulation" }}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-8 min-h-[44px]"
        >
          <ChevronLeft size={15} /> Back to Wave AI
        </button>

        <div className="flex items-center gap-4 mb-8">
          <SmallOrb size={72} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 truncate">{user.username}</h1>
            <p className="text-sm text-slate-400 truncate">{user.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <StatCard icon={MessageSquare} label="Conversations" value={stats.chats} color="text-primary" />
          <StatCard icon={BarChart3} label="Messages sent" value={stats.messages} color="text-violet-500" />
          <StatCard icon={User} label="Member since" value={`Wave AI ${stats.joined}`} color="text-pink-500" />
          <StatCard icon={CheckCircle2} label="Account status" value="Verified" color="text-emerald-500" />
        </div>

        {/* Section tabs */}
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
          {([
            { id: "display",  icon: User, label: "Display name" },
            { id: "password", icon: Lock, label: "Password" },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setActiveSection(id); setError(null); }}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[40px]",
                activeSection === id ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Display name section */}
        {activeSection === "display" && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <User size={14} className="text-primary" /> Update Display Name
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3">
                  <Mail size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-500">{user.email}</span>
                  <span className="ml-auto text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Read only</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Display name</label>
                <div className="relative">
                  <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter display name"
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/40 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{error}</div>
            )}
            {saved && (
              <div className="mt-4 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <CheckCircle2 size={12} /> Changes saved successfully.
              </div>
            )}
            <button
              onClick={handleSaveDisplay}
              disabled={!canSaveDisplay || saving}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "w-full mt-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm min-h-[48px]",
                canSaveDisplay && !saving ? "wave-gradient text-white hover:opacity-90" : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {saving ? (
                <span className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 typing-dot" />
                  ))}
                </span>
              ) : <><Save size={14} /> Save changes</>}
            </button>
          </div>
        )}

        {/* Password section */}
        {activeSection === "password" && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Lock size={14} className="text-violet-500" /> Change Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">New password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    minLength={6}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/40 focus:bg-white transition-colors"
                  />
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map(i => {
                        const s = newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : 3;
                        return <div key={i} className={cn("h-0.5 flex-1 rounded-full transition-colors", s >= i ? ["", "bg-red-400", "bg-amber-400", "bg-emerald-400"][s] : "bg-slate-200")} />;
                      })}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {newPassword.length < 6 ? "Weak" : newPassword.length < 10 ? "Fair" : "Strong"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm new password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={cn(
                      "w-full pl-9 pr-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors",
                      confirmPassword.length > 0 && confirmPassword !== newPassword
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 focus:border-primary/40 focus:bg-white"
                    )}
                  />
                </div>
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>
            </div>
            {error && (
              <div className="mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{error}</div>
            )}
            {saved && (
              <div className="mt-4 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <CheckCircle2 size={12} /> Password updated successfully.
              </div>
            )}
            <button
              onClick={handleSavePassword}
              disabled={!canSavePassword || saving}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "w-full mt-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm min-h-[48px]",
                canSavePassword && !saving ? "wave-gradient text-white hover:opacity-90" : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {saving ? (
                <span className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 typing-dot" />
                  ))}
                </span>
              ) : <><Save size={14} /> Update password</>}
            </button>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-300 mt-8">
          ®2026 Wave Platforms, Inc.™ · All rights reserved.
        </p>
      </div>
    </div>
  );
}

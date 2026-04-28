import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

interface AuthCtx {
  user: AuthUser | null;
  /** true only for the very first auth-state check on page load */
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { username?: string; password?: string }) => Promise<{ error: string | null }>;
}

const Ctx = createContext<AuthCtx | null>(null);

function mapUser(u: User): AuthUser {
  return {
    id: u.id,
    email: u.email!,
    username:
      u.user_metadata?.username ||
      u.user_metadata?.full_name ||
      u.email!.split("@")[0],
  };
}

/**
 * Synchronously read the cached Supabase session from localStorage.
 * Supabase stores the session under our custom storageKey ("alva_session").
 * This gives us an instant initial auth state — no async needed for first render.
 */
function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("alva_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Supabase session object has { user, access_token, expires_at, ... }
    const u = parsed?.user;
    if (!u?.id || !u?.email) return null;
    // Check expiry — don't use an expired token as truth
    const expiresAt = parsed?.expires_at as number | undefined;
    if (expiresAt && expiresAt * 1000 < Date.now()) return null;
    return {
      id: u.id,
      email: u.email,
      username:
        u.user_metadata?.username ||
        u.user_metadata?.full_name ||
        u.email.split("@")[0],
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize synchronously from localStorage — no loading flash for returning users.
  const [user, setUser]       = useState<AuthUser | null>(readCachedUser);
  // loading=false immediately; we verify the token asynchronously in the background.
  const [loading, setLoading] = useState(false);
  const mountedRef  = useRef(true);
  const initDone    = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    initDone.current   = false;

    const applyUser = (u: User | null | undefined) => {
      if (!mountedRef.current) return;
      setUser(u ? mapUser(u) : null);
    };

    // Listen for auth state changes (sign-in / sign-out / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    // Silently verify the cached session in the background.
    // This corrects the state if the token was expired or revoked.
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!initDone.current) {
          initDone.current = true;
          applyUser(session?.user ?? null);
        }
      })
      .catch(() => {
        if (!initDone.current) {
          initDone.current = true;
          // If verification fails, trust the cached state — don't sign out.
        }
      });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── signUp ────────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string, username?: string): Promise<{ error: string | null }> => {
      const uname = username?.trim() || email.split("@")[0];
      const cleanEmail = email.trim().toLowerCase();

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { username: uname } },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already")) {
          return { error: "An account with this email already exists. Please sign in instead." };
        }
        return { error: signUpError.message };
      }

      // Remember this email for future sign-ins
      try { localStorage.setItem("wave_last_email", cleanEmail); } catch { /* ignore */ }

      if (signUpData.session?.user) {
        return { error: null };
      }

      // Try once to auto-sign-in (handles auto-confirm projects)
      const { data: siData } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      }).catch(() => ({ data: null }));

      if (siData?.session?.user) {
        return { error: null };
      }

      // Account created but no session (email confirmation enforced).
      // Surface a temporary local user so they can use the app right away —
      // the real auth state will hydrate on next sign-in.
      if (signUpData.user && mountedRef.current) {
        setUser({
          id: signUpData.user.id,
          email: cleanEmail,
          username: uname,
        });
      }
      return { error: null };
    },
    []
  );

  // ── signIn ────────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const cleanEmail = email.trim().toLowerCase();

      const result = await Promise.race([
        supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        }),
        new Promise<{ data: null; error: { message: string } }>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out. Check your connection and try again.")), 12000)
        ),
      ]).catch((e: Error) => ({ data: null, error: { message: e.message } }));

      const { error } = result as { data: unknown; error: { message: string } | null };

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid login credentials") || msg.includes("invalid credentials") || msg.includes("user not found")) {
          return { error: "Email or password is incorrect. Please check your details and try again." };
        }
        if (msg.includes("email not confirmed")) {
          return { error: "Please confirm your email address before signing in. Check your inbox for the confirmation link." };
        }
        if (msg.includes("timed out") || msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
          return { error: "Connection too slow. Please check your internet and try again." };
        }
        return { error: error.message };
      }

      try { localStorage.setItem("wave_last_email", cleanEmail); } catch { /* ignore */ }
      return { error: null };
    },
    []
  );

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (mountedRef.current) setUser(null);
    await supabase.auth.signOut().catch(() => {});
    // Only clear auth-related keys, NOT chat history
    Object.keys(localStorage)
      .filter(k => k.startsWith("alva_session") || (k.includes("supabase") && k.includes("auth")))
      .forEach(k => localStorage.removeItem(k));
  }, []);

  // ── updateProfile ─────────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (updates: { username?: string; password?: string }): Promise<{ error: string | null }> => {
      const payload: Record<string, unknown> = {};
      if (updates.password) payload.password = updates.password;
      if (updates.username) payload.data = { username: updates.username };

      const { data, error } = await supabase.auth.updateUser(payload);
      if (error) return { error: error.message };

      if (data.user && mountedRef.current) setUser(mapUser(data.user));
      return { error: null };
    },
    []
  );

  return (
    <Ctx.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

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

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("alva_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const u = parsed?.user;
    if (!u?.id || !u?.email) return null;
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
  const [user, setUser] = useState<AuthUser | null>(readCachedUser);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const initDone = useRef(false);
  // KEY FIX: Track when we've manually set a local user so auth-state-change
  // doesn't wipe it immediately (email-confirmation-required flow).
  const localUserExpiry = useRef<number>(0);
  const localUserRef = useRef<AuthUser | null>(null);

  const applyUser = useCallback((u: User | null | undefined) => {
    if (!mountedRef.current) return;
    // If we set a local user recently (within 10s), don't let Supabase
    // auth-state-change override it with null — the session is just pending.
    if (!u && localUserRef.current && Date.now() < localUserExpiry.current) {
      return; // keep the local user alive
    }
    if (u) {
      localUserRef.current = null; // real session arrived, clear local override
      localUserExpiry.current = 0;
    }
    setUser(u ? mapUser(u) : null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!initDone.current) {
          initDone.current = true;
          applyUser(session?.user ?? null);
        }
      })
      .catch(() => {
        initDone.current = true;
      });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [applyUser]);

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

      try { localStorage.setItem("wave_last_email", cleanEmail); } catch { /* ignore */ }

      // Real session exists — we're done
      if (signUpData.session?.user) {
        if (mountedRef.current) setUser(mapUser(signUpData.session.user));
        return { error: null };
      }

      // Try auto-signin (auto-confirm projects)
      try {
        const { data: siData } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (siData?.session?.user) {
          if (mountedRef.current) setUser(mapUser(siData.session.user));
          return { error: null };
        }
      } catch { /* ignore */ }

      // Email confirmation required — set local user so the app works immediately.
      // Protect it from being wiped by onAuthStateChange for 10 seconds.
      if (signUpData.user && mountedRef.current) {
        const localUser: AuthUser = { id: signUpData.user.id, email: cleanEmail, username: uname };
        localUserRef.current = localUser;
        localUserExpiry.current = Date.now() + 10_000;
        setUser(localUser);
      }
      return { error: null };
    },
    [applyUser]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const cleanEmail = email.trim().toLowerCase();

      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email: cleanEmail, password }),
        new Promise<{ data: null; error: { message: string } }>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out. Check your connection and try again.")), 12000)
        ),
      ]).catch((e: Error) => ({ data: null, error: { message: e.message } }));

      const { data, error } = result as { data: { user?: User; session?: unknown } | null; error: { message: string } | null };

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid login credentials") || msg.includes("invalid credentials") || msg.includes("user not found")) {
          return { error: "Email or password is incorrect. Please check your details and try again." };
        }
        if (msg.includes("email not confirmed")) {
          return { error: "Please confirm your email address before signing in. Check your inbox." };
        }
        if (msg.includes("timed out") || msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
          return { error: "Connection too slow. Please check your internet and try again." };
        }
        return { error: error.message };
      }

      // Sign-in succeeded — immediately set user so navigate("/app") works instantly
      if (data?.user && mountedRef.current) {
        setUser(mapUser(data.user));
      }

      try { localStorage.setItem("wave_last_email", cleanEmail); } catch { /* ignore */ }
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    localUserRef.current = null;
    localUserExpiry.current = 0;
    if (mountedRef.current) setUser(null);
    await supabase.auth.signOut().catch(() => {});
    Object.keys(localStorage)
      .filter(k => k.startsWith("alva_session") || (k.includes("supabase") && k.includes("auth")))
      .forEach(k => localStorage.removeItem(k));
  }, []);

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

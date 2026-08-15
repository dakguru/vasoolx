"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { isSupabaseConfigured, getSupabaseBrowser } from "@/lib/supabase/client";

type AuthState = {
  ready: boolean;
  authed: boolean;
  email: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    meta: { name: string; phone: string }
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);
const KEY = "vasoolx.auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (isSupabaseConfigured) {
        const sb = getSupabaseBrowser();
        const { data } = await sb!.auth.getUser();
        setAuthed(!!data.user);
        setEmail(data.user?.email ?? null);
      } else {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          setAuthed(true);
          setEmail(raw);
        }
      }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (em: string, password: string) => {
    if (isSupabaseConfigured) {
      const sb = getSupabaseBrowser();
      const { error } = await sb!.auth.signInWithPassword({ email: em, password });
      if (error) return { error: error.message };
      setAuthed(true);
      setEmail(em);
      return {};
    }
    // Demo mode
    if (!em || !password) return { error: "Enter email and password" };
    localStorage.setItem(KEY, em);
    setAuthed(true);
    setEmail(em);
    return {};
  }, []);

  const signUp = useCallback(
    async (
      em: string,
      password: string,
      meta: { name: string; phone: string }
    ) => {
      if (isSupabaseConfigured) {
        const sb = getSupabaseBrowser();
        const { error } = await sb!.auth.signUp({
          email: em,
          password,
          options: { data: meta },
        });
        if (error) return { error: error.message };
        setAuthed(true);
        setEmail(em);
        return {};
      }
      if (!em || !password) return { error: "Enter email and password" };
      localStorage.setItem(KEY, em);
      setAuthed(true);
      setEmail(em);
      return {};
    },
    []
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      const sb = getSupabaseBrowser();
      await sb!.auth.signOut();
    }
    localStorage.removeItem(KEY);
    setAuthed(false);
    setEmail(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ ready, authed, email, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

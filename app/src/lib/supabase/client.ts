"use client";

import { createBrowserClient } from "@supabase/ssr";

// Returns null when Supabase env is not configured (the app then runs in the
// local demo mode backed by localStorage). Wire real credentials in .env.local
// to switch the whole app to the Supabase backend.
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

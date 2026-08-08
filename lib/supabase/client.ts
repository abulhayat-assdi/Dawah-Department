import { createBrowserClient } from "@supabase/ssr";
import { requirePublicEnv } from "./env";

/** Supabase client for use in Client Components ("use client"). */
export function createClient() {
  const { url, anonKey } = requirePublicEnv();
  return createBrowserClient(url, anonKey);
}

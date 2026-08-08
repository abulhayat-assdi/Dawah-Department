/**
 * Supabase environment variables, read in one place.
 *
 * `NEXT_PUBLIC_*` values are inlined at **build** time, so they must exist in
 * the build environment too — on Vercel that means adding them under Project
 * Settings → Environment Variables and then redeploying. A deploy built without
 * them produces `undefined` here and every Supabase client throws.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the public URL + anon key are both present. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function missing(name: string): never {
  throw new Error(
    `[supabase] Missing environment variable ${name}. Add it to .env.local ` +
      `locally, or to Project Settings → Environment Variables on Vercel, ` +
      `then redeploy (NEXT_PUBLIC_* values are baked in at build time).`,
  );
}

/** Public URL + anon key, or a named error saying which one is missing. */
export function requirePublicEnv() {
  if (!SUPABASE_URL) missing("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}

/** Service-role credentials for admin-only server code. */
export function requireServiceEnv() {
  if (!SUPABASE_URL) missing("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) missing("SUPABASE_SERVICE_ROLE_KEY");
  return { url: SUPABASE_URL, serviceKey };
}

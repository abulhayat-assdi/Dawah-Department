import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS. ONLY use in trusted Server Actions /
 * Route Handlers (e.g. creating teacher accounts). Never import in client code.
 */
export function createAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

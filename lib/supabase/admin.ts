import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireServiceEnv } from "./env";

/**
 * Service-role client — bypasses RLS. ONLY use in trusted Server Actions /
 * Route Handlers (e.g. creating teacher accounts). Never import in client code.
 */
export function createAdminClient() {
  const { url, serviceKey } = requireServiceEnv();
  return createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

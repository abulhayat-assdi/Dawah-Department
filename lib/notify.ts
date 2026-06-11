import { createAdminClient } from "./supabase/admin";

/**
 * Emit an in-app notification for a user. Uses the service-role client so it
 * works from privileged Server Actions / Route Handlers regardless of who is
 * acting. The notification bell (components/notification-bell.tsx) reads these.
 */
export async function createNotification(
  userId: string,
  n: { title: string; body?: string | null; link?: string | null },
): Promise<void> {
  if (!userId) return;
  const supabase = createAdminClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    title: n.title,
    body: n.body ?? null,
    link: n.link ?? null,
  });
}

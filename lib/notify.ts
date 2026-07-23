import { createAdminClient } from "./supabase/admin";
import { resolveNavItems } from "./nav";
import type { UserRole } from "./types";

/**
 * Emit an in-app notification for a user. Uses the service-role client so it
 * works from privileged Server Actions / Route Handlers regardless of who is
 * acting.
 *
 * The `link` is what drives the sidebar badge: components/app-shell.tsx maps
 * it to the deepest matching nav href (see lib/nav.ts `matchNavHref`) and
 * shows the unread count there, so always point `link` at the page the user
 * should land on.
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

/**
 * Notify every active user whose sidebar contains `href` — i.e. everyone who
 * can actually act on the thing being announced. Resolves each profile's nav
 * with the same rules the app layout uses (roles + Access Management grants),
 * so a coordinator whose grants exclude the page is not pinged about it.
 *
 * `link` defaults to `href`, which is what makes the badge land on that page.
 */
export async function notifyPageAudience(
  href: string,
  n: { title: string; body?: string | null; link?: string | null },
  opts: { exclude?: string[] } = {},
): Promise<void> {
  const supabase = createAdminClient();
  const [{ data: profiles }, { data: roleRows }, { data: grantRows }] =
    await Promise.all([
      supabase.from("profiles").select("id, role").eq("is_active", true),
      supabase.from("profile_roles").select("profile_id, role"),
      supabase.from("user_page_access").select("profile_id, href"),
    ]);
  if (!profiles?.length) return;

  const extraRoles = new Map<string, UserRole[]>();
  for (const row of roleRows ?? []) {
    const id = row.profile_id as string;
    extraRoles.set(id, [...(extraRoles.get(id) ?? []), row.role as UserRole]);
  }
  const grants = new Map<string, string[]>();
  for (const row of grantRows ?? []) {
    const id = row.profile_id as string;
    grants.set(id, [...(grants.get(id) ?? []), row.href as string]);
  }

  const exclude = new Set(opts.exclude ?? []);
  const rows = profiles
    .filter((p) => !exclude.has(p.id as string))
    .filter((p) => {
      const id = p.id as string;
      const roles = Array.from(
        new Set([p.role as UserRole, ...(extraRoles.get(id) ?? [])]),
      );
      return resolveNavItems(roles, grants.get(id) ?? []).some(
        (item) => item.href === href,
      );
    })
    .map((p) => ({
      user_id: p.id as string,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? href,
    }));

  if (rows.length) await supabase.from("notifications").insert(rows);
}

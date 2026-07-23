"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { matchNavHref } from "@/lib/nav";

/**
 * Unread notification counts per sidebar entry, keyed by nav href.
 *
 * Each unread row is filed under the deepest nav href its `link` sits under,
 * so "task assigned" (`/my/tasks`) lands on My Tasks and "new submission"
 * (`/admin/task-report`) on Task Report. Reads the current user's own rows
 * straight from the browser client under RLS policy `notif_self`.
 *
 * Opening a page marks that page's notifications read, so its badge clears —
 * that happens here rather than per-item because the whole point of the badge
 * is "there is something on this page you haven't looked at yet".
 */
export function useNavNotificationCounts(
  userId: string,
  navHrefs: string[],
  pathname: string,
): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  // Join so a re-rendered array with the same entries doesn't restart polling.
  const hrefsKey = navHrefs.join("|");

  useEffect(() => {
    const hrefs = hrefsKey.split("|").filter(Boolean);
    const activeHref = matchNavHref(pathname, hrefs);
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("id, link")
        .eq("user_id", userId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;

      const next: Record<string, number> = {};
      const onThisPage: string[] = [];
      for (const row of (data ?? []) as { id: string; link: string | null }[]) {
        const target = matchNavHref(row.link, hrefs);
        if (!target) continue; // link has no sidebar home — no badge to raise
        if (target === activeHref) {
          onThisPage.push(row.id);
          continue; // the user is looking at it right now
        }
        next[target] = (next[target] ?? 0) + 1;
      }
      setCounts(next);

      if (onThisPage.length) {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .in("id", onThisPage);
      }
    }

    load();
    // Light polling keeps the counts fresh without a realtime subscription.
    const timer = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [userId, hrefsKey, pathname]);

  return counts;
}

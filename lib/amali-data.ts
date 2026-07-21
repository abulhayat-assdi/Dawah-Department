import { createClient } from "./supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** A routine counts as "successfully completed" once at least this share of
 * logged member-days for it were marked done. */
const COMPLETION_THRESHOLD = 0.7;

export interface AmaliMonthlyHistory {
  campusId: string;
  campusName: string;
  monthLabel: string;
  completedRoutines: string[];
}

/** First and last ISO date of a "YYYY-MM" month. */
function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

function monthLabelOf(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Builds one campus's monthly Amali summary — the routines it
 * "successfully completed" (≥70% of logged member-days done) that month. */
async function computeMonthlyHistory(
  supabase: SupabaseClient,
  campusId: string,
  campusName: string,
  month: string,
): Promise<AmaliMonthlyHistory> {
  const { start, end } = monthRange(month);
  const monthLabel = monthLabelOf(month);

  const [{ data: items }, { data: memberLinks }] = await Promise.all([
    supabase
      .from("amali_items")
      .select("id, title")
      .or(`campus_id.eq.${campusId},campus_id.is.null`),
    supabase.from("teacher_campuses").select("teacher_id").eq("campus_id", campusId),
  ]);
  const itemIds = (items ?? []).map((i) => i.id as string);
  const memberIds = (memberLinks ?? []).map((m) => m.teacher_id as string);

  if (!itemIds.length || !memberIds.length) {
    return { campusId, campusName, monthLabel, completedRoutines: [] };
  }

  const { data: logs } = await supabase
    .from("amali_logs")
    .select("item_id, done")
    .in("item_id", itemIds)
    .in("teacher_id", memberIds)
    .gte("log_date", start)
    .lte("log_date", end);

  const rows = (logs ?? []) as { item_id: string; done: boolean }[];

  const completedRoutines: string[] = [];
  for (const item of items ?? []) {
    const itemLogs = rows.filter((r) => r.item_id === item.id);
    if (!itemLogs.length) continue;
    const rate = itemLogs.filter((r) => r.done).length / itemLogs.length;
    if (rate >= COMPLETION_THRESHOLD) completedRoutines.push(item.title as string);
  }

  return { campusId, campusName, monthLabel, completedRoutines };
}

/** The list of routines a campus successfully completed in a given month. */
export async function getAmaliMonthlyHistory(
  campusId: string,
  month: string,
): Promise<AmaliMonthlyHistory | null> {
  const supabase = await createClient();
  const { data: campus } = await supabase
    .from("campuses")
    .select("name")
    .eq("id", campusId)
    .maybeSingle();
  if (!campus) return null;
  return computeMonthlyHistory(supabase, campusId, campus.name as string, month);
}

/**
 * The same monthly summary for every campus at once, for the "All Campuses"
 * side-by-side view.
 */
export async function getAmaliMonthlyHistoryAll(
  month: string,
): Promise<AmaliMonthlyHistory[]> {
  const supabase = await createClient();
  const { data: campuses } = await supabase.from("campuses").select("id, name").order("name");
  const list = (campuses ?? []) as { id: string; name: string }[];
  return Promise.all(list.map((c) => computeMonthlyHistory(supabase, c.id, c.name, month)));
}

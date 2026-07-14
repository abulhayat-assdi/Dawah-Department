import { createClient } from "./supabase/server";

export interface AmaliMonthlyHistory {
  campusName: string;
  monthLabel: string;
  completedRoutines: string[];
  rangeStart: string | null;
  rangeEnd: string | null;
}

/** First and last ISO date of a "YYYY-MM" month. */
function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

/**
 * Builds the "In {month}, {campus} successfully completed these Amali
 * routines from {start} to {end}" narrative for one campus. A routine
 * counts as "successfully completed" for the month if at least 70% of that
 * campus's logged member-days for that routine were marked done.
 */
export async function getAmaliMonthlyHistory(
  campusId: string,
  month: string,
): Promise<AmaliMonthlyHistory | null> {
  const supabase = await createClient();
  const { start, end } = monthRange(month);

  const { data: campus } = await supabase
    .from("campuses")
    .select("name")
    .eq("id", campusId)
    .maybeSingle();
  if (!campus) return null;

  const [{ data: items }, { data: memberLinks }] = await Promise.all([
    supabase
      .from("amali_items")
      .select("id, title")
      .or(`campus_id.eq.${campusId},campus_id.is.null`),
    supabase.from("teacher_campuses").select("teacher_id").eq("campus_id", campusId),
  ]);
  const itemIds = (items ?? []).map((i) => i.id as string);
  const memberIds = (memberLinks ?? []).map((m) => m.teacher_id as string);

  const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  if (!itemIds.length || !memberIds.length) {
    return { campusName: campus.name as string, monthLabel, completedRoutines: [], rangeStart: null, rangeEnd: null };
  }

  const { data: logs } = await supabase
    .from("amali_logs")
    .select("item_id, teacher_id, log_date, done")
    .in("item_id", itemIds)
    .in("teacher_id", memberIds)
    .gte("log_date", start)
    .lte("log_date", end);

  const rows = (logs ?? []) as {
    item_id: string;
    log_date: string;
    done: boolean;
  }[];

  const completedRoutines: string[] = [];
  let rangeStart: string | null = null;
  let rangeEnd: string | null = null;

  for (const item of items ?? []) {
    const itemLogs = rows.filter((r) => r.item_id === item.id);
    if (!itemLogs.length) continue;
    const doneLogs = itemLogs.filter((r) => r.done);
    const rate = doneLogs.length / itemLogs.length;
    if (rate >= 0.7) {
      completedRoutines.push(item.title as string);
      for (const l of doneLogs) {
        if (!rangeStart || l.log_date < rangeStart) rangeStart = l.log_date;
        if (!rangeEnd || l.log_date > rangeEnd) rangeEnd = l.log_date;
      }
    }
  }

  return {
    campusName: campus.name as string,
    monthLabel,
    completedRoutines,
    rangeStart,
    rangeEnd,
  };
}

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  EmptyState,
  ProgressBar,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { toggleAmaliLog } from "./actions";
import type { AmaliItem } from "@/lib/types";

export default async function MyAmaliPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: itemData }, { data: logData }] = await Promise.all([
    supabase
      .from("amali_items")
      .select("*")
      .eq("is_active", true)
      .order("sequence")
      .order("created_at"),
    supabase
      .from("amali_logs")
      .select("item_id, done")
      .eq("teacher_id", profile.id)
      .eq("log_date", today),
  ]);

  const items = (itemData ?? []) as AmaliItem[];
  const doneSet = new Set(
    (logData ?? []).filter((l) => l.done).map((l) => l.item_id as string),
  );
  const pct =
    items.length > 0 ? Math.round((doneSet.size / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="আমলি কর্মসূচি"
        subtitle={`আজকের চেকলিস্ট — ${formatDate(today)}`}
      />

      <Card>
        <CardHeader
          title="আজকের আমল"
          subtitle={`${doneSet.size} / ${items.length} সম্পন্ন`}
          action={<div className="w-40"><ProgressBar value={pct} /></div>}
        />
        {items.length === 0 ? (
          <EmptyState
            icon="📿"
            title="কোনো আমলি আইটেম নেই"
            hint="কোঅর্ডিনেটর আইটেম যুক্ত করলে এখানে দেখা যাবে।"
          />
        ) : (
          <ul className="divide-y divide-slate-50">
            {items.map((it) => {
              const done = doneSet.has(it.id);
              return (
                <li key={it.id} className="px-5 py-1">
                  <form action={toggleAmaliLog}>
                    <input type="hidden" name="item_id" value={it.id} />
                    <input
                      type="hidden"
                      name="done"
                      value={(!done).toString()}
                    />
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                    >
                      <span
                        className={
                          done
                            ? "grid size-6 shrink-0 place-items-center rounded-md bg-green-500 text-sm text-white"
                            : "grid size-6 shrink-0 place-items-center rounded-md border border-slate-300 text-transparent"
                        }
                      >
                        ✓
                      </span>
                      <span
                        className={
                          done
                            ? "text-slate-400 line-through"
                            : "text-slate-800"
                        }
                      >
                        {it.title}
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

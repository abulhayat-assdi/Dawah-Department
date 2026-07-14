import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  Label,
  Input,
  Select,
  Button,
  EmptyState,
} from "@/components/ui";
import { createAmaliItem, toggleAmaliItem, deleteAmaliItem } from "./actions";
import { getAmaliMonthlyHistory } from "@/lib/amali-data";
import { formatDate } from "@/lib/utils";
import type { AmaliItem, Campus } from "@/lib/types";

export default async function AdminAmaliPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const profile = await requireCoordinatorOrAdmin();
  const supabase = await createClient();

  let campusIds: string[] | null = null; // null = every campus (super_admin)
  if (profile.role === "coordinator") {
    const { data } = await supabase
      .from("teacher_campuses")
      .select("campus_id")
      .eq("teacher_id", profile.id);
    campusIds = (data ?? []).map((r) => r.campus_id as string);
  }

  const [{ data }, { data: campusData }] = await Promise.all([
    supabase.from("amali_items").select("*").order("sequence").order("created_at"),
    campusIds
      ? campusIds.length
        ? supabase.from("campuses").select("*").in("id", campusIds).order("name")
        : Promise.resolve({ data: [] as Campus[] })
      : supabase.from("campuses").select("*").order("name"),
  ]);
  const items = (data ?? []) as AmaliItem[];
  const campuses = (campusData ?? []) as Campus[];
  const campusName = (id: string | null) =>
    id ? campuses.find((c) => c.id === id)?.name ?? "—" : "Global (every campus)";

  const sp = await searchParams;
  const historyCampus = String(sp.history_campus ?? campuses[0]?.id ?? "");
  const historyMonth = String(sp.history_month ?? new Date().toISOString().slice(0, 7));
  const history = historyCampus
    ? await getAmaliMonthlyHistory(historyCampus, historyMonth)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="আমলি কর্মসূচি"
        subtitle="সদস্যদের দৈনিক আমলি চেকলিস্টের আইটেম তৈরি ও পরিচালনা করুন।"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="চেকলিস্ট আইটেম" subtitle={`মোট ${items.length} টি`} />
          {items.length === 0 ? (
            <EmptyState icon="📿" title="কোনো আইটেম নেই" />
          ) : (
            <ul className="divide-y divide-slate-50">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                      {it.sequence}
                    </span>
                    <div>
                      <p
                        className={
                          it.is_active
                            ? "font-medium text-slate-800"
                            : "font-medium text-slate-400 line-through"
                        }
                      >
                        {it.title}
                      </p>
                      <p className="text-xs text-slate-400">{campusName(it.campus_id)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={toggleAmaliItem}>
                      <input type="hidden" name="id" value={it.id} />
                      <input
                        type="hidden"
                        name="is_active"
                        value={(!it.is_active).toString()}
                      />
                      <Button variant="ghost" className="text-xs">
                        {it.is_active ? "নিষ্ক্রিয়" : "সক্রিয়"}
                      </Button>
                    </form>
                    <form action={deleteAmaliItem}>
                      <input type="hidden" name="id" value={it.id} />
                      <Button variant="ghost" className="text-xs text-red-600">
                        মুছুন
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="নতুন আইটেম" />
          <form action={createAmaliItem} className="space-y-4 p-5">
            <div>
              <Label htmlFor="title">শিরোনাম</Label>
              <Input id="title" name="title" required placeholder="যেমন: তাহাজ্জুদ" />
            </div>
            <div>
              <Label htmlFor="sequence">ক্রম (sequence)</Label>
              <Input
                id="sequence"
                name="sequence"
                type="number"
                defaultValue={items.length + 1}
              />
            </div>
            <div>
              <Label htmlFor="campus_id">Campus (leave blank for a global routine)</Label>
              <Select id="campus_id" name="campus_id" defaultValue="">
                <option value="">Global — every campus</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" className="w-full">
              যোগ করুন
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Monthly History"
          subtitle="A narrative summary of which routines a campus completed, and when"
        />
        <form method="get" className="grid gap-3 p-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="history_campus">Campus</Label>
            <Select id="history_campus" name="history_campus" defaultValue={historyCampus}>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="history_month">Month</Label>
            <Input
              id="history_month"
              name="history_month"
              type="month"
              defaultValue={historyMonth}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Show
            </Button>
          </div>
        </form>
        <div className="border-t border-slate-100 p-5">
          {!history ? (
            <EmptyState icon="📿" title="Add a campus first to see its monthly history" />
          ) : history.completedRoutines.length === 0 ? (
            <p className="text-sm text-slate-500">
              No routine reached a 70% completion rate for {history.campusName} in{" "}
              {history.monthLabel} yet.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-slate-700">
              In <span className="font-semibold">{history.monthLabel}</span>,{" "}
              <span className="font-semibold">{history.campusName}</span> successfully
              completed these Amali routines —{" "}
              <span className="font-medium">{history.completedRoutines.join(", ")}</span>
              {history.rangeStart && history.rangeEnd && (
                <>
                  {" "}
                  from {formatDate(history.rangeStart)} to {formatDate(history.rangeEnd)}
                </>
              )}
              .
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

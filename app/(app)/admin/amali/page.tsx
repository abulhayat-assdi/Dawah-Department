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
import { toggleAmaliItem, deleteAmaliItem } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";
import { AmaliFormModal } from "./amali-form-modal";
import { getAmaliMonthlyHistory, getAmaliMonthlyHistoryAll } from "@/lib/amali-data";
import { formatDate } from "@/lib/utils";
import type { AmaliItem, Campus } from "@/lib/types";

const ALL_CAMPUSES = "all";

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
    supabase.from("amali_items").select("*").order("start_date").order("created_at"),
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

  const today = new Date().toISOString().slice(0, 10);
  const isCompleted = (it: AmaliItem) => Boolean(it.end_date) && it.end_date! < today;
  const activeItems = items.filter((it) => !isCompleted(it));
  const completedItems = items.filter(isCompleted);

  const sp = await searchParams;
  const historyCampus = String(sp.history_campus ?? ALL_CAMPUSES);
  const historyMonth = String(sp.history_month ?? new Date().toISOString().slice(0, 7));
  const singleHistory =
    historyCampus !== ALL_CAMPUSES && historyCampus
      ? await getAmaliMonthlyHistory(historyCampus, historyMonth)
      : null;
  const allHistory =
    historyCampus === ALL_CAMPUSES ? await getAmaliMonthlyHistoryAll(historyMonth) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="আমলি চেকলিস্ট পরিচালনা"
        subtitle="এখানে যেসব আইটেম যোগ করবেন, সেগুলোই সদস্যদের ড্যাশবোর্ডে দৈনিক চেকলিস্ট হিসেবে দেখা যাবে।"
        action={<AmaliFormModal campuses={campuses} />}
      />

      <Card>
        <CardHeader title="চলমান আমল" subtitle={`মোট ${activeItems.length} টি`} />
        {activeItems.length === 0 ? (
          <EmptyState icon="📿" title="কোনো চলমান আমল নেই" />
        ) : (
          <AmaliList items={activeItems} campusName={campusName} today={today} />
        )}
      </Card>

      <Card>
        <CardHeader title="সম্পন্ন আমল" subtitle={`মোট ${completedItems.length} টি`} />
        {completedItems.length === 0 ? (
          <EmptyState icon="✅" title="এখনো কোনো আমলের মেয়াদ শেষ হয়নি" />
        ) : (
          <AmaliList items={completedItems} campusName={campusName} today={today} />
        )}
      </Card>

      <Card>
        <CardHeader
          title="Monthly History"
          subtitle="A narrative summary of which routines a campus completed, and when"
        />
        <form method="get" className="grid gap-3 p-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="history_campus">Campus</Label>
            <Select id="history_campus" name="history_campus" defaultValue={historyCampus}>
              <option value={ALL_CAMPUSES}>সব ক্যাম্পাস (All Campuses)</option>
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
          {allHistory ? (
            allHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No campuses found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allHistory.map((h) => (
                  <div
                    key={h.campusId}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <p className="font-semibold text-slate-800">{h.campusName}</p>
                    {h.completedRoutines.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        {h.monthLabel}-এ কোনো আমল সম্পন্ন হয়নি।
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {h.completedRoutines.map((title) => (
                          <li key={title}>• {title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : !singleHistory ? (
            <EmptyState icon="📿" title="Add a campus first to see its monthly history" />
          ) : singleHistory.completedRoutines.length === 0 ? (
            <p className="text-sm text-slate-500">
              {singleHistory.monthLabel}-এ {singleHistory.campusName}-এর কোনো আমল সম্পন্ন হয়নি।
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm text-slate-700">
              {singleHistory.completedRoutines.map((title) => (
                <li key={title}>• {title}</li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

function dateRangeLabel(it: AmaliItem, today: string): string {
  if (it.start_date && it.end_date) {
    return `${formatDate(it.start_date)} – ${formatDate(it.end_date)}`;
  }
  if (it.start_date) {
    return it.start_date > today
      ? `${formatDate(it.start_date)} থেকে শুরু হবে`
      : `${formatDate(it.start_date)} থেকে চলমান`;
  }
  if (it.end_date) return `${formatDate(it.end_date)} পর্যন্ত`;
  return "চলমান (কোনো নির্দিষ্ট মেয়াদ নেই)";
}

function AmaliList({
  items,
  campusName,
  today,
}: {
  items: AmaliItem[];
  campusName: (id: string | null) => string;
  today: string;
}) {
  return (
    <ul className="divide-y divide-slate-50">
      {items.map((it) => (
        <li key={it.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
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
            <p className="mt-0.5 text-xs text-slate-400">
              {campusName(it.campus_id)} · {dateRangeLabel(it, today)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <form action={toggleAmaliItem}>
              <input type="hidden" name="id" value={it.id} />
              <input type="hidden" name="is_active" value={(!it.is_active).toString()} />
              <Button variant="ghost" className="text-xs">
                {it.is_active ? "নিষ্ক্রিয়" : "সক্রিয়"}
              </Button>
            </form>
            <ConfirmButton
              action={deleteAmaliItem}
              fields={{ id: it.id }}
              variant="ghost"
              triggerClassName="text-xs text-red-600"
              title="আমলটি ডিলিট করবেন?"
              message={`"${it.title}" আমলটি মুছে ফেলা হবে।`}
              confirmLabel="মুছে ফেলুন"
            >
              মুছুন
            </ConfirmButton>
          </div>
        </li>
      ))}
    </ul>
  );
}

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, StatCard, EmptyState, Button } from "@/components/ui";
import { formatDate, toBn } from "@/lib/utils";
import { setQuranStatus, setDawahStatus } from "@/app/(app)/_actions/staff-tracker";
import type { DawahCounselingSession, StaffQuranSession } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "🟡 Scheduled",
  done: "🟢 Done",
  missed: "🔴 Missed",
};

export default async function MyStaffTrackerPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: quranData }, { data: dawahData }] = await Promise.all([
    supabase
      .from("staff_quran_sessions")
      .select("*")
      .eq("staff_id", profile.id)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("dawah_counseling_sessions")
      .select("*")
      .eq("staff_id", profile.id)
      .order("session_date", { ascending: false }),
  ]);
  const quranRows = (quranData ?? []) as StaffQuranSession[];
  const dawahRows = (dawahData ?? []) as DawahCounselingSession[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Quran Class & Dawah Counseling"
        subtitle="Sessions your coordinator has scheduled for you."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Quran Done"
          value={toBn(quranRows.filter((r) => r.status === "done").length)}
          icon="📖"
          accent="green"
        />
        <StatCard
          label="Quran Scheduled"
          value={toBn(quranRows.filter((r) => r.status === "scheduled").length)}
          icon="🕒"
          accent="yellow"
        />
        <StatCard
          label="Counseling Done"
          value={toBn(dawahRows.filter((r) => r.status === "done").length)}
          icon="🤝"
          accent="green"
        />
        <StatCard
          label="Counseling Scheduled"
          value={toBn(dawahRows.filter((r) => r.status === "scheduled").length)}
          icon="🕒"
          accent="yellow"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="My Quran Class Schedule" />
          {quranRows.length === 0 ? (
            <EmptyState icon="📖" title="No sessions scheduled for you yet" />
          ) : (
            <ul className="divide-y divide-slate-50">
              {quranRows.map((r) => (
                <li key={r.id} className="space-y-2 px-5 py-3.5">
                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(r.scheduled_date)}
                  </p>
                  {r.note && <p className="text-xs text-slate-500">{r.note}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {(["done", "scheduled", "missed"] as const).map((s) => (
                      <form key={s} action={setQuranStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value={s} />
                        <Button
                          variant={r.status === s ? "primary" : "ghost"}
                          className="text-xs"
                        >
                          {STATUS_LABEL[s]}
                        </Button>
                      </form>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="My Dawah Counseling Sessions" />
          {dawahRows.length === 0 ? (
            <EmptyState icon="🤝" title="No sessions scheduled for you yet" />
          ) : (
            <ul className="divide-y divide-slate-50">
              {dawahRows.map((r) => (
                <li key={r.id} className="space-y-2 px-5 py-3.5">
                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(r.session_date)}
                  </p>
                  {r.counselee_note && (
                    <p className="text-xs text-slate-500">{r.counselee_note}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {(["done", "scheduled", "missed"] as const).map((s) => (
                      <form key={s} action={setDawahStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value={s} />
                        <Button
                          variant={r.status === s ? "primary" : "ghost"}
                          className="text-xs"
                        >
                          {STATUS_LABEL[s]}
                        </Button>
                      </form>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

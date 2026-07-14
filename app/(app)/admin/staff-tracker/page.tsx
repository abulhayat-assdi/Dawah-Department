import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  StatCard,
  EmptyState,
  Label,
  Input,
  Textarea,
  Select,
  Button,
} from "@/components/ui";
import { formatDate, toBn } from "@/lib/utils";
import {
  scheduleQuranSession,
  scheduleDawahSession,
  setQuranStatus,
  setDawahStatus,
  deleteQuranSession,
  deleteDawahSession,
} from "@/app/(app)/_actions/staff-tracker";
import type {
  Campus,
  DawahCounselingSession,
  Profile,
  StaffQuranSession,
} from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "🟡 Scheduled",
  done: "🟢 Done",
  missed: "🔴 Missed",
};

export default async function StaffTrackerPage() {
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

  const [{ data: campusData }, { data: staffData }] = await Promise.all([
    campusIds
      ? campusIds.length
        ? supabase.from("campuses").select("*").in("id", campusIds).order("name")
        : Promise.resolve({ data: [] as Campus[] })
      : supabase.from("campuses").select("*").order("name"),
    supabase.from("profiles").select("*").eq("role", "teacher").order("full_name"),
  ]);
  const campuses = (campusData ?? []) as Campus[];
  const staff = (staffData ?? []) as Profile[];
  const scopedCampusIds = campuses.map((c) => c.id);

  const [{ data: quranData }, { data: dawahData }] = await Promise.all([
    scopedCampusIds.length
      ? supabase
          .from("staff_quran_sessions")
          .select("*")
          .in("campus_id", scopedCampusIds)
          .order("scheduled_date", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] as StaffQuranSession[] }),
    scopedCampusIds.length
      ? supabase
          .from("dawah_counseling_sessions")
          .select("*")
          .in("campus_id", scopedCampusIds)
          .order("session_date", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] as DawahCounselingSession[] }),
  ]);
  const quranRows = (quranData ?? []) as StaffQuranSession[];
  const dawahRows = (dawahData ?? []) as DawahCounselingSession[];

  const staffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? "Unknown";
  const campusName = (id: string) => campuses.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Quran Class & Dawah Counseling Tracker"
        subtitle="Schedule and track staff members' own Quran lessons and dawah counseling sessions."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Quran — Done"
          value={toBn(quranRows.filter((r) => r.status === "done").length)}
          icon="📖"
          accent="green"
        />
        <StatCard
          label="Quran — Scheduled"
          value={toBn(quranRows.filter((r) => r.status === "scheduled").length)}
          icon="🕒"
          accent="yellow"
        />
        <StatCard
          label="Counseling — Done"
          value={toBn(dawahRows.filter((r) => r.status === "done").length)}
          icon="🤝"
          accent="green"
        />
        <StatCard
          label="Counseling — Scheduled"
          value={toBn(dawahRows.filter((r) => r.status === "scheduled").length)}
          icon="🕒"
          accent="yellow"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Staff Quran Class" subtitle="Schedule a session" />
          <form action={scheduleQuranSession} className="space-y-3 p-5">
            <div>
              <Label htmlFor="qs_staff">Staff Member</Label>
              <Select id="qs_staff" name="staff_id" required defaultValue="">
                <option value="">— Select —</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="qs_campus">Campus</Label>
                <Select id="qs_campus" name="campus_id" required defaultValue="">
                  <option value="">— Select —</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="qs_date">Date</Label>
                <Input id="qs_date" name="scheduled_date" type="date" required />
              </div>
            </div>
            <div>
              <Label htmlFor="qs_note">Note</Label>
              <Textarea id="qs_note" name="note" className="min-h-16" />
            </div>
            <Button type="submit" className="w-full">
              Schedule Quran Session
            </Button>
          </form>

          <div className="border-t border-slate-100">
            {quranRows.length === 0 ? (
              <EmptyState icon="📖" title="No Quran sessions scheduled yet" />
            ) : (
              <ul className="divide-y divide-slate-50">
                {quranRows.map((r) => (
                  <li key={r.id} className="space-y-2 px-5 py-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {staffName(r.staff_id)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {campusName(r.campus_id)} · {formatDate(r.scheduled_date)}
                        </p>
                      </div>
                      <form action={deleteQuranSession}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button variant="ghost" className="text-xs text-red-600">
                          Delete
                        </Button>
                      </form>
                    </div>
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
          </div>
        </Card>

        <Card>
          <CardHeader title="Dawah Counseling" subtitle="Schedule a session" />
          <form action={scheduleDawahSession} className="space-y-3 p-5">
            <div>
              <Label htmlFor="dc_staff">Staff Member</Label>
              <Select id="dc_staff" name="staff_id" required defaultValue="">
                <option value="">— Select —</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dc_campus">Campus</Label>
                <Select id="dc_campus" name="campus_id" required defaultValue="">
                  <option value="">— Select —</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="dc_date">Date</Label>
                <Input id="dc_date" name="session_date" type="date" required />
              </div>
            </div>
            <div>
              <Label htmlFor="dc_note">Note</Label>
              <Textarea id="dc_note" name="counselee_note" className="min-h-16" />
            </div>
            <Button type="submit" className="w-full">
              Schedule Counseling Session
            </Button>
          </form>

          <div className="border-t border-slate-100">
            {dawahRows.length === 0 ? (
              <EmptyState icon="🤝" title="No counseling sessions scheduled yet" />
            ) : (
              <ul className="divide-y divide-slate-50">
                {dawahRows.map((r) => (
                  <li key={r.id} className="space-y-2 px-5 py-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {staffName(r.staff_id)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {campusName(r.campus_id)} · {formatDate(r.session_date)}
                        </p>
                      </div>
                      <form action={deleteDawahSession}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button variant="ghost" className="text-xs text-red-600">
                          Delete
                        </Button>
                      </form>
                    </div>
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
          </div>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardHeader, StatCard, EmptyState } from "@/components/ui";
import { DashboardHero } from "@/components/dashboard-hero";
import { NoticeBoard } from "@/components/notice-board";
import { toBn, formatDate } from "@/lib/utils";
import type { CourseTrackerRow, Notice } from "@/lib/types";

interface FeedbackRow {
  id: string;
  name: string | null;
  message: string;
  created_at: string;
}

export function AdminDashboard({
  name,
  photoUrl,
  counts,
  tracker,
  feedback,
  notices,
  canManageNotices,
  noticeCampuses,
}: {
  name: string;
  photoUrl?: string | null;
  counts: { campuses: number; courses: number; teachers: number; batches: number };
  tracker: CourseTrackerRow[];
  feedback: FeedbackRow[];
  notices: Notice[];
  canManageNotices: boolean;
  noticeCampuses: { id: string; name: string }[];
}) {
  const ongoing = tracker.filter((t) => t.status === "ongoing").length;

  return (
    <div className="space-y-6">
      <DashboardHero
        name={name}
        photoUrl={photoUrl}
        fallback="Coordinator"
        subtitle="A one-glance overview of the entire Dawah Department."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Campuses" value={toBn(counts.campuses)} icon="🏛️" accent="brand" />
        <StatCard label="Courses" value={toBn(counts.courses)} icon="📚" accent="blue" />
        <StatCard label="Teachers / Members" value={toBn(counts.teachers)} icon="👥" accent="green" />
        <StatCard label="Ongoing Batches" value={toBn(ongoing)} icon="🗂️" accent="yellow" />
      </div>

      <NoticeBoard notices={notices} isAdmin={canManageNotices} campuses={noticeCampuses} />

      <Card>
        <CardHeader title="Recent Feedback & Complaints" subtitle="Received from the website" />
        {feedback.length === 0 ? (
          <EmptyState icon="📨" title="No new feedback" />
        ) : (
          <ul className="divide-y divide-slate-50">
            {feedback.map((f) => (
              <li key={f.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">
                    {f.name || "A well-wisher"}
                  </p>
                  <span className="text-xs text-slate-400">
                    {formatDate(f.created_at)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{f.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

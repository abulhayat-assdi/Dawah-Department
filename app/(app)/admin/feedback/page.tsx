import { requireProfile, allRoles } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, EmptyState, Button, Select, Input } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { formatDateTime } from "@/lib/utils";
import { markFeedbackRead, deleteFeedback } from "./actions";

interface FeedbackRow {
  id: string;
  name: string | null;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Open to every logged-in teacher, coordinator and admin so the whole team
  // can monitor community inquiries — only Super Admin/Coordinator can mark
  // messages read or delete them (see the role check below and 11_feedback_open_read.sql).
  const profile = await requireProfile();
  const roles = allRoles(profile);
  const canModerate = roles.includes("super_admin") || roles.includes("coordinator");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" ? sp.status : "";

  const supabase = await createClient();
  let query = supabase.from("feedback").select("*").order("created_at", { ascending: false });
  if (status === "unread") query = query.eq("is_read", false);
  if (status === "read") query = query.eq("is_read", true);
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,message.ilike.%${q}%`);
  const { data } = await query;
  const items = (data ?? []) as FeedbackRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback & Complaints"
        subtitle="Messages received from the website contact form."
      />

      <Card>
        <form method="get" className="grid gap-3 p-5 sm:grid-cols-[1fr_auto_auto]">
          <Input name="q" defaultValue={q} placeholder="নাম, ফোন বা বার্তা অনুসন্ধান করুন…" />
          <Select name="status" defaultValue={status}>
            <option value="">সব</option>
            <option value="unread">অপঠিত</option>
            <option value="read">পঠিত</option>
          </Select>
          <div className="flex gap-2">
            <Button type="submit">Filter</Button>
            {(q || status) && (
              <a
                href="/admin/feedback"
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear
              </a>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Inbox" subtitle={`${items.length} message(s)`} />
        {items.length === 0 ? (
          <EmptyState icon="📨" title="No messages" />
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((f) => (
              <div
                key={f.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{f.name || "A well-wisher"}</p>
                  {!f.is_read && (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                      NEW
                    </span>
                  )}
                </div>
                {f.phone && (
                  <p className="mt-0.5 text-sm text-slate-500">📞 {f.phone}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">🕒 {formatDateTime(f.created_at)}</p>
                <p className="mt-3 flex-1 whitespace-pre-wrap break-words text-sm text-slate-700">
                  {f.message}
                </p>
                {canModerate && (
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <form action={markFeedbackRead}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="is_read" value={String(!f.is_read)} />
                      <Button variant="ghost" className="text-xs">
                        {f.is_read ? "Mark unread" : "Mark read"}
                      </Button>
                    </form>
                    <DeleteButton
                      action={deleteFeedback}
                      id={f.id}
                      label="Delete"
                      className="text-xs text-red-600"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

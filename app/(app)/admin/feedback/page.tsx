import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, EmptyState, Button, Select, Input } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { formatDate } from "@/lib/utils";
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
  await requireCoordinatorOrAdmin();
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
          <ul className="divide-y divide-slate-50">
            {items.map((f) => (
              <li key={f.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {f.name || "A well-wisher"}
                      {f.phone && (
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          {f.phone}
                        </span>
                      )}
                      {!f.is_read && (
                        <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                          NEW
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{f.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(f.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface FeedbackRow {
  id: string;
  name: string | null;
  phone: string | null;
  message: string;
  created_at: string;
}

export default async function FeedbackPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  const items = (data ?? []) as FeedbackRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback & Complaints"
        subtitle="Messages received from the website contact form."
      />
      <Card>
        <CardHeader title="Inbox" subtitle={`${items.length} message(s)`} />
        {items.length === 0 ? (
          <EmptyState icon="📨" title="No messages" />
        ) : (
          <ul className="divide-y divide-slate-50">
            {items.map((f) => (
              <li key={f.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">
                    {f.name || "A well-wisher"}
                    {f.phone && (
                      <span className="ml-2 text-sm font-normal text-slate-400">
                        {f.phone}
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-slate-400">
                    {formatDate(f.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{f.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

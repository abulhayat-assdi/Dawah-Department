import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  Label,
  Input,
  Button,
  EmptyState,
} from "@/components/ui";
import { createAmaliItem, toggleAmaliItem, deleteAmaliItem } from "./actions";
import type { AmaliItem } from "@/lib/types";

export default async function AdminAmaliPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("amali_items")
    .select("*")
    .order("sequence")
    .order("created_at");
  const items = (data ?? []) as AmaliItem[];

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
                    <p
                      className={
                        it.is_active
                          ? "font-medium text-slate-800"
                          : "font-medium text-slate-400 line-through"
                      }
                    >
                      {it.title}
                    </p>
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
            <Button type="submit" className="w-full">
              যোগ করুন
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

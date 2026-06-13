import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { MessagesApp } from "@/components/messages-app";
import type { Profile } from "@/lib/types";

export default async function MessagesPage() {
  const me = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, photo_url, designation, role")
    .neq("id", me.id)
    .eq("is_active", true)
    .order("full_name");
  const people = (data ?? []) as Pick<
    Profile,
    "id" | "full_name" | "photo_url" | "designation" | "role"
  >[];

  return (
    <div className="space-y-4">
      <PageHeader title="Messages" subtitle="Real-time messaging with the team." />
      <MessagesApp
        me={{ id: me.id, full_name: me.full_name, photo_url: me.photo_url, designation: me.designation, role: me.role }}
        people={people}
      />
    </div>
  );
}

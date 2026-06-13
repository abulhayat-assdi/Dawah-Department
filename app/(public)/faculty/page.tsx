import { createClient } from "@/lib/supabase/server";
import { getContent } from "@/lib/content";
import { PublicHero } from "@/components/public-hero";
import { FacultyList } from "@/components/faculty-list";
import type { Faculty } from "@/lib/types";

export default async function FacultyPage() {
  const [f, supabase] = await Promise.all([getContent("faculty"), createClient()]);
  const { data } = await supabase
    .from("faculty")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort")
    .order("created_at");
  const members = (data ?? []) as Faculty[];

  return (
    <div>
      <PublicHero eyebrow={f.heroEyebrow} title={f.heroTitle} body={f.heroBody} />
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <FacultyList members={members} />
      </section>
    </div>
  );
}

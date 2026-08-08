import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getContent } from "@/lib/content";
import { PublicHero } from "@/components/public-hero";
import { FacultyList } from "@/components/faculty-list";
import type { Faculty } from "@/lib/types";

async function getFaculty(): Promise<Faculty[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("faculty")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort")
    .order("created_at");
  return (data ?? []) as Faculty[];
}

export default async function FacultyPage() {
  const [f, members] = await Promise.all([getContent("faculty"), getFaculty()]);

  return (
    <div>
      <PublicHero eyebrow={f.heroEyebrow} title={f.heroTitle} body={f.heroBody} />
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <FacultyList members={members} />
      </section>
    </div>
  );
}

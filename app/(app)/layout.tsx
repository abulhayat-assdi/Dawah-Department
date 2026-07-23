import { requireProfile, allRoles } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { resolveNavItems } from "@/lib/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const roles = allRoles(profile);

  // Super Admin always has every page, so skip the grants lookup entirely.
  let grants: string[] = [];
  if (!roles.includes("super_admin")) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_page_access")
      .select("href")
      .eq("profile_id", profile.id);
    grants = (data ?? []).map((g) => g.href as string);
  }

  const nav = resolveNavItems(roles, grants);

  return (
    <AppShell profile={profile} navHrefs={nav.map((item) => item.href)}>
      {children}
    </AppShell>
  );
}

import { PublicNav, PublicFooter } from "@/components/public-nav";
import { StandaloneGuard } from "@/components/standalone-guard";
import { getContent } from "@/lib/content";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getContent("site");
  return (
    // `data-public-site` is what the standalone CSS rule in globals.css hides,
    // so the app never flashes the marketing site before StandaloneGuard
    // redirects.
    <div
      data-public-site
      className="flex min-h-dvh-safe flex-col bg-[var(--background)]"
    >
      <StandaloneGuard />
      <PublicNav site={site} />
      <main className="flex-1">{children}</main>
      <PublicFooter site={site} />
    </div>
  );
}

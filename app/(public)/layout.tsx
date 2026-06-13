import { PublicNav, PublicFooter } from "@/components/public-nav";
import { getContent } from "@/lib/content";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getContent("site");
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <PublicNav site={site} />
      <main className="flex-1">{children}</main>
      <PublicFooter site={site} />
    </div>
  );
}

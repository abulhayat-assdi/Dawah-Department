import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ContentTabs } from "@/components/cms/content-tabs";
import { getContent } from "@/lib/content";

export default async function ContentPage() {
  await requireAdmin();
  const [site, home, about, academic, contact, faculty, activities] =
    await Promise.all([
      getContent("site"),
      getContent("home"),
      getContent("about"),
      getContent("academic"),
      getContent("contact"),
      getContent("faculty"),
      getContent("activities"),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public Pages Content"
        subtitle="Edit everything shown on the public website. Changes appear immediately."
      />
      <ContentTabs
        data={{ site, home, about, academic, contact, faculty, activities }}
      />
    </div>
  );
}

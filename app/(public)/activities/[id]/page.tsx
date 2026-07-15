import { redirect } from "next/navigation";

// Campus detail is now shown as an in-page tab on /activities. Old links to
// a specific campus still work, they just land on the tabbed page.
export default async function CampusPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/activities");
}

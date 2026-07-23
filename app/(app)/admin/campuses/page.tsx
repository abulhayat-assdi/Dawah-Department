import { requirePageAccess } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  Label,
  Input,
  Textarea,
  Button,
  EmptyState,
} from "@/components/ui";
import Link from "next/link";
import { FileUpload } from "@/components/file-upload";
import { createCampus, deleteCampus } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";
import type { Campus } from "@/lib/types";

export default async function CampusesPage() {
  await requirePageAccess("/admin/campuses");
  const supabase = await createClient();
  const { data } = await supabase.from("campuses").select("*").order("name");
  const campuses = (data ?? []) as Campus[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campuses & Courses"
        subtitle="Add and manage the campuses and courses of the Dawah Department."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Campus List" subtitle={`${campuses.length} total`} />
          {campuses.length === 0 ? (
            <EmptyState icon="🏛️" title="No campuses yet" />
          ) : (
            <ul className="divide-y divide-slate-50">
              {campuses.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <Link
                    href={`/admin/campuses/${c.id}`}
                    className="group flex-1 hover:opacity-80"
                  >
                    <p className="font-semibold text-slate-900 group-hover:text-brand-600">
                      {c.name} →
                    </p>
                    <p className="text-sm text-slate-500">
                      {c.address || "No address added"}
                    </p>
                  </Link>
                  <ConfirmButton
                    action={deleteCampus}
                    fields={{ id: c.id }}
                    variant="ghost"
                    triggerClassName="text-red-600"
                    title="ক্যাম্পাসটি ডিলিট করবেন?"
                    message={`"${c.name}" ক্যাম্পাসটি মুছে ফেলা হবে। এটি আর ফিরিয়ে আনা যাবে না।`}
                    confirmLabel="ডিলিট করুন"
                  >
                    Delete
                  </ConfirmButton>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="New Campus" />
          <form action={createCampus} className="space-y-4 p-5">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Kazi Bari Campus" />
            </div>
            <div>
              <Label htmlFor="slug">Slug (optional)</Label>
              <Input id="slug" name="slug" placeholder="kazibari" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="Kazi Bari, Dhaka" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
            <FileUpload
              name="image_url"
              bucket="resources"
              kind="image"
              label="Campus Image (for public site)"
            />
            <Button type="submit" className="w-full">
              Add
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  Label,
  Input,
  Textarea,
  Button,
} from "@/components/ui";
import { ROLE_LABEL } from "@/lib/constants";
import { updateProfile } from "./actions";
import type { Campus } from "@/lib/types";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: campusLinks } = await supabase
    .from("teacher_campuses")
    .select("campus_id, campuses(name)")
    .eq("teacher_id", profile.id);

  const campusNames = (campusLinks ?? [])
    .map((c) => (c.campuses as unknown as Campus | null)?.name)
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Update your portfolio information."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit p-6 text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-brand-100 text-3xl font-bold text-brand-700">
            {(profile.full_name || "U").slice(0, 1)}
          </span>
          <p className="mt-3 text-lg font-bold text-slate-900">
            {profile.full_name || "Unnamed"}
          </p>
          <p className="text-sm text-slate-500">
            {profile.designation || ROLE_LABEL[profile.role]}
          </p>
          {campusNames.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {campusNames.map((n) => (
                <span
                  key={n as string}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                >
                  {n as string}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Edit Information" />
          <form action={updateProfile} className="grid gap-4 p-5 md:grid-cols-2">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" defaultValue={profile.full_name} />
            </div>
            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                name="designation"
                defaultValue={profile.designation ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
            </div>
            <div>
              <Label htmlFor="location">Location / Hometown</Label>
              <Input id="location" name="location" defaultValue={profile.location ?? ""} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                id="photo_url"
                name="photo_url"
                type="url"
                defaultValue={profile.photo_url ?? ""}
                placeholder="https://"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="background">Background</Label>
              <Textarea
                id="background"
                name="background"
                defaultValue={profile.background ?? ""}
                className="min-h-16"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="bio">Full Bio</Label>
              <Textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

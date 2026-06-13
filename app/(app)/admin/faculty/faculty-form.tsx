"use client";

import { Button, Input, Label } from "@/components/ui";
import { FileUpload } from "@/components/file-upload";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { Faculty } from "@/lib/types";

export function FacultyForm({
  action,
  member,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  member?: Faculty;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {member && <input type="hidden" name="id" value={member.id} />}
      <FileUpload
        name="photo_url"
        bucket="avatars"
        kind="image"
        label="Photo"
        defaultUrl={member?.photo_url ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={member?.name ?? ""} />
        </div>
        <div>
          <Label htmlFor="designation">Designation (পদবি)</Label>
          <Input
            id="designation"
            name="designation"
            defaultValue={member?.designation ?? ""}
            placeholder="দাওয়াহ প্রশিক্ষক"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="location">জন্মস্থান (Birthplace)</Label>
          <Input
            id="location"
            name="location"
            defaultValue={member?.location ?? ""}
            placeholder="নোয়াখালী, বাংলাদেশ"
          />
        </div>
        <div>
          <Label htmlFor="background">ঐতিহাসিক পটভূমি (Background)</Label>
          <Input
            id="background"
            name="background"
            defaultValue={member?.background ?? ""}
            placeholder="বিখ্যাত ইসলামী ব্যক্তিত্ব..."
          />
        </div>
      </div>
      <RichTextEditor name="bio" label="সম্পূর্ণ বায়োডাটা (Full Bio)" defaultValue={member?.bio ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sort">Sort order</Label>
          <Input id="sort" name="sort" type="number" defaultValue={member?.sort ?? 0} />
        </div>
        <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={member?.featured ?? false}
            className="size-4 rounded border-slate-300"
          />
          Featured (shown large at top)
        </label>
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { FileUpload } from "@/components/file-upload";
import { createTeacher, updateTeacher } from "./actions";
import type { Campus } from "@/lib/types";
import type { MemberWithMeta } from "./types";

export function MemberForm({
  member,
  campuses,
  onSaved,
  onCancel,
}: {
  /** null = "Add New Member" mode; set = "Edit Member" mode. */
  member: MemberWithMeta | null;
  campuses: Campus[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  // Bumped after a successful create to fully remount the form (and the
  // stateful FileUpload inside it) — a plain DOM reset() can't clear
  // FileUpload's own React state.
  const [resetKey, setResetKey] = useState(0);
  const isEdit = !!member;

  async function action(formData: FormData) {
    setLoading(true);
    setMsg(null);
    const res = isEdit
      ? await updateTeacher(formData)
      : await createTeacher(formData);
    setLoading(false);
    if (res?.error) {
      setMsg({ text: res.error });
      return;
    }
    setMsg({ ok: true, text: isEdit ? "Saved." : "New member added successfully." });
    router.refresh();
    if (!isEdit) setResetKey((k) => k + 1);
    onSaved();
  }

  return (
    <form
      key={member?.id ?? `new-${resetKey}`}
      action={action}
      className="space-y-4 p-5"
    >
      {isEdit && <input type="hidden" name="id" value={member.id} />}

      <div>
        <FileUpload
          name="photo_url"
          bucket="avatars"
          kind="image"
          label="Profile Photo"
          defaultUrl={member?.photo_url}
        />
      </div>

      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          defaultValue={member?.full_name ?? ""}
          placeholder="Akram Hossain"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required={!isEdit}
            defaultValue={member?.email ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="password">
            Password {isEdit && <span className="font-normal text-slate-400">(leave blank to keep)</span>}
          </Label>
          <Input
            id="password"
            name="password"
            type="text"
            required={!isEdit}
            minLength={isEdit ? undefined : 6}
            placeholder={isEdit ? "New password (optional)" : undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue={member?.role ?? "teacher"}>
            <option value="teacher">Teacher / Member</option>
            <option value="coordinator">Campus Coordinator</option>
            <option value="super_admin">Super Admin</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="designation">Designation</Label>
          <Input
            id="designation"
            name="designation"
            defaultValue={member?.designation ?? ""}
            placeholder="Dawah Trainer"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" defaultValue={member?.phone ?? ""} />
        </div>
        <div>
          <Label htmlFor="location">Location / Address</Label>
          <Input
            id="location"
            name="location"
            defaultValue={member?.location ?? ""}
            placeholder="Dhaka, Bangladesh"
          />
        </div>
      </div>

      <div>
        <Label>Campus Assignment</Label>
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 p-3">
          {campuses.length === 0 ? (
            <span className="text-sm text-slate-400">No campuses yet</span>
          ) : (
            campuses.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="campus_ids"
                  value={c.id}
                  defaultChecked={member?.campusIds.includes(c.id) ?? false}
                  className="size-4 rounded border-slate-300"
                />
                {c.name}
              </label>
            ))
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio / Description</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={member?.bio ?? ""}
          placeholder="Short biography or intro text"
        />
      </div>

      {msg && (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving…" : isEdit ? "Save changes" : "Add Member"}
        </Button>
        {isEdit && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

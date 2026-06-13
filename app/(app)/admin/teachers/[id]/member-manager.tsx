"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  Label,
  Input,
  Textarea,
  Select,
  Button,
} from "@/components/ui";
import { FileUpload } from "@/components/file-upload";
import {
  updateTeacher,
  resetTeacherPassword,
  deleteTeacher,
  toggleTeacherActive,
} from "../actions";
import type { Campus, Profile } from "@/lib/types";

export function MemberManager({
  member,
  campuses,
  assignedIds,
}: {
  member: Profile;
  campuses: Campus[];
  assignedIds: string[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  async function saveProfile(formData: FormData) {
    setMsg(null);
    const res = await updateTeacher(formData);
    setMsg(res?.error ? { text: res.error } : { ok: true, text: "Saved." });
    router.refresh();
  }

  async function resetPw(formData: FormData) {
    setPwMsg(null);
    const res = await resetTeacherPassword(formData);
    setPwMsg(
      res?.error
        ? { text: res.error }
        : { ok: true, text: "Password updated." },
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Edit Member" subtitle="Profile, role and campuses" />
        <form action={saveProfile} className="grid gap-4 p-5 md:grid-cols-2">
          <input type="hidden" name="id" value={member.id} />

          <div className="md:col-span-2">
            <FileUpload
              name="photo_url"
              bucket="avatars"
              kind="image"
              label="Profile Photo"
              defaultUrl={member.photo_url}
            />
          </div>

          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" defaultValue={member.full_name} />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue={member.role}>
              <option value="teacher">Teacher / Member</option>
              <option value="super_admin">Super Admin</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              name="designation"
              defaultValue={member.designation ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={member.phone ?? ""} />
          </div>
          <div>
            <Label htmlFor="location">Location / Hometown</Label>
            <Input id="location" name="location" defaultValue={member.location ?? ""} />
          </div>
          <div className="md:col-span-2">
            <Label>Campuses</Label>
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
                      defaultChecked={assignedIds.includes(c.id)}
                      className="size-4 rounded border-slate-300"
                    />
                    {c.name}
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="background">Background</Label>
            <Textarea
              id="background"
              name="background"
              defaultValue={member.background ?? ""}
              className="min-h-16"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="bio">Full Bio</Label>
            <Textarea id="bio" name="bio" defaultValue={member.bio ?? ""} />
          </div>

          {msg && (
            <p
              className={`md:col-span-2 rounded-xl px-3 py-2 text-sm ${
                msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {msg.text}
            </p>
          )}
          <div className="md:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Account Controls"
          subtitle="Password, status and removal"
        />
        <div className="space-y-5 p-5">
          <form action={resetPw} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={member.id} />
            <div className="flex-1">
              <Label htmlFor="password">Set new password</Label>
              <Input
                id="password"
                name="password"
                type="text"
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>
            <Button type="submit" variant="secondary">
              Reset password
            </Button>
          </form>
          {pwMsg && (
            <p
              className={`rounded-xl px-3 py-2 text-sm ${
                pwMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {pwMsg.text}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <form action={toggleTeacherActive}>
              <input type="hidden" name="id" value={member.id} />
              <input type="hidden" name="active" value={String(member.is_active)} />
              <Button type="submit" variant="secondary">
                {member.is_active ? "Deactivate" : "Activate"}
              </Button>
            </form>

            <form
              action={deleteTeacher}
              onSubmit={(e) => {
                if (
                  !confirm(
                    "Permanently delete this member and their login? This cannot be undone.",
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={member.id} />
              <Button type="submit" variant="danger">
                Delete permanently
              </Button>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}

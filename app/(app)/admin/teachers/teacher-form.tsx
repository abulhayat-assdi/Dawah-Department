"use client";

import { useState } from "react";
import { Button, Input, Label, Select } from "@/components/ui";
import { createTeacher } from "./actions";
import type { Campus } from "@/lib/types";

export function TeacherForm({ campuses }: { campuses: Campus[] }) {
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function action(formData: FormData) {
    setLoading(true);
    setMsg(null);
    const res = await createTeacher(formData);
    setLoading(false);
    if (res?.error) setMsg({ text: res.error });
    else {
      setMsg({ ok: true, text: "New member added successfully." });
      (document.getElementById("teacher-form") as HTMLFormElement)?.reset();
    }
  }

  return (
    <form id="teacher-form" action={action} className="space-y-4 p-5">
      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input id="full_name" name="full_name" required placeholder="Akram Hossain" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="text" required minLength={6} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue="teacher">
            <option value="teacher">Teacher / Member</option>
            <option value="super_admin">Super Admin</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="designation">Designation</Label>
          <Input id="designation" name="designation" placeholder="Dawah Trainer" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Dhaka, Bangladesh" />
        </div>
      </div>
      <div>
        <Label>Campuses (hold Ctrl/⌘ to select multiple)</Label>
        <Select name="campus_ids" multiple className="min-h-28">
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
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

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating…" : "Add Member"}
      </Button>
    </form>
  );
}

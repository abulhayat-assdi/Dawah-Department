"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui";
import { RoleBadges } from "@/components/role-badges";
import { ROLE_LABEL, ALL_PAGES } from "@/lib/constants";
import type { Profile, UserRole } from "@/lib/types";
import { updateUserAccess } from "./actions";

const ROLE_OPTIONS: UserRole[] = ["super_admin", "coordinator", "teacher"];

export function AccessRow({
  profile,
  initialRoles,
  initialPages,
}: {
  profile: Profile;
  initialRoles: UserRole[];
  initialPages: string[];
}) {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<Set<UserRole>>(new Set(initialRoles));
  const [pages, setPages] = useState<Set<string>>(new Set(initialPages));
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleRole(role: UserRole) {
    setRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  function togglePage(href: string) {
    setPages((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const formData = new FormData();
    formData.set("profile_id", profile.id);
    roles.forEach((r) => formData.append("roles", r));
    pages.forEach((p) => formData.append("pages", p));
    const res = await updateUserAccess(formData);
    setSaving(false);
    setMsg(
      res.error
        ? { text: res.error }
        : { ok: true, text: "Access updated." },
    );
  }

  return (
    <div className="px-5 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <Avatar name={profile.full_name} photoUrl={profile.photo_url} size={40} />
          <div>
            <p className="font-semibold text-slate-900">
              {profile.full_name || "Unnamed"}
            </p>
            <RoleBadges roles={Array.from(roles)} />
          </div>
        </div>
        <span className="text-sm text-slate-400">{open ? "▲ Collapse" : "▼ Manage"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 rounded-xl bg-slate-50 p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Roles
            </p>
            <div className="flex flex-wrap gap-3">
              {ROLE_OPTIONS.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <input
                    type="checkbox"
                    checked={roles.has(role)}
                    onChange={() => toggleRole(role)}
                  />
                  {ROLE_LABEL[role]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Visible pages
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_PAGES.map((page) => (
                <label
                  key={page.href}
                  className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <input
                    type="checkbox"
                    checked={pages.has(page.href)}
                    onChange={() => togglePage(page.href)}
                  />
                  <span>{page.icon}</span>
                  {page.label}
                </label>
              ))}
            </div>
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

          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Access"}
          </Button>
        </div>
      )}
    </div>
  );
}

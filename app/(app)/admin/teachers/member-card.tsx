"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/avatar";
import { ROLE_LABEL } from "@/lib/constants";
import { clsx } from "@/lib/utils";
import { deleteTeacher, toggleTeacherActive } from "./actions";
import type { MemberWithMeta } from "./types";

const ROLE_TAG_STYLE: Record<string, string> = {
  super_admin: "bg-gold-100 text-brand-900",
  coordinator: "bg-blue-50 text-blue-700",
  teacher: "bg-slate-100 text-slate-600",
};

/**
 * Cosmetic member-ID badge. `profiles` has no display-id column (its PK is a
 * uuid), so we derive a stable 3-digit tag from the id purely for the visual
 * "ID: 101" badge from the reference design — it carries no meaning.
 */
function displayId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return String(100 + (hash % 900));
}

export function MemberCard({
  member,
  onEdit,
}: {
  member: MemberWithMeta;
  onEdit: () => void;
}) {
  const [bioOpen, setBioOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runDelete() {
    const fd = new FormData();
    fd.set("id", member.id);
    startTransition(async () => {
      const res = await deleteTeacher(fd);
      if (res?.error) {
        setDeleteError(res.error);
        setConfirming(false);
      }
    });
  }

  function runToggleActive() {
    const fd = new FormData();
    fd.set("id", member.id);
    fd.set("active", String(member.is_active));
    startTransition(() => {
      toggleTeacherActive(fd);
    });
  }

  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Header actions */}
      <div className="absolute right-3 top-3 flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit member"
          className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setConfirming(true);
          }}
          aria-label="Delete member"
          className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          🗑️
        </button>
      </div>

      {/* Visuals */}
      <div className="flex flex-col items-center pt-1 text-center">
        <Avatar name={member.full_name} photoUrl={member.photo_url} size={88} />
        <span className="mt-3 inline-block rounded-full bg-brand-900 px-3 py-0.5 text-xs font-bold text-white">
          ID: {displayId(member.id)}
        </span>

        {/* Identity */}
        <h3 className="mt-3 text-lg font-bold text-brand-700">
          {member.full_name || "Unnamed"}
        </h3>
        {member.designation && (
          <p className="text-sm text-slate-500">{member.designation}</p>
        )}
        <span
          className={clsx(
            "mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            ROLE_TAG_STYLE[member.role],
          )}
        >
          {ROLE_LABEL[member.role]}
        </span>
        <button
          type="button"
          onClick={runToggleActive}
          className={clsx(
            "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition",
            member.is_active
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200",
          )}
          title="Click to toggle active status"
        >
          <span
            className={clsx(
              "size-1.5 rounded-full",
              member.is_active ? "bg-green-500" : "bg-slate-400",
            )}
          />
          {member.is_active ? "Active" : "Inactive"}
        </button>
      </div>

      {/* Bio */}
      {member.bio && (
        <div className="mt-4 text-left">
          <p
            className={clsx(
              "text-sm italic leading-relaxed text-slate-500",
              !bioOpen && "line-clamp-3",
            )}
          >
            &ldquo;{member.bio}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setBioOpen((v) => !v)}
            className="mt-1 text-sm font-semibold text-brand-600 hover:underline"
          >
            {bioOpen ? "See Less ▲" : "See More ▼"}
          </button>
        </div>
      )}

      {/* Contact */}
      <div className="mt-4 space-y-2">
        {member.phone && (
          <ContactRow icon="📞" value={member.phone} />
        )}
        {member.email && (
          <ContactRow icon="✉️" value={member.email} />
        )}
      </div>

      {/* Delete confirmation */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          onClick={() => setConfirming(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-red-100 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-xl">
                ⚠️
              </span>
              <div>
                <h4 className="font-bold text-slate-900">Delete this member?</h4>
                <p className="mt-0.5 text-sm text-slate-500">
                  This permanently removes {member.full_name || "this member"}&apos;s
                  profile and login. This cannot be undone.
                </p>
              </div>
            </div>
            {deleteError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runDelete}
                disabled={isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function ContactRow({ icon, value }: { icon: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-slate-700">
        <span>{icon}</span>
        <span className="truncate">{value}</span>
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy to clipboard"
        className="shrink-0 rounded-md px-1.5 py-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
      >
        {copied ? "✅" : "📋"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button, Input, Textarea, Label, Select } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { createNotice, updateNotice, deleteNotice } from "@/app/(app)/_actions/notices";
import type { Notice } from "@/lib/types";

export function NoticeBoard({
  notices,
  isAdmin,
  campuses = [],
}: {
  notices: Notice[];
  isAdmin: boolean;
  campuses?: { id: string; name: string }[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 rounded-full bg-brand-500" />
          <h2 className="text-lg font-bold text-slate-900">Notice Board</h2>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            {notices.length} Notices
          </span>
        </div>
        {isAdmin && (
          <Button onClick={() => setAdding((v) => !v)}>+ Add Notice</Button>
        )}
      </div>

      {isAdmin && adding && (
        <form
          action={createNotice}
          onSubmit={() => setAdding(false)}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <Label htmlFor="nt">Title</Label>
            <Input id="nt" name="title" required placeholder="Notice title" />
          </div>
          <div>
            <Label htmlFor="nb">Details</Label>
            <Textarea id="nb" name="body" placeholder="Write the notice…" />
          </div>
          <div>
            <Label htmlFor="ncmp">Campus</Label>
            <Select id="ncmp" name="campus_id" defaultValue="">
              <option value="">সব ক্যাম্পাস (All Campuses)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Publish</Button>
            <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {notices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-3xl">📭</p>
          <p className="mt-2 text-sm font-medium text-slate-500">No notices yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notices.map((n) =>
            editingId === n.id ? (
              <form
                key={n.id}
                action={updateNotice}
                onSubmit={() => setEditingId(null)}
                className="space-y-3 rounded-2xl border border-brand-200 bg-white p-5 shadow-sm"
              >
                <input type="hidden" name="id" value={n.id} />
                <Input name="title" defaultValue={n.title} required />
                <Textarea name="body" defaultValue={n.body ?? ""} />
                <div>
                  <Label htmlFor={`ecmp-${n.id}`}>Campus</Label>
                  <Select id={`ecmp-${n.id}`} name="campus_id" defaultValue={n.campus_id ?? ""}>
                    <option value="">সব ক্যাম্পাস (All Campuses)</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <article
                key={n.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900">{n.title}</h3>
                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setEditingId(n.id)}
                        className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                        aria-label="Edit"
                      >
                        ✏️
                      </button>
                      <form action={deleteNotice}>
                        <input type="hidden" name="id" value={n.id} />
                        <button
                          className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete"
                        >
                          🗑️
                        </button>
                      </form>
                    </div>
                  )}
                </div>
                {n.body && (
                  <p className="mt-2 flex-1 text-sm text-slate-600">{n.body}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span>📅</span>
                    {formatDate(n.created_at)}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                    🏛️ {n.campus?.name ?? "সব ক্যাম্পাস"}
                  </span>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

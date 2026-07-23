"use client";

import { useState, useTransition } from "react";
import { Label, Input, Textarea, Button } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { downloadUrl, formatDate } from "@/lib/utils";
import type { SubmissionFile } from "@/lib/types";
import {
  updateSubmission,
  removeSubmissionFile,
  deleteSubmissionAdmin,
} from "./actions";

export interface SubmissionCardData {
  id: string;
  typeLabel: string;
  typeBg: string;
  typeText: string;
  heading: string;
  submissionDate: string;
  topic: string | null;
  comments: string | null;
  isForm: boolean;
  verifiedCount: number;
  isAdditional: boolean;
  files: SubmissionFile[];
}

export function SubmissionAdminCard({
  data,
  canManage,
}: {
  data: SubmissionCardData;
  canManage: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      await updateSubmission(formData);
      setEditing(false);
    });
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${data.typeBg} ${data.typeText}`}
          >
            {data.typeLabel}
          </span>
          {data.isAdditional && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Additional
            </span>
          )}
          <span className="text-sm font-medium text-slate-800">
            {data.heading}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {formatDate(data.submissionDate)}
        </span>
      </div>

      {editing ? (
        <form action={save} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={data.id} />
          <div>
            <Label htmlFor={`date-${data.id}`}>Date</Label>
            <Input
              id={`date-${data.id}`}
              name="submission_date"
              type="date"
              defaultValue={data.submissionDate.slice(0, 10)}
            />
          </div>
          {data.isForm && (
            <div>
              <Label htmlFor={`vc-${data.id}`}>Verified Forms</Label>
              <Input
                id={`vc-${data.id}`}
                name="verified_count"
                type="number"
                min={0}
                defaultValue={data.verifiedCount}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor={`topic-${data.id}`}>Topic</Label>
            <Input
              id={`topic-${data.id}`}
              name="topic"
              defaultValue={data.topic ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`comments-${data.id}`}>Comments</Label>
            <Textarea
              id={`comments-${data.id}`}
              name="comments"
              defaultValue={data.comments ?? ""}
              className="min-h-20"
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            {data.topic && <span>📖 {data.topic}</span>}
            {data.isForm && <span>✅ {data.verifiedCount} forms verified</span>}
          </div>
          {data.comments && (
            <p className="mt-1.5 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {data.comments}
            </p>
          )}
        </>
      )}

      {/* ----------------------------------------------------- Attachments */}
      {data.files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {data.files.map((f, i) => (
            <li
              key={`${f.url}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-base"
                >
                  📄
                </span>
                <span className="truncate text-sm font-medium text-slate-700">
                  {f.name}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View
                </a>
                <a
                  href={downloadUrl(f.url, f.name)}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  Download
                </a>
                {canManage && (
                  <ConfirmButton
                    action={removeSubmissionFile}
                    fields={{ id: data.id, url: f.url }}
                    triggerClassName="rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                    triggerAriaLabel="Delete file"
                    title="ফাইলটি ডিলিট করবেন?"
                    message="এই অ্যাটাচমেন্টটি স্থায়ীভাবে মুছে যাবে।"
                    confirmLabel="ডিলিট করুন"
                  >
                    ✕
                  </ConfirmButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ---------------------------------------------------- Admin controls */}
      {canManage && !editing && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Edit
          </button>
          <ConfirmButton
            action={deleteSubmissionAdmin}
            fields={{ id: data.id }}
            triggerClassName="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
            title="সাবমিশনটি ডিলিট করবেন?"
            message="সাবমিশন ও এর সব অ্যাটাচমেন্ট স্থায়ীভাবে মুছে যাবে।"
            confirmLabel="ডিলিট করুন"
          >
            Delete
          </ConfirmButton>
        </div>
      )}
    </li>
  );
}

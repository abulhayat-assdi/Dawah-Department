"use client";

import { useState } from "react";
import { Label, Input, Textarea, Select, Button } from "@/components/ui";
import { resourceIcon, formatFileSize } from "@/lib/resources";
import { formatDate } from "@/lib/utils";
import type { TeacherResource } from "@/lib/types";
import { ResourceDropzone } from "./resource-dropzone";
import { updateTeacherResource, deleteTeacherResource } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";

export interface CampusOption {
  id: string;
  name: string;
}

/**
 * A single owned resource: shows its details with download, and expands into an
 * edit panel (rename, edit comments, change campus, replace the file) or a
 * delete confirmation.
 */
export function ResourceItem({
  resource,
  campuses,
}: {
  resource: TeacherResource;
  campuses: CampusOption[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="p-5">
        <form
          action={updateTeacherResource}
          onSubmit={() => setEditing(false)}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={resource.id} />
          <div>
            <Label htmlFor={`name-${resource.id}`}>Resource Name</Label>
            <Input
              id={`name-${resource.id}`}
              name="name"
              required
              defaultValue={resource.name}
            />
          </div>
          <div>
            <Label htmlFor={`comments-${resource.id}`}>Comments</Label>
            <Textarea
              id={`comments-${resource.id}`}
              name="comments"
              className="min-h-16"
              defaultValue={resource.comments ?? ""}
            />
          </div>
          {campuses.length > 0 && (
            <div>
              <Label htmlFor={`campus-${resource.id}`}>Campus</Label>
              <Select
                id={`campus-${resource.id}`}
                name="campus_id"
                defaultValue={resource.campus_id ?? ""}
              >
                <option value="">— None —</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label>Replace File (optional)</Label>
            <ResourceDropzone
              teacherId={resource.teacher_id}
              defaultUrl={resource.file_url}
              defaultName={resource.file_name}
              defaultSize={resource.file_size}
              defaultType={resource.file_type}
            />
            <p className="mt-1 text-xs text-slate-400">
              Uploading a new file replaces the current one and deletes the old
              file from storage.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save changes</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="text-2xl">
          {resourceIcon(resource.file_name, resource.file_type)}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">{resource.name}</p>
          {resource.comments && (
            <p className="mt-0.5 text-sm text-slate-600">{resource.comments}</p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            {resource.file_name ? `${resource.file_name} · ` : ""}
            {formatFileSize(resource.file_size)} · Added{" "}
            {formatDate(resource.created_at)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <a
          href={resource.file_url}
          target="_blank"
          rel="noreferrer"
          download
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          ⬇ Download
        </a>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
        >
          Edit
        </button>
        <ConfirmButton
          action={deleteTeacherResource}
          fields={{ id: resource.id }}
          triggerClassName="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
          title="রিসোর্সটি ডিলিট করবেন?"
          message={`"${resource.name}" রিসোর্সটি মুছে ফেলা হবে।`}
          confirmLabel="ডিলিট করুন"
        >
          Delete
        </ConfirmButton>
      </div>
    </li>
  );
}

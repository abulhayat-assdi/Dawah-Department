"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SubmissionFile } from "@/lib/types";

/**
 * Uploads any number of files to a Supabase Storage bucket and keeps the
 * resulting `{ url, name }` list in a hidden input (as JSON) so the surrounding
 * server-action form submits them like a normal field. Files can be added in
 * batches and removed individually before the form is submitted.
 */
export function MultiFileUpload({
  name,
  bucket,
  maxSizeMB,
  label,
}: {
  /** Hidden input name; receives `JSON.stringify(SubmissionFile[])`. */
  name: string;
  bucket: string;
  /** Client-side per-file size cap in MB. */
  maxSizeMB?: number;
  label?: string;
}) {
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const uploaded: SubmissionFile[] = [];
    for (const file of picked) {
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        setError(`"${file.name}" is too large (max ${maxSizeMB} MB).`);
        continue;
      }
      try {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, name: file.name });
      } catch {
        setError(`Failed to upload "${file.name}". Try again.`);
      }
    }
    if (uploaded.length) setFiles((prev) => [...prev, ...uploaded]);
    setBusy(false);
    // Reset so picking the same file again re-triggers onChange.
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      {label && (
        <p className="mb-1.5 block text-sm font-medium text-slate-700">{label}</p>
      )}
      <input type="hidden" name={name} value={JSON.stringify(files)} readOnly />

      {files.length > 0 && (
        <ul className="mb-2.5 space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.url}-${i}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                <span aria-hidden>📎</span>
                <span className="truncate">{f.name}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-100"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? "Uploading…" : files.length ? "Add more files" : "Upload files"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}

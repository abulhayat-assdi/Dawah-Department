"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";

/**
 * Uploads a file to a Supabase Storage bucket (browser client) and writes the
 * resulting public URL into a hidden input so the surrounding server-action
 * form submits it like any normal field. Used for profile photos, CMS images
 * and Resource Center files.
 */
export function FileUpload({
  name,
  nameField,
  bucket,
  kind = "image",
  defaultUrl = "",
  label,
  maxSizeMB,
  onChange,
}: {
  name?: string;
  /** When set, the original file name is written to a hidden input of this name. */
  nameField?: string;
  bucket: string;
  kind?: "image" | "file";
  defaultUrl?: string | null;
  label?: string;
  /** Client-side size cap in MB; rejects larger files before uploading. */
  maxSizeMB?: number;
  onChange?: (url: string) => void;
}) {
  const [url, setUrl] = useState<string>(defaultUrl ?? "");
  const [fileName, setFileName] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large (max ${maxSizeMB} MB).`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "bin";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
      setFileName(file.name);
      onChange?.(data.publicUrl);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {label && (
        <p className="mb-1.5 block text-sm font-medium text-slate-700">{label}</p>
      )}
      {name && <input type="hidden" name={name} value={url} />}
      {nameField && <input type="hidden" name={nameField} value={fileName} />}
      <div className="flex items-center gap-3">
        {kind === "image" ? (
          <Avatar photoUrl={url} size={56} />
        ) : (
          url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm font-medium text-brand-600 hover:underline"
            >
              📎 {fileName || "Uploaded file"}
            </a>
          )
        )}
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy ? "Uploading…" : kind === "image" ? "Upload photo" : "Upload file"}
          </button>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={kind === "image" ? "image/*" : undefined}
          onChange={onPick}
          className="hidden"
        />
      </div>
    </div>
  );
}

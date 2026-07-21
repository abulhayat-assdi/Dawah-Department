"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_RESOURCE_SIZE_MB,
  RESOURCE_ACCEPT,
  isAllowedResource,
  resourceIcon,
  formatFileSize,
} from "@/lib/resources";

/**
 * Drag-and-drop (or click) uploader for the Resource Center. Uploads the picked
 * file straight to the `teacher-resources` bucket and mirrors the result into
 * hidden inputs (file_url / file_path / file_name / file_size / file_type) so
 * the surrounding Server-Action form submits it like any normal field.
 *
 * `file_path` is the storage object key — the server needs it to delete the old
 * object when a file is replaced.
 */
export function ResourceDropzone({
  teacherId,
  defaultUrl = "",
  defaultName = "",
  defaultSize = null,
  defaultType = "",
  required = false,
}: {
  /** Used as the storage path prefix so each teacher's files are grouped. */
  teacherId: string;
  defaultUrl?: string | null;
  defaultName?: string | null;
  defaultSize?: number | null;
  defaultType?: string | null;
  required?: boolean;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [path, setPath] = useState("");
  const [fileName, setFileName] = useState(defaultName ?? "");
  const [fileSize, setFileSize] = useState<number | null>(defaultSize ?? null);
  const [fileType, setFileType] = useState(defaultType ?? "");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    // --- Client-side guards (mirrored in the Server Action) ------------------
    if (!isAllowedResource(file.name)) {
      setError("Unsupported file type. Allowed: image, PDF, Word, Excel, PowerPoint.");
      return;
    }
    if (file.size > MAX_RESOURCE_SIZE_MB * 1024 * 1024) {
      setError(
        `File is too large (${formatFileSize(file.size)}). Maximum is ${MAX_RESOURCE_SIZE_MB} MB.`,
      );
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "bin";
      const objectPath = `${teacherId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("teacher-resources")
        .upload(objectPath, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage
        .from("teacher-resources")
        .getPublicUrl(objectPath);
      setUrl(data.publicUrl);
      setPath(objectPath);
      setFileName(file.name);
      setFileSize(file.size);
      setFileType(file.type);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const hasFile = Boolean(url);

  return (
    <div>
      {/* Hidden fields consumed by the server action */}
      <input type="hidden" name="file_url" value={url} />
      <input type="hidden" name="file_path" value={path} />
      <input type="hidden" name="file_name" value={fileName} />
      <input type="hidden" name="file_size" value={fileSize ?? ""} />
      <input type="hidden" name="file_type" value={fileType} />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-slate-100"
        }`}
      >
        {busy ? (
          <p className="text-sm font-medium text-slate-500">Uploading…</p>
        ) : hasFile ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{resourceIcon(fileName, fileType)}</span>
            <div className="text-left">
              <p className="max-w-[16rem] truncate text-sm font-semibold text-slate-800">
                {fileName || "Uploaded file"}
              </p>
              <p className="text-xs text-slate-500">
                {formatFileSize(fileSize)} · Click or drop to replace
              </p>
            </div>
          </div>
        ) : (
          <>
            <span className="text-2xl">⬆️</span>
            <p className="text-sm font-medium text-slate-600">
              Drag &amp; drop a file here, or click to browse
            </p>
            <p className="text-xs text-slate-400">
              Images, PDF, Word, Excel, PowerPoint · up to {MAX_RESOURCE_SIZE_MB} MB
            </p>
          </>
        )}
      </div>

      {/* Keeps native "required" semantics for the create form. */}
      {required && (
        <input
          type="text"
          value={url}
          required
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
        />
      )}

      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={RESOURCE_ACCEPT}
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="hidden"
      />
    </div>
  );
}

// Shared constants & helpers for the Teacher-wise Resource Center.
// Kept framework-agnostic so both the browser uploader and the server
// validation in the Server Actions stay in lockstep.

/** Per-file upload cap, enforced on the client, in the Server Action, and by
 *  the storage bucket's `file_size_limit`. */
export const MAX_RESOURCE_SIZE_MB = 50;

/** Allowed extensions: Images, PDF, Word, Excel, PowerPoint. */
export const ALLOWED_RESOURCE_EXT = [
  "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp",
  "pdf",
  "doc", "docx",
  "xls", "xlsx", "csv",
  "ppt", "pptx",
] as const;

/** `accept` attribute for the file input. */
export const RESOURCE_ACCEPT =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx";

/** Lowercased extension of a file name (without the dot), or "". */
export function extOf(fileName: string | null | undefined): string {
  if (!fileName) return "";
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/** True when the file name has one of the allowed extensions. */
export function isAllowedResource(fileName: string | null | undefined): boolean {
  return (ALLOWED_RESOURCE_EXT as readonly string[]).includes(extOf(fileName));
}

/** Emoji icon for a resource, chosen from its extension / MIME type. */
export function resourceIcon(
  fileName: string | null | undefined,
  fileType?: string | null,
): string {
  const ext = extOf(fileName);
  if (fileType?.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext))
    return "🖼️";
  if (ext === "pdf") return "📕";
  if (["doc", "docx"].includes(ext)) return "📘";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📗";
  if (["ppt", "pptx"].includes(ext)) return "📙";
  return "📄";
}

/** Human-readable file size, e.g. "2.4 MB". */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

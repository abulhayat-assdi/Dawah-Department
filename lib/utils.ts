import type { SubmissionFile } from "./types";

/** Tiny classnames helper (avoids a dependency). */
export function clsx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Legacy numeral formatter — the UI is English now, so this just returns the
 * value as a string. Kept so existing call sites stay valid.
 */
export function toBn(value: number | string): string {
  return String(value);
}

/** Formats a "YYYY-MM" month key as e.g. "August 2026". */
export function formatMonth(key?: string | null): string {
  if (!key) return "—";
  const [y, m] = key.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return "—";
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${MONTHS[m - 1]} ${y}`;
}

/**
 * Builds the month dropdown options shared across Task Management & Task Report.
 *
 * The list runs, newest-first, from `monthsAhead` months in the future down to
 * the earliest month that actually holds data (`startMonth`, a "YYYY-MM" key):
 *   next months (for assigning ahead) → current month → previous data months.
 *
 * `startMonth` is never allowed past the current month, and when it's missing
 * (no data yet) the past side collapses to just the current month.
 */
export function monthOptions(
  startMonth?: string | null,
  monthsAhead = 2,
): { value: string; label: string }[] {
  const now = new Date();
  // Absolute month index (year * 12 + zero-based month) makes range math simple.
  const currentIdx = now.getFullYear() * 12 + now.getMonth();
  const endIdx = currentIdx + monthsAhead;

  let startIdx = currentIdx;
  if (startMonth) {
    const [y, m] = startMonth.split("-").map(Number);
    if (y && m >= 1 && m <= 12) {
      const candidate = y * 12 + (m - 1);
      if (candidate < startIdx) startIdx = candidate;
    }
  }

  const options: { value: string; label: string }[] = [];
  for (let idx = endIdx; idx >= startIdx; idx--) {
    const value = `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
    options.push({ value, label: formatMonth(value) });
  }
  return options;
}

/** Formats a Postgres time ("HH:MM" or "HH:MM:SS") as e.g. "9:00 AM". */
export function formatTime(t?: string | null): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  if (Number.isNaN(h)) return "";
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(Number.isNaN(m) ? 0 : m).padStart(2, "0")} ${ampm}`;
}

/** Trims a Postgres time value down to "HH:MM" for <input type="time">. */
export function toTimeInput(t?: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  if (h === undefined || m === undefined) return "";
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

/** Formats an ISO date as a dd/mm/yyyy string. */
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Formats an ISO timestamp as a dd/mm/yyyy, h:mm AM/PM string. */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const h = d.getHours();
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(iso)}, ${h12}:${mm} ${ampm}`;
}

/**
 * Strips HTML tags and control characters from user-submitted free text
 * before it's stored. Defence-in-depth for the public contact form: React
 * already escapes text when rendering it, but this keeps raw `<script>`-style
 * payloads out of the database entirely so every future reader (exports,
 * emails, other views) stays safe by default.
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim();
}

/**
 * Normalises a submission's attachments into a single list, merging the newer
 * multi-file `files` column with the legacy single `file_url` / `file_name`
 * pair (used by older rows and the Form-Verification upload). Deduplicates by
 * URL so a legacy row mirrored into both never shows twice.
 */
export function submissionFiles(s: {
  files?: unknown;
  file_url?: string | null;
  file_name?: string | null;
}): SubmissionFile[] {
  const list: SubmissionFile[] = [];
  if (Array.isArray(s.files)) {
    for (const f of s.files) {
      if (f && typeof f === "object" && typeof (f as SubmissionFile).url === "string") {
        list.push({
          url: (f as SubmissionFile).url,
          name: String((f as SubmissionFile).name ?? "File"),
        });
      }
    }
  }
  if (s.file_url && !list.some((f) => f.url === s.file_url)) {
    list.push({ url: s.file_url, name: s.file_name || "Attachment" });
  }
  return list;
}

/**
 * Appends Supabase Storage's `?download=<name>` param to a public URL so the
 * browser saves the file (Content-Disposition: attachment) instead of opening
 * it — works even cross-origin, where the plain `download` attribute is ignored.
 */
export function downloadUrl(url: string, name?: string | null): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}download=${encodeURIComponent(name || "")}`;
}

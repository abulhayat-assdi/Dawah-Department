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

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

/** Formats an ISO date as a dd/mm/yyyy string. */
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

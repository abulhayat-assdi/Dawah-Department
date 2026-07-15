import { clsx } from "@/lib/utils";

/**
 * Renders admin-authored HTML on public pages. Authors are trusted super-admins;
 * we still defensively strip <script>/<style> and on* event-handler attributes.
 */
function sanitize(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(iframe|object|embed)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

export function RichText({
  html,
  className,
}: {
  html?: string | null;
  className?: string;
}) {
  if (!html) return null;
  return (
    <div
      className={clsx(
        "prose prose-slate max-w-none [&_h2]:font-bold [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-brand-600 [&_a]:underline",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}

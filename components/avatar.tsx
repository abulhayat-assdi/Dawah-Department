import { clsx } from "@/lib/utils";

/**
 * Profile avatar — shows the photo when available, otherwise the name initial.
 * Server-safe (plain img) so it works in both server and client components.
 */
export function Avatar({
  name,
  photoUrl,
  size = 36,
  className,
}: {
  name?: string | null;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name || "U").slice(0, 1).toUpperCase();
  const style = { width: size, height: size };

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name || "User"}
        style={style}
        className={clsx("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      style={{ ...style, fontSize: size * 0.42 }}
      className={clsx(
        "grid shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700",
        className,
      )}
    >
      {initial}
    </span>
  );
}

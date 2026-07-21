import { clsx } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

const ROLE_BADGE_STYLE: Record<UserRole, string> = {
  super_admin: "bg-gold-100 text-brand-800",
  coordinator: "bg-brand-50 text-brand-700",
  teacher: "bg-slate-100 text-slate-600",
};

export function RoleBadges({
  roles,
  className,
}: {
  roles: UserRole[];
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-wrap items-center gap-1", className)}>
      {roles.map((role) => (
        <span
          key={role}
          className={clsx(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            ROLE_BADGE_STYLE[role],
          )}
        >
          {ROLE_LABEL[role]}
        </span>
      ))}
    </div>
  );
}

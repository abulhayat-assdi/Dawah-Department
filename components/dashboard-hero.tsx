import { HeroClock } from "@/components/datetime";
import { Avatar } from "@/components/avatar";

/** Green gradient welcome banner shown at the top of the dashboard. */
export function DashboardHero({
  name,
  subtitle,
  photoUrl,
  fallback = "Coordinator",
}: {
  name: string;
  subtitle: string;
  photoUrl?: string | null;
  fallback?: string;
}) {
  const displayName = name?.trim() || fallback;
  return (
    <div className="brand-showcase relative overflow-hidden rounded-3xl px-6 py-10 text-center shadow-sm sm:py-12">
      {photoUrl && (
        <div className="mb-3 flex justify-center">
          <Avatar
            name={displayName}
            photoUrl={photoUrl}
            size={72}
            className="ring-4 ring-white/30"
          />
        </div>
      )}
      <p className="text-sm font-medium text-gold-200">Assalamu Alaikum,</p>
      <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
        {displayName}
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm text-brand-50/90">{subtitle}</p>
      <HeroClock />
    </div>
  );
}

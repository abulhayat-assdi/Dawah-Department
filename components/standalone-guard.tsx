"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps the public marketing site out of the installed app.
 *
 * The manifest's `scope` has to stay "/" (see app/manifest.ts), so a link to
 * /about or /faculty opened from the home-screen app would otherwise render
 * the marketing site inside the app window. Mounted in the (public) layout,
 * this sends those launches to the portal instead.
 *
 * It only ever fires in a standalone window — in an ordinary browser tab the
 * public site behaves exactly as before.
 */
export function StandaloneGuard() {
  const router = useRouter();

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari predates display-mode and exposes its own flag.
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (standalone) router.replace("/dashboard");
  }, [router]);

  return null;
}

import type { MetadataRoute } from "next";

/**
 * Web app manifest, served at /manifest.webmanifest.
 *
 * This is what makes the site installable ("Add to Home screen") and what
 * makes it launch chrome-less, like a native app. Note that `proxy.ts` must
 * keep this path out of its matcher — the Supabase guard would otherwise
 * bounce the (credential-less) manifest request to /login and the browser
 * would silently refuse to offer installation.
 *
 * The installed app is the staff portal only; the public marketing site is
 * kept out of it by `start_url` plus the standalone guard in
 * `components/standalone-guard.tsx`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Dawah Department — ASSDI Management System",
    short_name: "ADIMS",
    description:
      "Course progress, member activity and reporting for the Dawah Department of As-Sunnah Skill Development Institute (ASSDI).",
    lang: "bn",
    dir: "ltr",
    // Launching the app lands on the portal, never the marketing site. A
    // signed-in member goes straight in; anyone else is bounced to /login by
    // the proxy and returned here afterwards.
    start_url: "/dashboard",
    // Scope has to stay "/" even though the app is portal-only: the portal's
    // routes (/dashboard, /admin/*, /my/*, /routine) and /login share no
    // deeper prefix, and anything outside scope would be kicked out to the
    // browser — including the login screen.
    scope: "/",
    display: "standalone",
    // minimal-ui is the graceful fallback where standalone is unsupported.
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#f3f8f4",
    theme_color: "#0b5d3a",
    categories: ["education", "productivity"],
    // Reuse the running window instead of spawning a second one on relaunch.
    launch_handler: { client_mode: "navigate-existing" },
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops these to its own shape, so they are drawn full-bleed
      // with the mark held inside the central 80% safe zone.
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Long-press the installed icon to jump straight into a section. These
    // three are deliberately pages every role can reach; Dashboard is omitted
    // because it is already what start_url opens.
    shortcuts: [
      {
        name: "My Tasks",
        short_name: "Tasks",
        url: "/my/tasks",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Campus Routine",
        short_name: "Routine",
        url: "/routine",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "My Profile",
        short_name: "Profile",
        url: "/my/profile",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}

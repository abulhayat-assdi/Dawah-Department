import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16: using Edge Middleware instead of Node.js proxy to support Cloudflare
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets, image optimization and the PWA
    // files. The PWA exclusions matter: the browser fetches sw.js, the manifest
    // and the offline page without a session, so the auth guard below would
    // redirect them to /login and the app would silently stop being
    // installable.
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|offline\\.html|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

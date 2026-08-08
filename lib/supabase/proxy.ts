import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./env";

/** Routes the marketing site serves without a session (incl. sub-paths). */
const PUBLIC_PREFIXES = ["/about", "/faculty", "/academic", "/activities", "/contact"];

function isPublicPath(path: string) {
  return (
    path === "/" ||
    path === "/login" ||
    path.startsWith("/auth") ||
    PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))
  );
}

/**
 * Refreshes the Supabase auth session on every request and guards routes.
 * Called from the root `proxy.ts` (the Next.js 16 replacement for middleware).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // Without credentials we cannot resolve a session. Throwing here would 500
  // *every* route (the proxy matcher covers the whole site), so instead let the
  // public pages render and send anything protected to /login.
  if (!isSupabaseConfigured) {
    console.error(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — " +
        "auth is disabled and protected routes redirect to /login. Set them in the " +
        "deployment environment and rebuild.",
    );
    if (isPublicPath(path)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = isPublicPath(path);

  // Unauthenticated users hitting a protected route → /login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Authenticated users hitting /login → dashboard
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

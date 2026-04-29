import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseConfigured, getSupabaseConfig } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isDashboardRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isApiRoute = pathname === "/api" || pathname.startsWith("/api/");
  const isLeadFallbackRoute =
    pathname === "/dashboard/leads" ||
    pathname.startsWith("/dashboard/leads/") ||
    pathname === "/api/leads" ||
    pathname.startsWith("/api/leads/");
  const isProtectedRoute = isDashboardRoute || isApiRoute;

  if (!isSupabaseConfigured()) {
    if (isLeadFallbackRoute) {
      return NextResponse.next({ request });
    }

    if (isApiRoute) {
      return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
    }

    if (isDashboardRoute) {
      return NextResponse.redirect(new URL("/login?error=supabase-not-configured", request.url));
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (isProtectedRoute && !user) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

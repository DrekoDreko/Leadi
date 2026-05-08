import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseConfigured, getSupabaseConfig } from "@/lib/supabase/config";
import { normalizeWorkspaceRole, isWorkspaceManagerRole } from "@/lib/workspaces/permissions";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isDashboardRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isProfileSetupRoute = pathname === "/onboarding/profile-setup";
  const isTeamRoute = pathname === "/team" || pathname.startsWith("/team/");
  const isInviteRoute = pathname === "/invite" || pathname.startsWith("/invite/");
  const isApiRoute = pathname === "/api" || pathname.startsWith("/api/");
  const isLeadWebhookRoute = pathname === "/api/webhooks/leads";
  const isMetaWebhookRoute = pathname === "/api/meta/webhook";
  const isImportRoute = pathname === "/dashboard/importar" || pathname.startsWith("/dashboard/importar/");
  const isCreateTeamRoute =
    pathname === "/dashboard/criar-equipe" || pathname.startsWith("/dashboard/criar-equipe/");
  const isProtectedRoute =
    isDashboardRoute ||
    isOnboardingRoute ||
    isTeamRoute ||
    isInviteRoute ||
    (isApiRoute && !isLeadWebhookRoute && !isMetaWebhookRoute);

  if (isLeadWebhookRoute || isMetaWebhookRoute) {
    return NextResponse.next({ request });
  }

  if (!isSupabaseConfigured()) {
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

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, profile_setup_completed, organization_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Perfil nao encontrado." }, { status: 403 });
    }

    if (isProtectedRoute && !isProfileSetupRoute && !isInviteRoute) {
      return NextResponse.redirect(new URL("/onboarding/profile-setup", request.url));
    }

    return response;
  }

  const { data: workspace } = await supabase
    .from("organizations")
    .select("type")
    .eq("id", profile.organization_id)
    .maybeSingle();

  const profileSetupCompleted = profile.profile_setup_completed;
  const role = normalizeWorkspaceRole(profile.role);
  const isManager = isWorkspaceManagerRole(role);
  const workspaceType = workspace?.type === "team" ? "team" : "solo";

  if (isProtectedRoute && !profileSetupCompleted && !isProfileSetupRoute && !isInviteRoute) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Configuracao inicial pendente." }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/onboarding/profile-setup", request.url));
  }

  if (profileSetupCompleted && isProfileSetupRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isTeamRoute && !isManager) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isImportRoute && !isManager && workspaceType !== "solo") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isCreateTeamRoute && !(role === "owner" && workspaceType === "solo")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

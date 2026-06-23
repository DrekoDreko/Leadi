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
  const isPlansRoute = pathname === "/onboarding/plans";
  const isTeamRoute = pathname === "/team" || pathname.startsWith("/team/");
  const isInviteRoute = pathname === "/invite" || pathname.startsWith("/invite/");
  const isApiRoute = pathname === "/api" || pathname.startsWith("/api/");
  const isLeadWebhookRoute = pathname === "/api/webhooks/leads";
  const isMetaWebhookRoute = pathname === "/api/meta/webhook";
  const isMetaDataDeletionRoute = pathname === "/api/meta/data-deletion";
  const isMetaCallbackRoute = pathname === "/api/integrations/meta/callback";
  // Rotas internas chamadas por agendadores (cron) sem sessao de usuario. Elas
  // se autenticam sozinhas via segredo compartilhado (ex.: CRON_SECRET), entao
  // nao passam pelo gate de sessao do middleware.
  const isInternalCronRoute = pathname.startsWith("/api/internal/");
  const isImportRoute = pathname === "/dashboard/importar" || pathname.startsWith("/dashboard/importar/");
  const isCreateTeamRoute =
    pathname === "/dashboard/criar-equipe" || pathname.startsWith("/dashboard/criar-equipe/");
  const isCheckoutRoute = pathname === "/checkout" || pathname.startsWith("/checkout/");
  const isProtectedRoute =
    isDashboardRoute ||
    isOnboardingRoute ||
    isTeamRoute ||
    isInviteRoute ||
    isCheckoutRoute ||
    (isApiRoute &&
      !isLeadWebhookRoute &&
      !isMetaWebhookRoute &&
      !isMetaDataDeletionRoute &&
      !isMetaCallbackRoute &&
      !isInternalCronRoute);

  if (isLeadWebhookRoute || isMetaWebhookRoute || isMetaDataDeletionRoute || isInternalCronRoute) {
    const response = NextResponse.next({ request });
    applySecurityHeaders(request, response);
    return response;
  }

  if (!isSupabaseConfigured()) {
    const response = NextResponse.next({ request });
    applySecurityHeaders(request, response);
    return response;
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
        const unauthorizedResponse = NextResponse.json(
          { error: "Usuario nao autenticado." },
          { status: 401 }
        );
        applySecurityHeaders(request, unauthorizedResponse);
        return unauthorizedResponse;
      }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);

    const redirectResponse = NextResponse.redirect(loginUrl);
    applySecurityHeaders(request, redirectResponse);
    return redirectResponse;
  }

  if (!user) {
    applySecurityHeaders(request, response);
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, profile_setup_completed, organization_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    if (isApiRoute) {
      const forbiddenResponse = NextResponse.json(
        { error: "Perfil nao encontrado." },
        { status: 403 }
      );
      applySecurityHeaders(request, forbiddenResponse);
      return forbiddenResponse;
    }

    if (isProtectedRoute && !isOnboardingRoute && !isInviteRoute) {
      const redirectResponse = NextResponse.redirect(
        new URL("/onboarding/plans", request.url)
      );
      applySecurityHeaders(request, redirectResponse);
      return redirectResponse;
    }

    applySecurityHeaders(request, response);
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

  if (isProtectedRoute && !profileSetupCompleted && !isOnboardingRoute && !isInviteRoute) {
    if (isApiRoute) {
      const pendingSetupResponse = NextResponse.json(
        { error: "Configuracao inicial pendente." },
        { status: 403 }
      );
      applySecurityHeaders(request, pendingSetupResponse);
      return pendingSetupResponse;
    }

    const redirectResponse = NextResponse.redirect(
      new URL("/onboarding/plans", request.url)
    );
    applySecurityHeaders(request, redirectResponse);
    return redirectResponse;
  }

  // Onboarding ja concluido: nao deixa voltar para a escolha de plano.
  // As demais telas de onboarding (atribuicoes / wizard de equipe) seguem
  // acessiveis para o usuario terminar o fluxo guiado.
  if (profileSetupCompleted && (isPlansRoute || isProfileSetupRoute)) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    applySecurityHeaders(request, redirectResponse);
    return redirectResponse;
  }

  if (isTeamRoute && !isManager) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    applySecurityHeaders(request, redirectResponse);
    return redirectResponse;
  }

  if (isImportRoute && !isManager && workspaceType !== "solo") {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    applySecurityHeaders(request, redirectResponse);
    return redirectResponse;
  }

  if (isCreateTeamRoute && !(role === "owner" && workspaceType === "solo")) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    applySecurityHeaders(request, redirectResponse);
    return redirectResponse;
  }

  applySecurityHeaders(request, response);
  return response;
}

function applySecurityHeaders(request: NextRequest, response: NextResponse) {
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join("; ")
  );
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  if (
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto")?.toLowerCase() === "https"
  ) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

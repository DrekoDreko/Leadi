import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { importGoogleAvatarIfMissing } from "@/lib/auth/google-avatar";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (code && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(buildLoginErrorPath("oauth-callback-failed", next), requestUrl.origin)
      );
    }

    // Login OAuth (ex.: Google) ok: se o cliente ainda nao tem foto, puxa a do
    // provedor para o nosso bucket. Best-effort, nunca bloqueia o redirect.
    await importGoogleAvatarIfMissing(supabase);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function getSafeRedirectPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function buildLoginErrorPath(error: string, next: string) {
  const searchParams = new URLSearchParams({ error, mode: "login" });

  if (next !== "/dashboard") {
    searchParams.set("next", next);
  }

  return `/login?${searchParams.toString()}`;
}

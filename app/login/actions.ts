"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const next = getSafeRedirectPath(formData.get("next"));

  if (!isSupabaseConfigured()) {
    redirect(buildLoginErrorUrl("supabase-not-configured", next, "login"));
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth
    .signInWithPassword({ email, password })
    .catch(() => ({ error: { message: "auth-unavailable" } }));

  if (error) {
    const errorCode = error.message === "auth-unavailable"
      ? "auth-unavailable"
      : "invalid-credentials";

    redirect(buildLoginErrorUrl(errorCode, next, "login"));
  }

  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const next = getSafeRedirectPath(formData.get("next"));

  if (!isSupabaseConfigured()) {
    redirect(buildLoginErrorUrl("supabase-not-configured", next, "signup"));
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth
    .signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split("@")[0]
        }
      }
    })
    .catch(() => ({ error: { message: "auth-unavailable" } }));

  if (error) {
    const errorCode = error.message === "auth-unavailable"
      ? "auth-unavailable"
      : "signup-failed";

    redirect(buildLoginErrorUrl(errorCode, next, "signup"));
  }

  redirect(next);
}

export async function signInWithGoogleAction(formData: FormData) {
  const next = getSafeRedirectPath(formData.get("next"));
  const mode = getAuthMode(formData.get("mode"));

  if (!isSupabaseConfigured()) {
    redirect(buildLoginErrorUrl("supabase-not-configured", next, mode));
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);

  const { data, error } = await supabase.auth
    .signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString()
      }
    })
    .catch(() => ({
      data: { provider: "google" as const, url: null },
      error: { message: "auth-unavailable" }
    }));

  if (error || !data.url) {
    const errorCode = error?.message === "auth-unavailable"
      ? "auth-unavailable"
      : "oauth-failed";

    redirect(buildLoginErrorUrl(errorCode, next, mode));
  }

  redirect(data.url);
}

function getSafeRedirectPath(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function getAuthMode(value: FormDataEntryValue | null) {
  return value === "signup" ? "signup" : "login";
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

function buildLoginErrorUrl(error: string, next: string, mode: "login" | "signup") {
  const searchParams = new URLSearchParams({ error, mode });

  if (next !== "/dashboard") {
    searchParams.set("next", next);
  }

  return `/login?${searchParams.toString()}`;
}

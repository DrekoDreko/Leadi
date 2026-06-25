"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCallbackOrigin } from "@/lib/site/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertActionRateLimit } from "@/lib/api/action-security";
import { RateLimitError } from "@/lib/rate-limit";
import { assertDeliverableEmail } from "@/lib/auth/email-validation";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export async function signInAction(formData: FormData) {
  const next = getSafeRedirectPath(formData.get("next"));

  if (!isSupabaseConfigured()) {
    redirect(buildLoginErrorUrl("supabase-not-configured", next, "login"));
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (email.length > 320 || password.length > 200) {
    redirect(buildLoginErrorUrl("invalid-credentials", next, "login"));
  }

  try {
    // Protege contra brute force por IP e contra ataque direcionado a uma conta.
    await assertActionRateLimit({
      keyPrefix: "action-signin-ip",
      limit: 5,
      windowMs: RATE_LIMIT_WINDOW_MS
    });
    if (email) {
      await assertActionRateLimit({
        keyPrefix: "action-signin-email",
        limit: 10,
        windowMs: 10 * RATE_LIMIT_WINDOW_MS,
        suffix: email.toLowerCase()
      });
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect(buildLoginErrorUrl("too-many-requests", next, "login"));
    }
    throw error;
  }

  const captchaToken = getCaptchaToken(formData);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth
    .signInWithPassword({ email, password, options: { captchaToken } })
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
  const next = getPostSignupRedirectPath(formData.get("next"));

  if (!isSupabaseConfigured()) {
    redirect(buildLoginErrorUrl("supabase-not-configured", next, "signup"));
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim().slice(0, 160);

  if (email.length > 320 || password.length > 200) {
    redirect(buildLoginErrorUrl("signup-failed", next, "signup"));
  }

  try {
    await assertActionRateLimit({
      keyPrefix: "action-signup-ip",
      limit: 3,
      windowMs: RATE_LIMIT_WINDOW_MS
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect(buildLoginErrorUrl("too-many-requests", next, "signup"));
    }
    throw error;
  }

  // Camada anti-bot/anti-conta-falsa (a confirmacao por e-mail esta pausada):
  // bloqueia dominios descartaveis e dominios que nao recebem e-mail.
  const emailCheck = await assertDeliverableEmail(email);
  if (!emailCheck.ok) {
    const code =
      emailCheck.reason === "disposable"
        ? "disposable-email"
        : emailCheck.reason === "undeliverable"
          ? "invalid-email-domain"
          : "signup-failed";

    redirect(buildLoginErrorUrl(code, next, "signup"));
  }

  const captchaToken = getCaptchaToken(formData);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth
    .signUp({
      email,
      password,
      options: {
        captchaToken,
        data: {
          full_name: fullName || email.split("@")[0]
        }
      }
    })
    .catch(() => ({ error: { message: "auth-unavailable" } }));

  if (error) {
    redirect(buildLoginErrorUrl(mapSignUpErrorCode(error), next, "signup"));
  }

  redirect(next);
}

export async function requestPasswordResetAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login/recuperar?error=supabase-not-configured");
  }

  const email = String(formData.get("email") ?? "").trim();

  // Validacao minima: respostas sempre genericas para nao revelar se o e-mail existe.
  if (!email || email.length > 320) {
    redirect("/login/recuperar?sent=1");
  }

  try {
    await assertActionRateLimit({
      keyPrefix: "action-reset-ip",
      limit: 5,
      windowMs: RATE_LIMIT_WINDOW_MS
    });
    await assertActionRateLimit({
      keyPrefix: "action-reset-email",
      limit: 5,
      windowMs: 60 * RATE_LIMIT_WINDOW_MS,
      suffix: email.toLowerCase()
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect("/login/recuperar?error=too-many-requests");
    }
    throw error;
  }

  const captchaToken = getCaptchaToken(formData);
  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const origin = getAuthCallbackOrigin(headerStore);
  const redirectTo = new URL("/auth/callback", origin);
  redirectTo.searchParams.set("next", "/redefinir-senha");

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      captchaToken,
      redirectTo: redirectTo.toString()
    });
  } catch {
    // Mantem resposta generica mesmo em caso de erro do provedor.
  }

  redirect("/login/recuperar?sent=1");
}

export async function signInWithGoogleAction(formData: FormData) {
  const mode = getAuthMode(formData.get("mode"));
  const next = mode === "signup"
    ? getPostSignupRedirectPath(formData.get("next"))
    : getSafeRedirectPath(formData.get("next"));

  if (!isSupabaseConfigured()) {
    redirect(buildLoginErrorUrl("supabase-not-configured", next, mode));
  }

  try {
    await assertActionRateLimit({
      keyPrefix: "action-oauth-google",
      limit: 10,
      windowMs: RATE_LIMIT_WINDOW_MS
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect(buildLoginErrorUrl("too-many-requests", next, mode));
    }
    throw error;
  }

  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const origin = getAuthCallbackOrigin(headerStore);
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

function getPostSignupRedirectPath(value: FormDataEntryValue | null) {
  const next = getSafeRedirectPath(value);

  return next === "/dashboard" ? "/onboarding/plans" : next;
}

function buildLoginErrorUrl(error: string, next: string, mode: "login" | "signup") {
  const searchParams = new URLSearchParams({ error, mode });

  if (next !== "/dashboard") {
    searchParams.set("next", next);
  }

  return `/login?${searchParams.toString()}`;
}

function getCaptchaToken(formData: FormData) {
  const token = String(formData.get("captchaToken") ?? "").trim();
  return token || undefined;
}

function mapSignUpErrorCode(error: { message?: string | null; code?: string | null }) {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (message === "auth-unavailable") {
    return "auth-unavailable";
  }
  if (code === "weak_password" || message.includes("password")) {
    return "weak-password";
  }
  if (message.includes("captcha")) {
    return "captcha-failed";
  }
  if (message.includes("already registered") || code === "user_already_exists") {
    return "email-already-registered";
  }

  return "signup-failed";
}

import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";
import { AuthCard } from "./auth-card";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; mode?: string; next?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error
    ? getFriendlyErrorMessage(params.error).message
    : null;
  const next = getSafeRedirectPath(params?.next);
  const mode = params?.mode === "signup" ? "signup" : "login";

  return <AuthCard error={error} initialMode={mode} next={next} />;
}

function getSafeRedirectPath(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

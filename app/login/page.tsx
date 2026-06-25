import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";
import { AuthCard } from "./auth-card";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; mode?: string; next?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error
    ? getFriendlyErrorMessage(params.error).message
    : null;
  const notice = getNoticeMessage(params?.notice);
  const next = getSafeRedirectPath(params?.next);
  const mode = params?.mode === "signup" ? "signup" : "login";

  return <AuthCard error={error} notice={notice} initialMode={mode} next={next} />;
}

function getNoticeMessage(notice?: string) {
  if (notice === "invite-rejected") {
    return "Seu convite foi rejeitado pelo gestor e a conta de acesso foi removida. Crie uma nova conta para continuar.";
  }

  if (notice === "password-updated") {
    return "Senha redefinida com sucesso. Faça login com a sua nova senha.";
  }

  return null;
}

function getSafeRedirectPath(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

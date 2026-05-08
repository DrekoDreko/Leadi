import { AuthCard } from "./auth-card";

const errorMessages: Record<string, string> = {
  "invalid-credentials": "E-mail ou senha invalidos.",
  "signup-failed": "Nao foi possivel criar a conta. Revise os dados e tente novamente.",
  "auth-unavailable": "Nao foi possivel conectar ao Supabase agora. Verifique sua conexao e tente novamente.",
  "oauth-callback-failed":
    "Nao foi possivel concluir o login OAuth. Confira a callback URL cadastrada no Supabase e tente novamente.",
  "oauth-failed": "Nao foi possivel iniciar o acesso com Google. Tente novamente.",
  "supabase-not-configured": "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para ativar o login real."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; mode?: string; next?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error
    ? errorMessages[params.error] ?? params.error
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

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error ? getFriendlyErrorMessage(params.error).message : null;

  // O link do e-mail cria uma sessao de recuperacao (via /auth/callback).
  // Sem essa sessao, nao ha o que redefinir.
  let hasRecoverySession = false;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      hasRecoverySession = Boolean(user);
    } catch {
      hasRecoverySession = false;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="glass-strong w-full max-w-md overflow-hidden rounded-[38px] p-6 sm:p-8">
        <BrandMark />

        <h1 className="mt-8 text-3xl font-semibold">Criar nova senha</h1>
        <p className="text-muted-soft mt-2 text-sm">
          Defina uma nova senha para a sua conta. Depois de salvar, você fará login novamente com ela.
        </p>

        {error && (
          <p className="surface-alert-warning mt-5 rounded-[22px] px-4 py-3 text-sm font-medium">
            {error}
          </p>
        )}

        {hasRecoverySession ? (
          <ResetPasswordForm />
        ) : (
          <div className="mt-6">
            <p className="text-muted-soft text-sm">
              Este link de redefinição é inválido ou já expirou. Solicite um novo para continuar.
            </p>
            <Link
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-cobalt px-5 py-4 font-semibold text-white transition hover:bg-cobalt/90"
              href="/login/recuperar"
            >
              Solicitar novo link
            </Link>
          </div>
        )}

        <p className="text-muted-soft mt-6 text-center text-sm">
          <Link className="text-cobalt font-semibold hover:underline" href="/login">
            Voltar para o login
          </Link>
        </p>
      </section>
    </main>
  );
}

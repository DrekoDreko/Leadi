import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";
import { requestPasswordResetAction } from "../actions";

export default async function RecoverPasswordPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error ? getFriendlyErrorMessage(params.error).message : null;
  const sent = params?.sent === "1";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="glass-strong w-full max-w-md overflow-hidden rounded-[38px] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <BrandMark />
          <Link
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-semibold"
            href="/login"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Voltar
          </Link>
        </div>

        <h1 className="mt-8 text-3xl font-semibold">Recuperar acesso</h1>
        <p className="text-muted-soft mt-2 text-sm">
          Informe o e-mail da sua conta e enviaremos um link seguro para você criar uma nova senha.
        </p>

        {error && (
          <p className="surface-alert-warning mt-5 rounded-[22px] px-4 py-3 text-sm font-medium">
            {error}
          </p>
        )}

        {sent ? (
          <div className="surface-alert-success mt-6 rounded-[22px] px-4 py-4 text-sm font-medium">
            Se existir uma conta com esse e-mail, enviamos as instruções para redefinir a senha.
            Verifique sua caixa de entrada e o spam.
          </div>
        ) : (
          <form action={requestPasswordResetAction} className="mt-6 flex flex-col gap-4">
            <label className="block">
              <span className="text-muted-soft mb-2 block text-sm font-medium">E-mail</span>
              <div className="relative">
                <Mail
                  className="text-muted-foreground/70 pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  className="liquid-input pl-11"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  name="email"
                  placeholder="voce@corretora.com.br"
                  required
                  type="email"
                  spellCheck={false}
                />
              </div>
            </label>
            <TurnstileWidget />
            <button
              className="w-full rounded-full bg-cobalt px-5 py-4 font-semibold text-white transition hover:bg-cobalt/90"
              type="submit"
            >
              Enviar link de recuperação
            </button>
          </form>
        )}

        <p className="text-muted-soft mt-6 text-center text-sm">
          Lembrou a senha?{" "}
          <Link className="text-cobalt font-semibold hover:underline" href="/login">
            Fazer login
          </Link>
        </p>
      </section>
    </main>
  );
}

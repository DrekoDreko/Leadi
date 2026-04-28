import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { signInAction, signUpAction } from "./actions";

const errorMessages: Record<string, string> = {
  "supabase-not-configured": "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para ativar o login real."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error
    ? errorMessages[params.error] ?? params.error
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-4 lg:min-h-[640px] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-dark rounded-[38px] p-6 text-white sm:p-8">
          <Link href="/" className="flex items-center gap-3" aria-label="LeadHealth">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-soft">
              LH
            </span>
            <span className="text-xl font-semibold text-white">LeadHealth</span>
          </Link>
          <div className="mt-14 lg:mt-24">
            <ShieldCheck className="text-signal" size={38} aria-hidden="true" />
            <h1 className="mt-8 text-4xl font-semibold leading-tight sm:text-5xl">
              Acesse seu painel LeadHealth
            </h1>
            <p className="mt-5 max-w-md leading-8 text-white/64">
              Autenticação conectada ao Supabase Auth, com criação automática
              da organização do vendedor no primeiro cadastro.
            </p>
          </div>
        </section>

        <section className="glass-strong rounded-[38px] p-6 sm:p-8">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold" href="/">
            <ArrowLeft size={17} aria-hidden="true" />
            Voltar para landing
          </Link>
          <div className="mt-12 lg:mt-16">
            <p className="text-sm font-medium text-cobalt">Supabase Auth</p>
            <h2 className="mt-2 text-4xl font-semibold">Entrar</h2>
            {error && (
              <p className="mt-5 rounded-[22px] bg-signal/34 px-4 py-3 text-sm font-medium text-ink">
                {error}
              </p>
            )}
            <form action={signInAction} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink/62">
                  Nome completo
                </span>
                <input
                  className="liquid-input"
                  name="fullName"
                  placeholder="Seu nome"
                  type="text"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink/62">
                  E-mail
                </span>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/38"
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    className="liquid-input pl-11"
                    name="email"
                    placeholder="voce@corretora.com.br"
                    required
                    type="email"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink/62">
                  Senha
                </span>
                <input
                  className="liquid-input"
                  minLength={6}
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className="rounded-full bg-cobalt px-5 py-4 font-semibold text-white"
                  type="submit"
                >
                  Entrar
                </button>
                <button
                  className="rounded-full bg-ink px-5 py-4 font-semibold text-white"
                  formAction={signUpAction}
                  type="submit"
                >
                  Criar conta
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

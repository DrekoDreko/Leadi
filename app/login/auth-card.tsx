"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { signInAction, signUpAction } from "./actions";

type AuthMode = "login" | "signup";

type AuthCardProps = {
  error: string | null;
  initialMode: AuthMode;
  next: string;
};

export function AuthCard({ error, initialMode, next }: AuthCardProps) {
  const router = useRouter();
  const [mode, setActiveMode] = useState<AuthMode>(initialMode);
  const isSignUp = mode === "signup";
  const panelHeight = isSignUp
    ? "min-h-[620px] lg:min-h-[720px]"
    : "min-h-[560px] lg:min-h-[640px]";

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  function setMode(mode: AuthMode) {
    setActiveMode(mode);
    router.replace(buildModeHref(mode, next), { scroll: false });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl items-stretch gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section
          className={`campaign-liquid-hero relative overflow-hidden rounded-[38px] border border-white/32 shadow-[0_36px_120px_rgba(10,18,39,0.34)] p-6 text-white transition-[min-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-8 ${panelHeight}`}
        >
          <div
            aria-hidden="true"
            className="campaign-liquid-glow absolute inset-0"
          />
          <div
            aria-hidden="true"
            className="campaign-liquid-grid absolute inset-0"
          />

          <div className="relative z-10 h-full">
            <div className="absolute left-0 top-0">
              <BrandMark tone="dark" />
            </div>
            <div className="flex h-full items-center">
              <div className="max-w-md text-left">
                <h1 className="text-3xl font-semibold leading-[1.02] tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Anúncios com IA para consultores de plano de saúde.
                </h1>
                <p className="mt-4 max-w-[31rem] text-base leading-7 text-white/74 sm:text-lg">
                  Crie campanhas, importe leads do Meta e acompanhe tudo no CRM da Leadi.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`glass-strong overflow-hidden rounded-[38px] p-6 transition-[min-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-8 ${panelHeight}`}
        >
          <Link className="inline-flex items-center text-sm font-semibold" href="/">
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
          <div className="mt-8 lg:mt-12">
            <h2 className="mt-2 text-4xl font-semibold">
              {isSignUp ? "Criar conta" : "Login"}
            </h2>
            <div className="mt-6 grid rounded-full bg-white/38 p-1 text-sm font-semibold text-ink/68 sm:grid-cols-2">
              <button
                className={`rounded-full px-5 py-3 text-center transition ${
                  !isSignUp ? "bg-ink text-white shadow-soft" : "hover:bg-white/46"
                }`}
                onClick={() => setMode("login")}
                type="button"
              >
                Login
              </button>
              <button
                className={`rounded-full px-5 py-3 text-center transition ${
                  isSignUp ? "bg-ink text-white shadow-soft" : "hover:bg-white/46"
                }`}
                onClick={() => setMode("signup")}
                type="button"
              >
                Criar conta
              </button>
            </div>
            {error && (
              <p className="mt-5 rounded-[22px] bg-signal/34 px-4 py-3 text-sm font-medium text-ink">
                {error}
              </p>
            )}
            <form
              action={isSignUp ? signUpAction : signInAction}
              className="mt-12 flex flex-col gap-4"
            >
              <input name="next" type="hidden" value={next} />
              <div
                className={`overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isSignUp
                    ? "max-h-28 translate-y-0 opacity-100"
                    : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
                }`}
                aria-hidden={!isSignUp}
              >
                <label className="block pb-1">
                  <span className="mb-2 block text-sm font-medium text-ink/62">
                    Nome completo
                  </span>
                  <input
                    className="liquid-input"
                    disabled={!isSignUp}
                    autoComplete="name"
                    autoCapitalize="words"
                    autoCorrect="off"
                    name="fullName"
                    placeholder="Seu nome"
                    required={isSignUp}
                    type="text"
                  />
                </label>
              </div>
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
                    autoComplete={isSignUp ? "email" : "username"}
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
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink/62">
                  Senha
                </span>
                <input
                  className="liquid-input"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  autoCapitalize="none"
                  autoCorrect="off"
                  minLength={6}
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  spellCheck={false}
                />
              </label>
              <button
                className="w-full rounded-full bg-cobalt px-5 py-4 font-semibold text-white transition hover:bg-cobalt/90"
                type="submit"
              >
                {isSignUp ? "Criar conta" : "Entrar"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function buildModeHref(mode: AuthMode, next: string) {
  const searchParams = new URLSearchParams({ mode });

  if (next !== "/dashboard") {
    searchParams.set("next", next);
  }

  return `/login?${searchParams.toString()}`;
}

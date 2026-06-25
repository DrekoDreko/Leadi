"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { signInAction, signInWithGoogleAction, signUpAction } from "./actions";

type AuthMode = "login" | "signup";

type AuthCardProps = {
  error: string | null;
  notice?: string | null;
  initialMode: AuthMode;
  next: string;
};

export function AuthCard({ error, notice, initialMode, next }: AuthCardProps) {
  const router = useRouter();
  const [mode, setActiveMode] = useState<AuthMode>(initialMode);
  const isSignUp = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const panelHeight = isSignUp
    ? "min-h-[700px] lg:min-h-[820px]"
    : "min-h-[640px] lg:min-h-[740px]";

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
            <div className="surface-pill mt-6 grid rounded-full p-1 text-sm font-semibold sm:grid-cols-2">
              <button
                className={`rounded-full px-5 py-3 text-center transition ${
                  !isSignUp ? "bg-foreground text-background shadow-soft" : "hover:bg-foreground/8"
                }`}
                onClick={() => setMode("login")}
                type="button"
              >
                Login
              </button>
              <button
                className={`rounded-full px-5 py-3 text-center transition ${
                  isSignUp ? "bg-foreground text-background shadow-soft" : "hover:bg-foreground/8"
                }`}
                onClick={() => setMode("signup")}
                type="button"
              >
                Criar conta
              </button>
            </div>
            {notice && (
              <p className="surface-alert-success mt-5 rounded-[22px] px-4 py-3 text-sm font-medium">
                {notice}
              </p>
            )}
            {error && (
              <p className="surface-alert-warning mt-5 rounded-[22px] px-4 py-3 text-sm font-medium">
                {error}
              </p>
            )}
            <form action={signInWithGoogleAction} className="mt-8">
              <input name="next" type="hidden" value={next} />
              <input name="mode" type="hidden" value={mode} />
              <button
                type="submit"
                className="surface-action-secondary flex w-full items-center justify-center gap-3 rounded-full px-5 py-4 font-semibold transition"
              >
                <GoogleGlyph />
                Continuar com Google
              </button>
            </form>
            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-border" />
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                ou com e-mail
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <form
              action={isSignUp ? signUpAction : signInAction}
              className="flex flex-col gap-4"
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
                  <span className="text-muted-soft mb-2 block text-sm font-medium">
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
                <span className="text-muted-soft mb-2 block text-sm font-medium">
                  E-mail
                </span>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70"
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
                <span className="text-muted-soft mb-2 block text-sm font-medium">
                  Senha
                </span>
                <div className="relative">
                  <input
                    className="liquid-input pr-11"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    minLength={8}
                    name="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={() => setShowPassword(true)}
                    onTouchEnd={() => setShowPassword(false)}
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </label>
              {isSignUp ? (
                <p className="text-muted-foreground -mt-1 text-xs">
                  Use ao menos 8 caracteres, com letras e números.
                </p>
              ) : (
                <div className="-mt-1 text-right">
                  <Link
                    className="text-cobalt text-sm font-semibold hover:underline"
                    href="/login/recuperar"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              )}
              <TurnstileWidget />
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

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

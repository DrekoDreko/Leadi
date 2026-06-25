"use client";

import { useEffect, useRef, useState } from "react";

// Chave de TESTE publica da Cloudflare (sempre passa). Usada apenas fora de
// producao para nao travar o desenvolvimento quando a env nao esta configurada.
// Em producao a chave real vem de NEXT_PUBLIC_TURNSTILE_SITE_KEY.
const DEV_TEST_SITE_KEY = "1x00000000000000000000AA";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function resolveSiteKey() {
  const configured = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV !== "production") {
    return DEV_TEST_SITE_KEY;
  }
  return "";
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("turnstile-script-error")));
      if (window.turnstile) {
        resolve();
      }
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("turnstile-script-error")));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Renderiza o desafio do Cloudflare Turnstile e expoe o token via input
 * escondido `captchaToken`, que e enviado junto do formulario para a Server
 * Action. O Supabase valida o token no servidor (a secret fica no Supabase,
 * nunca no client). Se nao houver site key configurada em producao, o widget
 * simplesmente nao renderiza.
 */
export function TurnstileWidget() {
  const siteKey = resolveSiteKey();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return;
    }

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "auto",
          action: "auth",
          callback: (value: string) => setToken(value),
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken("")
        });
      })
      .catch(() => {
        // Falha ao carregar o captcha nao deve travar a tela; o backend ainda valida.
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <div ref={containerRef} className="min-h-[65px]" />
      <input type="hidden" name="captchaToken" value={token} readOnly />
    </div>
  );
}

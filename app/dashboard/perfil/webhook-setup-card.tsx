"use client";

import { useActionState, useMemo, useState } from "react";
import { CheckCircle2, Copy, KeyRound, Loader2, Webhook } from "lucide-react";
import {
  createLeadWebhookTokenAction,
  type CreateLeadWebhookTokenActionState
} from "./actions";

type WebhookSetupCardProps = {
  canManageToken: boolean;
  isSupabaseMode: boolean;
  webhookUrl: string;
};

const samplePayload = {
  name: "Ana Martins",
  email: "ana@empresa.com.br",
  phone: "+5511999998888",
  city: "Sao Paulo",
  interest: "Plano empresarial",
  source: "make_zapier"
};

const initialLeadWebhookTokenActionState: CreateLeadWebhookTokenActionState = {
  error: null,
  successMessage: null,
  token: null,
  label: null
};

export function WebhookSetupCard({
  canManageToken,
  isSupabaseMode,
  webhookUrl
}: WebhookSetupCardProps) {
  const [state, formAction, pending] = useActionState(
    createLeadWebhookTokenAction,
    initialLeadWebhookTokenActionState
  );
  const [copiedValue, setCopiedValue] = useState<"token" | "url" | "payload" | "curl" | null>(null);
  const payloadExample = useMemo(() => JSON.stringify(samplePayload, null, 2), []);
  const curlExample = useMemo(
    () =>
      [
        `curl -X POST '${webhookUrl}' \\`,
        "  -H 'Content-Type: application/json' \\",
        "  -H 'x-leadhealth-token: SEU_TOKEN_AQUI' \\",
        `  --data-raw '${JSON.stringify(samplePayload)}'`
      ].join("\n"),
    [webhookUrl]
  );

  async function copyText(value: string, target: "token" | "url" | "payload" | "curl") {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("clipboard-unavailable");
      }

      await navigator.clipboard.writeText(value);
      setCopiedValue(target);
      window.setTimeout(() => setCopiedValue((current) => (current === target ? null : current)), 2200);
    } catch {
      setCopiedValue(null);
    }
  }

  return (
    <section className="glass-strong rounded-[34px] p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cobalt">Integracoes</p>
            <h2 className="mt-2 text-2xl font-semibold">Make/Zapier</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/62">
              Use esta URL no webhook do Make ou Zapier, gere um token da sua organizacao e envie
              o JSON com os campos principais do lead.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-4 py-2 text-sm font-semibold text-ink">
            <Webhook size={16} aria-hidden="true" />
            Webhook de leads
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <article className="rounded-[28px] border border-white/44 bg-white/36 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-cobalt">URL do webhook</p>
                <p className="mt-2 break-all font-mono text-sm text-ink">{webhookUrl}</p>
              </div>
              <button
                className="icon-button shrink-0"
                onClick={() => copyText(webhookUrl, "url")}
                type="button"
                title="Copiar URL do webhook"
              >
                <Copy size={16} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-ink/58">
              Envie `POST` com `Content-Type: application/json` e o token em
              `Authorization: Bearer ...` ou `x-leadhealth-token`.
            </p>
            {copiedValue === "url" ? (
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-lagoon">
                <CheckCircle2 size={14} aria-hidden="true" />
                URL copiada.
              </p>
            ) : null}
          </article>

          <article className="rounded-[28px] border border-white/44 bg-white/36 p-5">
            <div className="flex items-center gap-2 text-cobalt">
              <KeyRound size={16} aria-hidden="true" />
              <p className="text-sm font-medium">Token da integracao</p>
            </div>

            {!isSupabaseMode ? (
              <p className="mt-3 text-sm leading-6 text-ink/62">
                Configure o Supabase para gerar um token real da organizacao.
              </p>
            ) : canManageToken ? (
              <form action={formAction} className="mt-4 space-y-3">
                <input
                  className="liquid-input"
                  maxLength={60}
                  name="label"
                  placeholder="Ex.: Make principal"
                  type="text"
                />
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : null}
                  {pending ? "Gerando token..." : "Gerar novo token"}
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink/62">
                O supervisor da equipe precisa gerar o token. Depois disso, compartilhe-o com
                cuidado fora do app.
              </p>
            )}

            {state.error ? (
              <p className="mt-4 rounded-[20px] bg-signal/34 px-4 py-3 text-sm font-medium text-ink">
                {state.error}
              </p>
            ) : null}

            {state.successMessage && state.token ? (
              <div className="mt-4 rounded-[22px] bg-lagoon/14 p-4">
                <p className="text-sm font-semibold text-ink">{state.successMessage}</p>
                {state.label ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink/52">{state.label}</p>
                ) : null}
                <div className="mt-3 flex items-start justify-between gap-3">
                  <code className="block break-all rounded-[18px] bg-white/70 px-3 py-3 text-sm text-ink">
                    {state.token}
                  </code>
                  <button
                    className="icon-button shrink-0"
                    onClick={() => copyText(state.token ?? "", "token")}
                    type="button"
                    title="Copiar token"
                  >
                    <Copy size={16} aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-ink/60">
                  A LeadHealth salva apenas o hash. Se voce perder este valor, gere outro token.
                </p>
                {copiedValue === "token" ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-lagoon">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    Token copiado.
                  </p>
                ) : null}
              </div>
            ) : null}
          </article>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <article className="rounded-[28px] border border-white/44 bg-white/36 p-5">
            <p className="text-sm font-medium text-cobalt">Passo a passo rapido</p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-ink/66">
              <li>1. Copie a URL do webhook acima.</li>
              <li>2. Gere um token da organizacao e guarde em local seguro.</li>
              <li>3. No Make/Zapier, envie `POST` com JSON e o token no header.</li>
              <li>4. Se quiser validar antes da automacao, rode o curl de teste abaixo.</li>
              <li>5. Dispare um lead real de teste e confira os logs logo abaixo.</li>
            </ol>

            <div className="mt-4 rounded-[22px] bg-ink px-4 py-4 text-xs leading-6 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Comando de teste rapido</p>
                  <p className="mt-1 text-xs text-white/72">
                    Troque `SEU_TOKEN_AQUI` pelo token gerado e dispare o webhook manualmente.
                  </p>
                </div>
                <button
                  className="icon-button shrink-0 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => copyText(curlExample, "curl")}
                  type="button"
                  title="Copiar comando curl"
                >
                  <Copy size={16} aria-hidden="true" />
                </button>
              </div>
              <pre className="mt-3 overflow-x-auto">
                <code>{curlExample}</code>
              </pre>
            </div>
            {copiedValue === "curl" ? (
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-lagoon">
                <CheckCircle2 size={14} aria-hidden="true" />
                Comando copiado.
              </p>
            ) : null}
          </article>

          <article className="rounded-[28px] border border-white/44 bg-white/36 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-cobalt">Payload exemplo</p>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Campos como `nome`, `email`, `telefone`, `cidade` e `interesse` tambem sao aceitos.
                </p>
              </div>
              <button
                className="icon-button shrink-0"
                onClick={() => copyText(payloadExample, "payload")}
                type="button"
                title="Copiar exemplo de payload"
              >
                <Copy size={16} aria-hidden="true" />
              </button>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-[22px] bg-ink px-4 py-4 text-xs leading-6 text-white">
              <code>{payloadExample}</code>
            </pre>
            {copiedValue === "payload" ? (
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-lagoon">
                <CheckCircle2 size={14} aria-hidden="true" />
                Payload copiado.
              </p>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  );
}

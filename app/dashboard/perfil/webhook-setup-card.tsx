"use client";

import { useActionState, useMemo, useState } from "react";
import { CheckCircle2, Copy, KeyRound, Loader2 } from "lucide-react";
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
  city: "São Paulo",
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
      <div className="flex flex-col gap-4">
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
              Use esta URL no Make, Zapier ou em outro sistema que envie leads via requisição
              POST.
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
              <p className="text-sm font-medium">Token da integração</p>
            </div>

            {!isSupabaseMode ? (
              <p className="mt-3 text-sm leading-6 text-ink/62">
                Configure o Supabase para gerar um token real da organização.
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
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : null}
                  {pending ? "Gerando token..." : "Gerar novo token"}
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink/62">
                O owner ou os supervisores da equipe precisam gerar o token. Depois disso, compartilhe-o
                com cuidado fora do app.
              </p>
            )}

            {state.error ? (
              <p className="mt-4 rounded-[20px] bg-signal/34 px-4 py-3 text-sm font-medium text-ink dark:text-cloud">
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
                  O Leadi salva apenas o hash. Se você perder este valor, gere outro token.
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
            <p className="text-sm font-medium text-cobalt">Como configurar</p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-ink/66">
              <li>1. Copie a URL do webhook acima.</li>
              <li>2. Gere um token para a sua organização.</li>
              <li>3. No Make, Zapier ou ferramenta externa, crie uma requisição POST.</li>
              <li>
                4. Envie o token no header{" "}
                <code className="rounded bg-white/68 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
                  x-leadhealth-token: SEU_TOKEN_AQUI
                </code>{" "}
                ou{" "}
                <code className="rounded bg-white/68 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
                  Authorization: Bearer SEU_TOKEN_AQUI
                </code>
                .
              </li>
              <li>5. Envie os dados do lead em formato JSON.</li>
              <li>6. Faça um teste e confira os logs recebidos.</li>
            </ol>

            <div className="mt-4 rounded-[22px] bg-ink px-4 py-4 text-xs leading-6 text-cloud">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Comando de teste</p>
                  <p className="mt-1 text-xs text-white/72">
                    Troque SEU_TOKEN_AQUI pelo token gerado e dispare o webhook manualmente.
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
                <p className="text-sm font-medium text-cobalt">Payload exemplo JSON</p>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Campos como nome, email, telefone, cidade e interesse também podem ser aceitos
                  conforme o mapeamento do sistema.
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
            <pre className="mt-3 overflow-x-auto rounded-[22px] bg-ink px-4 py-4 text-xs leading-6 text-cloud">
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

"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  LeadWebhookLog,
  WebhookLogFilter
} from "@/lib/leads/webhook-events.repository";

type WebhookLogsCardProps = {
  filter: WebhookLogFilter;
  isSupabaseMode: boolean;
  logs: LeadWebhookLog[];
};

export function WebhookLogsCard({
  filter,
  isSupabaseMode,
  logs
}: WebhookLogsCardProps) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

  useEffect(() => {
    if (!isSupabaseMode || !isAutoRefreshEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      startRefreshTransition(() => {
        router.refresh();
      });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [isAutoRefreshEnabled, isSupabaseMode, router, startRefreshTransition]);

  return (
    <section className="glass-strong rounded-[34px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cobalt">Webhook de leads</p>
          <h2 className="mt-2 text-2xl font-semibold">Logs recebidos</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/62">
            Confira os eventos mais recentes para validar a automacao e corrigir payloads com erro.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a className={getWebhookFilterClass(filter, "all")} href="/dashboard/perfil">
            Todos
          </a>
          <a
            className={getWebhookFilterClass(filter, "processed")}
            href="/dashboard/perfil?webhookStatus=processed"
          >
            Sucesso
          </a>
          <a
            className={getWebhookFilterClass(filter, "failed")}
            href="/dashboard/perfil?webhookStatus=failed"
          >
            Erro
          </a>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white/55 px-4 py-2 text-xs font-semibold text-ink/74 transition hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!isSupabaseMode || isRefreshing}
            onClick={() => {
              startRefreshTransition(() => {
                router.refresh();
              });
            }}
            type="button"
          >
            <RefreshCcw className={isRefreshing ? "animate-spin" : ""} size={14} aria-hidden="true" />
            {isRefreshing ? "Atualizando..." : "Atualizar agora"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/40 bg-white/34 px-4 py-3 text-sm text-ink/66">
        <p>
          {isSupabaseMode
            ? "Atualizacao automatica a cada 15 segundos para acompanhar o teste quase em tempo real."
            : "Configure o Supabase para visualizar logs reais de webhook."}
        </p>
        {isSupabaseMode ? (
          <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">
            <input
              checked={isAutoRefreshEnabled}
              className="h-4 w-4 rounded border-white/55 accent-ink"
              onChange={(event) => setIsAutoRefreshEnabled(event.target.checked)}
              type="checkbox"
            />
            Autoatualizar
          </label>
        ) : null}
      </div>

      {!isSupabaseMode ? null : logs.length === 0 ? (
        <p className="mt-5 rounded-[22px] border border-white/40 bg-white/34 px-4 py-3 text-sm text-ink/66">
          Nenhum log encontrado para este filtro.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-ink/60">
                <th className="pb-3 pr-4 font-medium">Data</th>
                <th className="pb-3 pr-4 font-medium">Origem</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Lead criado</th>
                <th className="pb-3 font-medium">Erro</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((event) => (
                <tr key={event.id} className="border-t border-white/35 align-top">
                  <td className="py-3 pr-4 text-ink/72">{formatWebhookLogDate(event.receivedAt)}</td>
                  <td className="py-3 pr-4 text-ink/72">{event.source}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        event.status === "processed"
                          ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700"
                          : "rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-700"
                      }
                    >
                      {event.status === "processed"
                        ? `Sucesso (${event.httpStatus})`
                        : `Erro (${event.httpStatus})`}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-ink/72">
                    {event.leadName ?? (event.leadId ? `ID ${event.leadId.slice(0, 8)}` : "-")}
                  </td>
                  <td className="py-3 text-ink/72">{event.errorMessage ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function getWebhookFilterClass(current: WebhookLogFilter, target: WebhookLogFilter) {
  if (current === target) {
    return "rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white";
  }

  return "rounded-full bg-white/55 px-4 py-2 text-xs font-semibold text-ink/70 transition hover:bg-white/75";
}

function formatWebhookLogDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

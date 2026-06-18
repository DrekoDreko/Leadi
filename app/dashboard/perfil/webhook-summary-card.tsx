import Link from "next/link";
import { ArrowUpRight, Webhook } from "lucide-react";
import type { LeadWebhookSummary } from "@/lib/leads/webhook-events.repository";

type WebhookSummaryCardProps = {
  summary: LeadWebhookSummary;
};

export function WebhookSummaryCard({ summary }: WebhookSummaryCardProps) {
  return (
    <section className="glass-strong rounded-[34px] p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-cobalt">Integrações</p>
            <h2 className="mt-2 text-2xl font-semibold">Webhook de Leads</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/62">
              Receba automaticamente leads vindos de ferramentas externas como Make, Zapier,
              landing pages, formulários e outros sistemas.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              summary.isConfigured ? "bg-lagoon/16 text-ink dark:text-cloud" : "bg-signal/30 text-ink dark:text-cloud"
            }`}
          >
            <Webhook size={16} aria-hidden="true" />
            {summary.isConfigured ? "Ativo" : "Não configurado"}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryStat
            detail={
              summary.isConfigured
                ? "Recebimento liberado para a organização."
                : "Crie um token para começar a receber leads."
            }
            label="Status da integração"
            value={summary.isConfigured ? "Ativo" : "Não configurado"}
          />
          <SummaryStat
            detail="Eventos processados hoje"
            label="Leads recebidos hoje"
            value={String(summary.leadsReceivedToday)}
          />
          <SummaryStat
            detail={
              summary.lastLeadReceivedAt
                ? formatWebhookDate(summary.lastLeadReceivedAt)
                : "Ainda não chegou nenhum lead."
            }
            label="Último lead recebido"
            value={summary.lastLeadName ?? "Nenhum ainda"}
          />
          <SummaryStat
            detail={
              summary.lastErrorAt
                ? formatWebhookDate(summary.lastErrorAt)
                : "Sem erros recentes."
            }
            label="Último erro"
            value={summary.lastError ?? "Nenhum"}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud transition hover:bg-ink/90"
            href="/dashboard/integracoes/webhook-leads"
          >
            Configurar integração
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink transition hover:bg-surface-elevated"
            href="/dashboard/integracoes/webhook-leads#logs"
          >
            Ver logs
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <p className="text-sm leading-6 text-ink/58">
          Se ainda não houver dados, esta área aparece vazia até o primeiro lead chegar.
        </p>
      </div>
    </section>
  );
}

function SummaryStat({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[26px] bg-surface-elevated p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">{label}</p>
      <p className="mt-2 break-words text-lg font-semibold text-ink">{value}</p>
      <p className="mt-2 break-words text-sm leading-6 text-ink/60">{detail}</p>
    </article>
  );
}

function formatWebhookDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  CheckCircle2,
  CreditCard,
  Info,
  Loader2,
  Pause,
  PauseCircle,
  Play,
  Radio,
  Wallet,
  XCircle
} from "lucide-react";
import type { CampaignPublicationStatus } from "@/lib/campaigns/types";

type CampaignDeliveryControlsProps = {
  campaignId: string;
  initialStatus: CampaignPublicationStatus;
  deliveryMessage?: string | null;
  effectiveStatus?: string | null;
  hasAdSet: boolean;
  billingUrl: string | null;
};

// Descritor visual de cada estado real de veiculacao lido da Meta.
const STATUS_BADGE: Record<
  CampaignPublicationStatus,
  { label: string; className: string }
> = {
  not_connected: { label: "Nao conectada", className: "bg-slate-100 text-slate-700" },
  ready_to_prepare: { label: "Pronta para preparar", className: "bg-slate-100 text-slate-700" },
  draft_created: { label: "Rascunho", className: "bg-slate-100 text-slate-700" },
  pending_review: { label: "Em revisao", className: "bg-amber-50 text-amber-800" },
  published: { label: "Veiculando", className: "bg-emerald-50 text-emerald-700" },
  paused: { label: "Pausada", className: "bg-slate-100 text-slate-700" },
  failed: { label: "Reprovada / falha", className: "bg-red-50 text-red-700" }
};

// Refina o badge a partir do effective_status real da Meta. ARCHIVED e COMPLETED
// caem em publication_status="paused", mas merecem rotulo proprio para o badge
// nao contradizer a mensagem ("Pausada" x "Arquivada na Meta"). Sem migrar o enum.
function resolveBadge(
  status: CampaignPublicationStatus,
  effectiveStatus: string | null | undefined
): { label: string; className: string } {
  const normalized = effectiveStatus?.trim().toUpperCase() ?? "";
  if (normalized === "ARCHIVED") {
    return { label: "Arquivada", className: "bg-slate-100 text-slate-600" };
  }
  if (normalized === "COMPLETED") {
    return { label: "Concluída", className: "bg-slate-100 text-slate-600" };
  }
  return STATUS_BADGE[status] ?? STATUS_BADGE.paused;
}

function describeToggleResult(status: CampaignPublicationStatus): string {
  switch (status) {
    case "published":
      return "Campanha ativada e veiculando na Meta.";
    case "pending_review":
      return "Campanha ativada. Entrou em revisao da Meta.";
    case "failed":
      return "A Meta reprovou o anuncio. Ajuste o texto/criativo e reenvie.";
    case "paused":
      return "Campanha pausada.";
    default:
      return "Status atualizado conforme a Meta.";
  }
}

// Card interno reutilizavel: mesma moldura para os 3 blocos de controle.
function ControlSubCard({
  icon,
  title,
  description,
  children
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-[22px] border border-black/[0.06] bg-white/55 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
          {icon}
        </span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-auto pt-4">{children}</div>
    </div>
  );
}

export function CampaignDeliveryControls({
  campaignId,
  initialStatus,
  deliveryMessage,
  effectiveStatus,
  hasAdSet,
  billingUrl
}: CampaignDeliveryControlsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<CampaignPublicationStatus>(initialStatus);
  const [effective, setEffective] = useState<string | null>(effectiveStatus ?? null);
  const [budget, setBudget] = useState("");
  const [pendingAction, setPendingAction] = useState<"toggle" | "budget" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // "Veiculando" so quando a Meta confirma ACTIVE (publication_status=published).
  // pending_review/failed nao sao "ativos" para fins do botao pausar/ativar.
  const isActive = status === "published";
  const badge = resolveBadge(status, effective);

  async function handleToggle() {
    setError(null);
    setSuccess(null);
    setPendingAction("toggle");
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isActive ? "pause" : "activate" })
      });
      const data = (await response.json()) as {
        campaign?: { publicationStatus?: CampaignPublicationStatus };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Nao foi possivel atualizar a campanha.");
      }
      const nextStatus = data.campaign?.publicationStatus ?? (isActive ? "paused" : "pending_review");
      setStatus(nextStatus);
      // A acao mudou o estado na Meta; o effective_status anterior (ex.: ARCHIVED)
      // nao vale mais. Zera para o badge seguir o publication_status ate o refresh.
      setEffective(null);
      setSuccess(describeToggleResult(nextStatus));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleBudget() {
    setError(null);
    setSuccess(null);
    const value = Number(budget.replace(",", "."));
    if (!Number.isFinite(value) || value < 1) {
      setError("Informe um orcamento diario valido (minimo R$ 1).");
      return;
    }
    setPendingAction("budget");
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyBudget: value })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Nao foi possivel atualizar o orcamento.");
      }
      setSuccess(`Orcamento diario atualizado para R$ ${value.toFixed(2)}.`);
      setBudget("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="surface-card-strong rounded-[30px] p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-cobalt">Veiculação</p>
          <h2 className="text-xl font-semibold">Controle do anúncio</h2>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {deliveryMessage ? (
        <p className="mt-4 flex items-start gap-2 rounded-[18px] border border-cobalt/15 bg-cobalt/5 px-4 py-3 text-sm text-cobalt">
          <Info size={16} className="mt-0.5 shrink-0 text-cobalt/70" aria-hidden="true" />
          <span>
            {deliveryMessage}
            {effectiveStatus ? (
              <span className="ml-1 text-cobalt/55">(Meta: {effectiveStatus})</span>
            ) : null}
          </span>
        </p>
      ) : null}

      {/* Tres blocos de controle lado a lado dentro do card maior. */}
      <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${hasAdSet ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {/* Bloco 1 — acao principal */}
        <ControlSubCard
          icon={isActive ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          title="Ativar anúncio"
          description={
            isActive
              ? "A campanha está veiculando. Pause para interromper a entrega quando quiser."
              : "Ao ativar, o anúncio entra em revisão da Meta e só começa a veicular após aprovação."
          }
        >
          <button
            type="button"
            onClick={handleToggle}
            disabled={pendingAction !== null}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${
              isActive ? "bg-amber-600 hover:bg-amber-600/90" : "bg-emerald-600 hover:bg-emerald-600/90"
            }`}
          >
            {pendingAction === "toggle" ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : isActive ? (
              <Pause size={16} aria-hidden="true" />
            ) : (
              <Play size={16} aria-hidden="true" />
            )}
            {isActive ? "Pausar campanha" : "Ativar campanha"}
          </button>
        </ControlSubCard>

        {/* Bloco 2 — orcamento */}
        {hasAdSet ? (
          <ControlSubCard
            icon={<Wallet size={16} aria-hidden="true" />}
            title="Orçamento diário"
            description="Valor máximo que a campanha pode gastar por dia (mínimo R$ 1)."
          >
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Wallet
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70"
                  aria-hidden="true"
                />
                <input
                  id="daily-budget"
                  type="number"
                  min={1}
                  step="0.01"
                  inputMode="decimal"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="Ex: 30,00"
                  className="h-11 w-full rounded-full border border-cobalt/20 bg-white/70 pl-9 pr-4 text-sm focus:border-cobalt/45 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleBudget}
                disabled={pendingAction !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/92 disabled:opacity-60"
              >
                {pendingAction === "budget" ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : null}
                Salvar orçamento
              </button>
            </div>
          </ControlSubCard>
        ) : null}

        {/* Bloco 3 — pagamento na Meta */}
        <ControlSubCard
          icon={<CreditCard size={16} aria-hidden="true" />}
          title="Forma de pagamento"
          description="A campanha só veicula com uma forma de pagamento válida na conta de anúncio. Cartão e saldo são adicionados diretamente na Meta — não é possível fazer isso por aqui."
        >
          {billingUrl ? (
            <a
              href={billingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cobalt/20 bg-white/60 px-5 py-3 text-sm font-semibold text-cobalt transition-colors hover:bg-white"
            >
              <CreditCard size={16} aria-hidden="true" />
              Abrir gerenciador de cobrança na Meta
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">
              Vincule uma conta de anúncio para gerenciar a cobrança.
            </p>
          )}
        </ControlSubCard>
      </div>

      {error || success ? (
        <div className="mt-4">
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

// Descritor visual do card de status. Reaproveita o effective_status real da Meta
// para distinguir Arquivado/Concluído de Pausado. So ativo/pausado ganham destaque.
function resolveStatusCard(
  status: CampaignPublicationStatus,
  effectiveStatus: string | null | undefined
): {
  label: string;
  description: string;
  icon: React.ReactNode;
  highlight: boolean;
  cardClassName: string;
  iconClassName: string;
  badge: { label: string; className: string };
} {
  const normalized = effectiveStatus?.trim().toUpperCase() ?? "";

  if (normalized === "ARCHIVED") {
    return {
      label: "Arquivado",
      description: "O anúncio está arquivado na Meta e não está veiculando.",
      icon: <Archive size={20} aria-hidden="true" />,
      highlight: false,
      cardClassName: "border-black/[0.06] bg-white/55",
      iconClassName: "bg-slate-100 text-slate-500",
      badge: { label: "Arquivado", className: "bg-slate-100 text-slate-600" }
    };
  }
  if (normalized === "COMPLETED") {
    return {
      label: "Concluído",
      description: "A campanha foi concluída na Meta.",
      icon: <CheckCircle2 size={20} aria-hidden="true" />,
      highlight: false,
      cardClassName: "border-black/[0.06] bg-white/55",
      iconClassName: "bg-slate-100 text-slate-500",
      badge: { label: "Concluído", className: "bg-slate-100 text-slate-600" }
    };
  }

  switch (status) {
    case "published":
      return {
        label: "Ativo",
        description: "A campanha está veiculando na Meta neste momento.",
        icon: <Radio size={20} aria-hidden="true" />,
        highlight: true,
        cardClassName:
          "border-emerald-300/70 bg-emerald-50/70 ring-1 ring-emerald-200 shadow-[0_10px_36px_-14px_rgba(16,185,129,0.55)]",
        iconClassName: "bg-emerald-500/15 text-emerald-700",
        badge: { label: "Ativo", className: "bg-emerald-500/15 text-emerald-700" }
      };
    case "paused":
      return {
        label: "Pausado",
        description: "A veiculação está interrompida. Ative o anúncio para voltar a entregar.",
        icon: <PauseCircle size={20} aria-hidden="true" />,
        highlight: true,
        cardClassName:
          "border-amber-300/70 bg-amber-50/70 ring-1 ring-amber-200 shadow-[0_10px_36px_-14px_rgba(217,119,6,0.5)]",
        iconClassName: "bg-amber-500/15 text-amber-700",
        badge: { label: "Pausado", className: "bg-amber-500/15 text-amber-800" }
      };
    case "pending_review":
      return {
        label: "Em revisão",
        description: "A Meta está revisando o anúncio. A veiculação começa após a aprovação.",
        icon: <Info size={20} aria-hidden="true" />,
        highlight: false,
        cardClassName: "border-amber-200/60 bg-amber-50/40",
        iconClassName: "bg-amber-500/12 text-amber-700",
        badge: { label: "Em revisão", className: "bg-amber-50 text-amber-800" }
      };
    case "failed":
      return {
        label: "Reprovado",
        description: "A Meta reprovou o anúncio. Ajuste o texto ou o criativo e reenvie.",
        icon: <XCircle size={20} aria-hidden="true" />,
        highlight: false,
        cardClassName: "border-red-200/60 bg-red-50/40",
        iconClassName: "bg-red-500/12 text-red-600",
        badge: { label: "Reprovado", className: "bg-red-50 text-red-700" }
      };
    default:
      return {
        label: STATUS_BADGE[status]?.label ?? "Status",
        description: "Estado atual do anúncio conforme a Meta.",
        icon: <Info size={20} aria-hidden="true" />,
        highlight: false,
        cardClassName: "border-black/[0.06] bg-white/55",
        iconClassName: "bg-slate-100 text-slate-500",
        badge: STATUS_BADGE[status] ?? STATUS_BADGE.paused
      };
  }
}

// Card de status do anuncio, exibido abaixo de "Revisar e publicar". Server-driven:
// reflete o publication/effective status reconciliado e ganha destaque quando ativo/pausado.
export function CampaignStatusCard({
  status,
  effectiveStatus
}: {
  status: CampaignPublicationStatus;
  effectiveStatus?: string | null;
}) {
  const view = resolveStatusCard(status, effectiveStatus);

  return (
    <section className={`rounded-[30px] border p-5 transition md:p-6 ${view.cardClassName}`}>
      <div className="flex items-center gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${view.iconClassName}`}
        >
          {view.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status do anúncio
          </p>
          <h3 className="text-lg font-semibold leading-tight">{view.label}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{view.description}</p>
        </div>
        <span
          className={`hidden shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold sm:inline-flex ${view.badge.className}`}
        >
          {view.badge.label}
        </span>
      </div>
    </section>
  );
}

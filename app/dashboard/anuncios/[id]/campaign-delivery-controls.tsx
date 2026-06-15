"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CreditCard, Loader2, Pause, Play, Wallet } from "lucide-react";
import type { CampaignPublicationStatus } from "@/lib/campaigns/types";

type CampaignDeliveryControlsProps = {
  campaignId: string;
  initialStatus: CampaignPublicationStatus;
  hasAdSet: boolean;
  billingUrl: string | null;
};

export function CampaignDeliveryControls({
  campaignId,
  initialStatus,
  hasAdSet,
  billingUrl
}: CampaignDeliveryControlsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<CampaignPublicationStatus>(initialStatus);
  const [budget, setBudget] = useState("");
  const [pendingAction, setPendingAction] = useState<"toggle" | "budget" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isActive = status === "published";

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
      const nextStatus = data.campaign?.publicationStatus ?? (isActive ? "paused" : "published");
      setStatus(nextStatus);
      setSuccess(isActive ? "Campanha pausada." : "Campanha ativada. Entrou em revisao da Meta.");
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
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
          }`}
        >
          {isActive ? "Veiculando" : "Pausada"}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={pendingAction !== null}
          className={`inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${
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

        {hasAdSet ? (
          <div className="surface-card-muted rounded-[24px] p-4">
            <label htmlFor="daily-budget" className="text-sm font-semibold">
              Orçamento diário (R$)
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
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
                  className="h-11 w-40 rounded-full border border-cobalt/20 bg-white/70 pl-9 pr-4 text-sm focus:border-cobalt/45 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleBudget}
                disabled={pendingAction !== null}
                className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/92 disabled:opacity-60"
              >
                {pendingAction === "budget" ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : null}
                Salvar orçamento
              </button>
            </div>
          </div>
        ) : null}

        {billingUrl ? (
          <a
            href={billingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-cobalt/20 bg-white/60 px-5 py-3 text-sm font-semibold text-cobalt transition-colors hover:bg-white"
          >
            <CreditCard size={16} aria-hidden="true" />
            Adicionar forma de pagamento / saldo na Meta
          </a>
        ) : null}

        <div className="flex items-start gap-2 rounded-[20px] border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Ao ativar, o anúncio entra em revisão da Meta e só passa a veicular se a conta de anúncio
            tiver uma forma de pagamento válida. A Meta não permite adicionar cartão ou saldo por
            aqui — use o botão acima para abrir o gerenciador de cobrança.
          </p>
        </div>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}
      </div>
    </section>
  );
}

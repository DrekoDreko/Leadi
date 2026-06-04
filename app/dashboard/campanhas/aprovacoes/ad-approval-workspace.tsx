"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, FileText, AlertTriangle } from "lucide-react";
import type { CampaignHistoryItem } from "@/lib/campaigns/types";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";
import { useRouter } from "next/navigation";

type AdApprovalWorkspaceProps = {
  initialCampaigns: CampaignHistoryItem[];
  mode: "supabase" | "not-configured" | "unauthenticated" | "error";
  message?: string;
};

export function AdApprovalWorkspace({ initialCampaigns, mode, message }: AdApprovalWorkspaceProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleApprovalAction(campaignId: string, action: "approved" | "rejected" | "needs_adjustment") {
    setLoadingId(campaignId);
    setError("");

    try {
      const res = await fetch("/api/campaigns/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, approvalStatus: action }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Erro ao processar aprovação.");
      }

      setCampaigns((current) => current.filter((c) => c.id !== campaignId));
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err).message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Aprovação de Anúncios</h1>
        <p className="mt-1 text-sm text-muted-soft">
          Revise campanhas enviadas pelos supervisores antes de publicar na Meta.
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-[24px] border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      {mode !== "supabase" && message ? (
        <div className="surface-alert-warning rounded-[24px] border p-4 text-sm text-foreground">
          {message}
        </div>
      ) : null}

      {campaigns.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[32px] border border-dashed border-border/60 bg-surface/30 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated text-muted-soft">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">Tudo em dia!</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-soft">
            Não há nenhuma campanha pendente de aprovação neste momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-surface-card p-5 shadow-soft transition-all hover:border-primary/20"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{campaign.campaignName}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-soft">
                    <span className="rounded-full bg-surface-elevated px-2 py-0.5">
                      {new Date(campaign.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <span>•</span>
                    <span>{campaign.product}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 text-sm">
                <div>
                  <span className="font-medium text-foreground">Público: </span>
                  <span className="text-muted-soft">{campaign.audience}</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">Oferta: </span>
                  <span className="text-muted-soft">{campaign.offer}</span>
                </div>
                {campaign.result.primaryText && (
                  <div className="rounded-[20px] bg-surface-elevated p-3">
                    <div className="mb-1 flex items-center gap-2 font-medium text-foreground text-xs">
                      <FileText size={14} />
                      Texto Principal
                    </div>
                    <p className="line-clamp-3 text-xs text-muted-soft">
                      {campaign.result.primaryText}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center gap-3 border-t border-border/40 pt-4">
                <button
                  type="button"
                  disabled={loadingId === campaign.id}
                  onClick={() => handleApprovalAction(campaign.id, "approved")}
                  className="surface-action-primary flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {loadingId === campaign.id ? "Processando..." : (
                    <>
                      <CheckCircle2 size={16} />
                      Aprovar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={loadingId === campaign.id}
                  onClick={() => handleApprovalAction(campaign.id, "rejected")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border/70 bg-surface-elevated py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

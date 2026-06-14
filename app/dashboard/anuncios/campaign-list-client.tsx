"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Copy,
  FileText,
  Megaphone,
  Pause,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  X,
  Calendar,
} from "lucide-react";
import type { CampaignHistoryItem } from "@/lib/campaigns/types";
import { deleteCampaignAction } from "./actions";

function getStatusDisplay(publicationStatus: string, publishMode: string) {
  if (publishMode === "draft" || publicationStatus === "draft_created") {
    return { label: "Rascunho", color: "bg-slate-100/80 text-slate-900 border border-slate-200/50", Icon: FileText };
  }
  if (publishMode === "paused" || publicationStatus === "paused") {
    return { label: "Pausada", color: "bg-amber-100/80 text-amber-900 border border-amber-200/50", Icon: Pause };
  }
  if (publicationStatus === "published") {
    return { label: "Publicada", color: "bg-emerald-100/80 text-emerald-900 border border-emerald-200/50", Icon: CheckCircle2 };
  }
  if (publicationStatus === "not_connected") {
    return { label: "Pronta", color: "bg-blue-100/80 text-blue-900 border border-blue-200/50", Icon: ShieldCheck };
  }
  if (publicationStatus === "ready_to_prepare" || publicationStatus === "pending_review") {
    return { label: "Revisão Manual", color: "bg-purple-100/80 text-purple-900 border border-purple-200/50", Icon: ShieldCheck };
  }
  return { label: publicationStatus.replaceAll("_", " "), color: "bg-white/62 text-ink/62 border border-white/20", Icon: ShieldCheck };
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return {
    date: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function CampaignListClient({ campaigns }: { campaigns: CampaignHistoryItem[] }) {
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignHistoryItem | null>(null);

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {campaigns.length ? (
          campaigns.map((campaign) => {
            const status = getStatusDisplay(campaign.publicationStatus, campaign.publishMode);
            const StatusIcon = status.Icon;
            const { date, time } = formatDateTime(campaign.createdAt);

            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => setSelectedCampaign(campaign)}
                className="glass-strong flex flex-col gap-3 rounded-[22px] p-4 text-left transition-all hover:shadow-md hover:ring-1 hover:ring-cobalt/15 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.color}`}>
                    <StatusIcon size={12} aria-hidden="true" />
                    {status.label}
                  </span>
                  <Megaphone className="text-cobalt/40" size={15} aria-hidden="true" />
                </div>

                <h2 className="text-sm font-semibold leading-snug line-clamp-2">{campaign.campaignName}</h2>

                <p className="text-xs leading-5 text-ink/55 line-clamp-2">{campaign.result.primaryText}</p>

                <div className="mt-auto flex items-center gap-1.5 text-[11px] text-ink/40">
                  <Calendar size={11} aria-hidden="true" />
                  <span>{date} às {time}</span>
                </div>
              </button>
            );
          })
        ) : null}
      </section>

      {selectedCampaign ? (
        <CampaignDetailModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      ) : null}
    </>
  );
}

function CampaignDetailModal({
  campaign,
  onClose,
}: {
  campaign: CampaignHistoryItem;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = getStatusDisplay(campaign.publicationStatus, campaign.publishMode);
  const StatusIcon = status.Icon;
  const { date, time } = formatDateTime(campaign.createdAt);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteCampaignAction(campaign.id);
      if (result.error) {
        alert(result.error);
        setConfirmDelete(false);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      aria-labelledby="campaign-detail-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
      onClick={onClose}
      role="dialog"
    >
      <section
        className="surface-modal mx-auto w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[32px] p-5 shadow-glass sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.color}`}>
              <StatusIcon size={14} aria-hidden="true" />
              {status.label}
            </span>
            <span className="text-xs text-ink/40">{date} às {time}</span>
          </div>
          <button
            className="icon-button shrink-0"
            onClick={onClose}
            type="button"
            title="Fechar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <h2
          id="campaign-detail-title"
          className="mt-4 text-xl font-semibold leading-tight sm:text-2xl"
        >
          {campaign.campaignName}
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40">
              Copy Principal
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-ink/70">
              {campaign.result.primaryText}
            </p>
          </div>

          {campaign.result.headline ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                Headline
              </h3>
              <p className="mt-1.5 text-sm text-ink/70">{campaign.result.headline}</p>
            </div>
          ) : null}

          {campaign.result.description ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                Descrição
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-ink/70">{campaign.result.description}</p>
            </div>
          ) : null}

          {campaign.result.callToAction ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                Chamada para ação (CTA)
              </h3>
              <p className="mt-1.5 text-sm text-ink/70">{campaign.result.callToAction}</p>
            </div>
          ) : null}

          {campaign.result.variants && campaign.result.variants.length > 0 ? (
            <div className="border-t border-ink/5 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40 mb-2">
                Variações Geradas
              </h3>
              <ul className="space-y-2">
                {campaign.result.variants.map((variant, index) => (
                  <li
                    key={index}
                    className="rounded-xl bg-white/40 p-3 text-sm leading-6 text-ink/62 shadow-sm"
                  >
                    {variant}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-ink/5 pt-4">
            <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold text-ink/58">
              {campaign.input.audience}
            </span>
            {campaign.region ? (
              <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold text-ink/58">
                {campaign.region}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-ink/5 pt-5 sm:flex-row">
          <Link
            href={`/dashboard/anuncios/${campaign.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-cobalt px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cobalt/90"
            onClick={onClose}
          >
            <ArrowUpRight size={15} aria-hidden="true" />
            Revisar e publicar
          </Link>
          <Link
            href={`/dashboard/criacoes/campanhas?copyFrom=${campaign.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/60 px-5 py-2.5 text-sm font-semibold text-cobalt transition-colors hover:bg-white border border-cobalt/15"
            onClick={onClose}
          >
            <Copy size={15} aria-hidden="true" />
            Reaproveitar ideia
          </Link>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors sm:ml-auto ${
              confirmDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white/60 text-red-600 hover:bg-red-50 border border-red-200/50"
            }`}
          >
            <Trash2 size={15} aria-hidden="true" />
            {isPending ? "Excluindo..." : confirmDelete ? "Confirmar exclusão" : "Excluir"}
          </button>
        </div>
      </section>
    </div>
  );
}

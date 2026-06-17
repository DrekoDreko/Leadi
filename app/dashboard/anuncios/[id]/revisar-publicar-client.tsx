"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Megaphone,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  XCircle
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { Card } from "@/components/ui/card";
import type { CampaignHistoryItem } from "@/lib/campaigns/types";

type ReviewLike = {
  riskLevel: "low" | "medium" | "high";
  score: number;
  reasons: Array<{ title: string; detail: string; severity: "low" | "medium" | "high" }>;
  suggestions: string[];
  rewrittenText: string;
  disclaimer: string;
};

type MetaAssets = {
  pageName: string | null;
  adAccountName: string | null;
  leadFormName: string | null;
};

const riskBadge = {
  low: { label: "Risco baixo", className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  medium: { label: "Risco médio", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  high: { label: "Risco alto", className: "bg-red-500/15 text-red-700 dark:text-red-300" }
} as const;

export function RevisarPublicarClient({
  campaign,
  initialReview,
  metaAssets,
  creativeImages,
  statusCard
}: {
  campaign: CampaignHistoryItem;
  initialReview: ReviewLike;
  metaAssets: MetaAssets;
  creativeImages: Array<{ url: string; filename: string }>;
  statusCard?: React.ReactNode;
}) {
  const router = useRouter();

  const [copy, setCopy] = useState({
    primaryText: campaign.result.primaryText,
    headline: campaign.result.headline,
    description: campaign.result.description,
    callToAction: campaign.result.callToAction
  });
  const [savedCopy, setSavedCopy] = useState(copy);
  const [review, setReview] = useState<ReviewLike>(initialReview);
  const [aiReview, setAiReview] = useState<ReviewLike | null>(null);
  const [dailyBudget, setDailyBudget] = useState("20");

  const [isSavingCopy, setIsSavingCopy] = useState(false);
  const [isReviewingAi, setIsReviewingAi] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [publishResult, setPublishResult] = useState<{
    metaCampaignId: string | null;
    metaAdId: string | null;
    message: string;
  } | null>(null);

  const copyDirty =
    copy.primaryText !== savedCopy.primaryText ||
    copy.headline !== savedCopy.headline ||
    copy.description !== savedCopy.description ||
    copy.callToAction !== savedCopy.callToAction;

  // So existe na Meta quem tem meta_campaign_id. Tanto "published" quanto "paused"
  // reais sempre carregam esse id (gravados juntos no fluxo de publish), entao ele e
  // o unico sinal honesto de "ja publicado". Checar publicationStatus="paused" sem id
  // dava falso-positivo para campanhas geradas em modo pausado mas nunca enviadas.
  const alreadyPublished = Boolean(campaign.metaCampaignId);

  const approvalOk =
    campaign.approvalStatus === "approved" || campaign.approvalStatus === "not_required";
  const assetsOk = Boolean(campaign.metaPageId && campaign.metaAdAccountId && campaign.metaLeadFormId);
  const complianceOk = review.riskLevel !== "high";
  const budgetValue = Number(dailyBudget);
  const budgetOk = Number.isFinite(budgetValue) && budgetValue >= 1;

  const blockers = useMemo(() => {
    const items: string[] = [];
    if (!approvalOk) items.push("A campanha precisa estar aprovada.");
    if (!campaign.metaPageId) items.push("Vincule uma página do Meta.");
    if (!campaign.metaAdAccountId) items.push("Vincule uma conta de anúncio.");
    if (!campaign.metaLeadFormId) items.push("Vincule um formulário de lead.");
    if (!complianceOk) items.push("Ajuste o texto: o risco de compliance está alto.");
    if (!budgetOk) items.push("Informe um orçamento diário válido (mínimo R$ 1,00).");
    if (copyDirty) items.push("Salve os textos editados antes de publicar.");
    return items;
  }, [approvalOk, campaign, complianceOk, budgetOk, copyDirty]);

  const canPublish = blockers.length === 0 && !isPublishing && !publishResult && !alreadyPublished;

  async function handleSaveCopy() {
    setError("");
    setIsSavingCopy(true);
    try {
      const response = await fetch("/api/campaigns/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, ...copy })
      });
      const payload = (await response.json().catch(() => null)) as
        | { campaign?: CampaignHistoryItem; review?: ReviewLike; error?: string }
        | null;

      if (!response.ok || !payload?.campaign || !payload.review) {
        setError(payload?.error ?? "Não foi possível salvar os textos.");
        return;
      }

      const next = {
        primaryText: payload.campaign.result.primaryText,
        headline: payload.campaign.result.headline,
        description: payload.campaign.result.description,
        callToAction: payload.campaign.result.callToAction
      };
      setCopy(next);
      setSavedCopy(next);
      setReview(payload.review);
      setAiReview(null);
    } catch {
      setError("Não foi possível salvar os textos. Tente novamente.");
    } finally {
      setIsSavingCopy(false);
    }
  }

  async function handleAiReview() {
    setError("");
    setIsReviewingAi(true);
    try {
      const text = [copy.primaryText, copy.headline, copy.description, copy.callToAction]
        .filter(Boolean)
        .join("\n");
      const response = await fetch("/api/compliance/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          channel: "meta_ads",
          audience: campaign.audience,
          objective: campaign.offer
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { review?: ReviewLike; error?: string }
        | null;

      if (!response.ok || !payload?.review) {
        setError(payload?.error ?? "Não foi possível rodar a revisão por IA.");
        return;
      }
      setAiReview(payload.review);
    } catch {
      setError("Não foi possível rodar a revisão por IA. Tente novamente.");
    } finally {
      setIsReviewingAi(false);
    }
  }

  async function handlePublish() {
    setError("");
    setIsPublishing(true);
    try {
      const response = await fetch("/api/campaigns/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          publishMode: "paused",
          dailyBudget: budgetValue
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { campaign?: CampaignHistoryItem; error?: string }
        | null;

      if (!response.ok || !payload?.campaign) {
        setError(payload?.error ?? "Não foi possível publicar a campanha na Meta.");
        return;
      }

      setPublishResult({
        metaCampaignId: payload.campaign.metaCampaignId,
        metaAdId: payload.campaign.metaAdId,
        message: payload.campaign.metaAdId
          ? "Campanha e anúncio publicados na Meta em modo pausado. A ativação continua manual."
          : "Campanha criada na Meta em modo pausado. Vincule página e formulário para gerar o anúncio completo."
      });
      router.refresh();
    } catch {
      setError("Não foi possível publicar a campanha na Meta. Tente novamente.");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Anúncios"
        title="Revisar e publicar"
        description="Revise o texto, confira os ativos vinculados ao Meta e publique a campanha em modo pausado."
      />

      {statusCard}

      {error ? (
        <div className="flex items-start gap-3 rounded-[24px] border border-red-200/70 bg-red-50/80 p-4 text-sm text-red-800">
          <XCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      {publishResult ? (
        <div className="flex items-start gap-3 rounded-[24px] border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">{publishResult.message}</p>
            <p className="text-emerald-800/80">
              ID da campanha no Meta: {publishResult.metaCampaignId ?? "—"}
              {publishResult.metaAdId ? ` · Anúncio: ${publishResult.metaAdId}` : ""}
            </p>
            <a
              className="inline-flex items-center gap-1 font-semibold underline"
              href="https://business.facebook.com/adsmanager/manage/campaigns"
              rel="noreferrer"
              target="_blank"
            >
              Abrir o Gerenciador de Anúncios
            </a>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coluna de textos */}
        <section className="space-y-4 lg:col-span-2">
          <Card className="rounded-[28px] border border-white/50 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{campaign.campaignName}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cobalt/10 px-3 py-1 text-xs font-semibold text-cobalt">
                <Megaphone size={13} aria-hidden="true" />
                Texto do anúncio
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Copy principal">
                <textarea
                  className="min-h-[110px] w-full resize-y rounded-[18px] border border-white/60 bg-white/70 p-3 text-sm leading-6 text-ink outline-none focus:border-cobalt/40 dark:bg-white/10 dark:text-cloud"
                  onChange={(e) => setCopy((c) => ({ ...c, primaryText: e.target.value }))}
                  value={copy.primaryText}
                />
              </Field>
              <Field label="Headline">
                <input
                  className="w-full rounded-[14px] border border-white/60 bg-white/70 p-3 text-sm text-ink outline-none focus:border-cobalt/40 dark:bg-white/10 dark:text-cloud"
                  onChange={(e) => setCopy((c) => ({ ...c, headline: e.target.value }))}
                  value={copy.headline}
                />
              </Field>
              <Field label="Descrição">
                <textarea
                  className="min-h-[70px] w-full resize-y rounded-[18px] border border-white/60 bg-white/70 p-3 text-sm leading-6 text-ink outline-none focus:border-cobalt/40 dark:bg-white/10 dark:text-cloud"
                  onChange={(e) => setCopy((c) => ({ ...c, description: e.target.value }))}
                  value={copy.description}
                />
              </Field>
              <Field label="Chamada para ação (CTA)">
                <input
                  className="w-full rounded-[14px] border border-white/60 bg-white/70 p-3 text-sm text-ink outline-none focus:border-cobalt/40 dark:bg-white/10 dark:text-cloud"
                  onChange={(e) => setCopy((c) => ({ ...c, callToAction: e.target.value }))}
                  value={copy.callToAction}
                />
              </Field>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cloud disabled:opacity-50"
                disabled={!copyDirty || isSavingCopy}
                onClick={handleSaveCopy}
                type="button"
              >
                {isSavingCopy ? <Loader2 className="animate-spin" size={16} /> : null}
                Salvar textos
              </button>
              {copyDirty ? (
                <span className="text-xs text-ink/55">Há alterações não salvas.</span>
              ) : null}
            </div>
          </Card>

          {creativeImages.length > 0 ? (
            <Card className="rounded-[28px] border border-white/50 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <ImageIcon className="text-cobalt" size={18} aria-hidden="true" />
                  Criativos do anúncio
                </h2>
                <span className="text-xs font-medium text-ink/50">
                  {creativeImages.length} {creativeImages.length === 1 ? "criativo" : "criativos"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {creativeImages.map((img, index) => (
                  <a
                    className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px] border border-white/60 bg-white/40 transition hover:border-cobalt/50 hover:shadow-md"
                    href={img.url}
                    key={img.url}
                    rel="noreferrer"
                    target="_blank"
                    title={img.filename ?? `Criativo ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.filename ?? `Criativo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink/75 px-1 text-[10px] font-semibold text-cloud">
                      {index + 1}
                    </span>
                  </a>
                ))}
              </div>
            </Card>
          ) : null}

          {/* Validador de compliance */}
          <Card className="rounded-[28px] border border-white/50 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck className="text-cobalt" size={18} aria-hidden="true" />
                Validação de compliance
              </h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadge[review.riskLevel].className}`}>
                {riskBadge[review.riskLevel].label}
              </span>
            </div>

            {review.riskLevel === "high" ? (
              <p className="mt-3 flex items-start gap-2 rounded-[18px] border border-red-200/70 bg-red-50/70 p-3 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
                Risco alto bloqueia a publicação. Ajuste os pontos abaixo e salve os textos.
              </p>
            ) : null}

            {review.reasons.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {review.reasons.map((reason, index) => (
                  <li
                    className="rounded-[16px] border border-white/60 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/10"
                    key={`${reason.title}-${index}`}
                  >
                    <p className="font-semibold text-ink dark:text-cloud">{reason.title}</p>
                    <p className="mt-0.5 text-ink/64 dark:text-cloud/64">{reason.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-ink/64">Nenhum ponto sensível encontrado pelas regras locais.</p>
            )}

            {review.suggestions.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Sugestões</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/70 dark:text-cloud/70">
                  {review.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5 border-t border-ink/5 pt-4 dark:border-white/5">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-cobalt/25 bg-cobalt/5 px-4 py-2 text-sm font-semibold text-cobalt disabled:opacity-50"
                disabled={isReviewingAi}
                onClick={handleAiReview}
                type="button"
              >
                {isReviewingAi ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />}
                Revisão por IA (10 créditos)
              </button>
              {aiReview ? (
                <div className="mt-4 rounded-[18px] border border-cobalt/20 bg-cobalt/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Resultado da IA</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadge[aiReview.riskLevel].className}`}>
                      {riskBadge[aiReview.riskLevel].label}
                    </span>
                  </div>
                  {aiReview.reasons.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-sm text-ink/70 dark:text-cloud/70">
                      {aiReview.reasons.map((reason, index) => (
                        <li key={index}>
                          <span className="font-medium">{reason.title}:</span> {reason.detail}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {aiReview.rewrittenText ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                        Sugestão de reescrita
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm text-ink/75 dark:text-cloud/75">
                        {aiReview.rewrittenText}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Card>
        </section>

        {/* Coluna lateral: prontidão + publicar */}
        <section className="space-y-4">
          <Card className="rounded-[28px] border border-white/50 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-semibold">Prontidão para o Meta</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <ReadinessRow label="Aprovação" ok={approvalOk} value={approvalLabel(campaign.approvalStatus)} />
              <ReadinessRow label="Página" ok={Boolean(campaign.metaPageId)} value={metaAssets.pageName ?? "Não vinculada"} />
              <ReadinessRow
                label="Conta de anúncio"
                ok={Boolean(campaign.metaAdAccountId)}
                value={metaAssets.adAccountName ?? "Não vinculada"}
              />
              <ReadinessRow
                label="Formulário de lead"
                ok={Boolean(campaign.metaLeadFormId)}
                value={metaAssets.leadFormName ?? "Não vinculado"}
              />
              <ReadinessRow label="Compliance" ok={complianceOk} value={riskBadge[review.riskLevel].label} />
            </ul>

            <div className="mt-5">
              <Field label="Orçamento diário (R$)">
                <input
                  className="w-full rounded-[14px] border border-white/60 bg-white/70 p-3 text-sm text-ink outline-none focus:border-cobalt/40 dark:bg-white/10 dark:text-cloud"
                  inputMode="decimal"
                  onChange={(e) => setDailyBudget(e.target.value)}
                  value={dailyBudget}
                />
              </Field>
            </div>

            {!assetsOk ? (
              <p className="mt-4 rounded-[16px] border border-amber-200/70 bg-amber-50/70 p-3 text-xs leading-5 text-amber-800">
                Vincule página, conta de anúncio e formulário de lead em Integrações antes de publicar. Sem
                isso, só a campanha é criada — sem conjunto nem anúncio.
              </p>
            ) : null}

            <button
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canPublish}
              onClick={handlePublish}
              type="button"
            >
              {alreadyPublished ? (
                <>
                  <CheckCircle2 size={16} />
                  Já publicado no Meta
                </>
              ) : (
                <>
                  <Megaphone size={16} />
                  Publicar pausado no Meta
                </>
              )}
            </button>

            {alreadyPublished && !publishResult ? (
              <div className="mt-3 space-y-3">
                <p className="flex items-start gap-2 rounded-[16px] border border-emerald-200/70 bg-emerald-50/70 p-3 text-xs leading-5 text-emerald-800">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
                  <span>
                    Esta campanha já foi publicada no Meta
                    {campaign.metaCampaignId ? ` (ID ${campaign.metaCampaignId})` : ""}. Pause, ative
                    ou ajuste o orçamento pelo painel <strong>Controle do anúncio</strong>, no topo
                    desta página — sem precisar abrir o Gerenciador de Anúncios.
                  </span>
                </p>
                <Link
                  href={`/dashboard/anuncios/${campaign.id}/desempenho`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cobalt/20 bg-white/60 px-5 py-3 text-sm font-semibold text-cobalt transition-colors hover:bg-white"
                >
                  <TrendingUp size={16} aria-hidden="true" />
                  Ver desempenho (gasto, leads e custo por lead)
                </Link>
              </div>
            ) : null}

            {blockers.length > 0 && !publishResult && !alreadyPublished ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-ink/55">
                {blockers.map((blocker, index) => (
                  <li key={index}>{blocker}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        </section>
      </div>

      {isPublishing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 rounded-[28px] bg-white px-10 py-10 shadow-xl">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cobalt/60" />
              <Rocket className="text-cobalt/70" size={28} aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-ink">Publicando campanha...</p>
              <p className="mt-1 text-sm text-ink/55">Enviando informações para a Meta.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</span>
      {children}
    </label>
  );
}

function ReadinessRow({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-ink/70 dark:text-cloud/70">
        {ok ? (
          <CheckCircle2 className="text-emerald-600" size={16} aria-hidden="true" />
        ) : (
          <XCircle className="text-red-500" size={16} aria-hidden="true" />
        )}
        {label}
      </span>
      <span className="text-right font-medium text-ink dark:text-cloud">{value}</span>
    </li>
  );
}

function approvalLabel(status: CampaignHistoryItem["approvalStatus"]) {
  switch (status) {
    case "approved":
      return "Aprovada";
    case "not_required":
      return "Não requerida";
    case "pending":
      return "Pendente";
    case "rejected":
      return "Rejeitada";
    case "needs_adjustment":
      return "Ajustes";
    default:
      return String(status);
  }
}

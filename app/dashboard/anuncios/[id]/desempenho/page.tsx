import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCampaignByIdForCurrentUser } from "@/lib/campaigns/repository.server";
import {
  fetchAdsInsights,
  fetchCampaignInsights,
  normalizeInsightDatePreset
} from "@/lib/meta/insights.server";
import {
  DATE_PRESET_LABELS,
  DATE_PRESET_ORDER,
  formatBRL,
  formatCostPerLead,
  formatInteger
} from "@/lib/meta/insights-format";

type DesempenhoAnuncioPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string }>;
};

export default async function DesempenhoAnuncioPage({
  params,
  searchParams
}: DesempenhoAnuncioPageProps) {
  const { id } = await params;
  const context = await requireCompletedProfile();
  if (!context.isOwner) {
    redirect("/dashboard/anuncios");
  }

  const campaign = await getCampaignByIdForCurrentUser(id);
  if (!campaign) {
    notFound();
  }

  const { periodo } = await searchParams;
  const datePreset = normalizeInsightDatePreset(periodo);

  const [summary, ads] = await Promise.all([
    fetchCampaignInsights({
      organizationId: campaign.organizationId,
      metaCampaignId: campaign.metaCampaignId,
      datePreset
    }),
    fetchAdsInsights({
      organizationId: campaign.organizationId,
      metaCampaignId: campaign.metaCampaignId,
      datePreset
    })
  ]);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Desempenho"
        title={campaign.campaignName}
        description="Resumo simples por anúncio: o que cada criativo gastou e quantos leads gerou no período."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/desempenho"
            className="inline-flex items-center gap-2 rounded-full border border-cobalt/20 bg-white/60 px-4 py-2 text-sm font-semibold text-cobalt transition-colors hover:bg-white"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar
          </Link>
          <div className="flex flex-wrap gap-1 rounded-full border border-cobalt/20 bg-white/60 p-1">
            {DATE_PRESET_ORDER.map((preset) => {
              const active = preset === datePreset;
              return (
                <Link
                  key={preset}
                  href={`/dashboard/anuncios/${id}/desempenho?periodo=${preset}`}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? "bg-cobalt text-white" : "text-cobalt hover:bg-white"
                  }`}
                >
                  {DATE_PRESET_LABELS[preset]}
                </Link>
              );
            })}
          </div>
        </div>
      </PageHeading>

      {summary ? (
        <section className="surface-card-strong rounded-[30px] p-5 md:p-6">
          <h2 className="text-lg font-semibold">Resumo da campanha</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat label="Gasto" value={formatBRL(summary.spend)} highlight />
            <Stat label="Leads" value={formatInteger(summary.leads)} highlight />
            <Stat label="Custo por lead" value={formatCostPerLead(summary.costPerLead)} />
            <Stat label="Alcance" value={formatInteger(summary.reach)} />
            <Stat label="Impressões" value={formatInteger(summary.impressions)} />
            <Stat label="Cliques" value={formatInteger(summary.clicks)} />
          </div>
        </section>
      ) : (
        <section className="glass-strong rounded-[30px] p-6">
          <p className="text-muted-soft text-sm leading-7">
            Ainda não há dados de veiculação para este período. Os resultados aparecem aqui assim que
            a campanha começar a rodar na Meta.
          </p>
        </section>
      )}

      <section className="surface-card-strong rounded-[30px] p-5 md:p-6">
        <h2 className="text-lg font-semibold">Por anúncio</h2>
        {ads.length === 0 ? (
          <p className="text-muted-soft mt-3 text-sm">
            Nenhum anúncio com dados de veiculação neste período.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {ads.map((ad) => (
              <article
                key={ad.adId}
                className="surface-card-muted rounded-[24px] p-4"
              >
                <h3 className="truncate text-base font-semibold">{ad.adName}</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                  <Stat label="Gasto" value={formatBRL(ad.spend)} compact />
                  <Stat label="Leads" value={formatInteger(ad.leads)} compact />
                  <Stat label="Custo por lead" value={formatCostPerLead(ad.costPerLead)} compact />
                  <Stat label="Alcance" value={formatInteger(ad.reach)} compact />
                  <Stat label="Cliques" value={formatInteger(ad.clicks)} compact />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
  compact = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] px-4 py-3 ${
        highlight ? "bg-cobalt/8 border border-cobalt/16" : compact ? "bg-white/40" : "surface-card-muted"
      }`}
    >
      <p className="text-muted-soft text-xs font-semibold uppercase tracking-wide">{label}</p>
      <strong className={`mt-1 block font-semibold ${compact ? "text-xl" : "text-2xl"}`}>
        {value}
      </strong>
    </div>
  );
}

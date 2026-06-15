import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { fetchCampaignInsights, normalizeInsightDatePreset } from "@/lib/meta/insights.server";
import {
  DATE_PRESET_LABELS,
  DATE_PRESET_ORDER,
  formatBRL,
  formatCostPerLead,
  formatInteger
} from "@/lib/meta/insights-format";

export default async function DesempenhoPage({
  searchParams
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const context = await requireCompletedProfile();
  if (!context.isOwner) {
    redirect("/dashboard/criacoes");
  }

  const params = await searchParams;
  const datePreset = normalizeInsightDatePreset(params.periodo);

  const campaignState = await getCampaignsForCurrentUser(50);
  const publishedCampaigns = campaignState.campaigns.filter((campaign) =>
    Boolean(campaign.metaCampaignId)
  );

  const insights = await Promise.all(
    publishedCampaigns.map(async (campaign) => ({
      campaign,
      summary: await fetchCampaignInsights({
        organizationId: campaign.organizationId,
        metaCampaignId: campaign.metaCampaignId,
        datePreset
      })
    }))
  );

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Desempenho"
        title="Resultados dos anúncios"
        description="Acompanhe gasto, leads e custo por lead de cada campanha publicada — sem precisar entrar no Gerenciador da Meta."
      >
        <div className="flex flex-wrap gap-1 rounded-full border border-cobalt/20 bg-white/60 p-1">
          {DATE_PRESET_ORDER.map((preset) => {
            const active = preset === datePreset;
            return (
              <Link
                key={preset}
                href={`/dashboard/desempenho?periodo=${preset}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-cobalt text-white" : "text-cobalt hover:bg-white"
                }`}
              >
                {DATE_PRESET_LABELS[preset]}
              </Link>
            );
          })}
        </div>
      </PageHeading>

      {publishedCampaigns.length === 0 ? (
        <section className="glass-strong rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold">Nenhuma campanha publicada ainda</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/62">
            Assim que você publicar uma campanha na Meta, os resultados (gasto, leads e custo por
            lead) aparecem aqui automaticamente.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {insights.map(({ campaign, summary }) => (
            <article key={campaign.id} className="surface-card-strong rounded-[30px] p-5 md:p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold">{campaign.campaignName}</h2>
                  <p className="text-muted-soft mt-1 text-sm">
                    {campaign.publicationStatus === "published"
                      ? "Veiculando"
                      : campaign.publicationStatus === "paused"
                        ? "Pausada"
                        : "Publicada"}
                  </p>
                </div>
                <Link
                  href={`/dashboard/anuncios/${campaign.id}/desempenho`}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-cobalt/20 bg-white/60 px-4 py-2 text-sm font-semibold text-cobalt transition-colors hover:bg-white"
                >
                  <TrendingUp size={16} aria-hidden="true" />
                  Ver por anúncio
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>

              {summary ? (
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <InsightStat label="Gasto" value={formatBRL(summary.spend)} highlight />
                  <InsightStat label="Leads" value={formatInteger(summary.leads)} highlight />
                  <InsightStat label="Custo por lead" value={formatCostPerLead(summary.costPerLead)} />
                  <InsightStat label="Alcance" value={formatInteger(summary.reach)} />
                  <InsightStat label="Impressões" value={formatInteger(summary.impressions)} />
                  <InsightStat label="Cliques" value={formatInteger(summary.clicks)} />
                </div>
              ) : (
                <p className="text-muted-soft mt-5 rounded-[22px] border border-white/46 bg-white/34 px-4 py-3 text-sm">
                  Ainda não há dados de veiculação para este período. Assim que a campanha começar a
                  rodar, os números aparecem aqui.
                </p>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function InsightStat({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] px-4 py-3 ${
        highlight ? "bg-cobalt/8 border border-cobalt/16" : "surface-card-muted"
      }`}
    >
      <p className="text-muted-soft text-xs font-semibold uppercase tracking-wide">{label}</p>
      <strong className="mt-1 block text-2xl font-semibold">{value}</strong>
    </div>
  );
}

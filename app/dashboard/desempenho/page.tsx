import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Megaphone, TrendingUp } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import {
  getCampaignsForCurrentUser,
  getPendingCampaignsForCurrentUser
} from "@/lib/campaigns/repository.server";
import { fetchCampaignInsights, normalizeInsightDatePreset } from "@/lib/meta/insights.server";
import {
  DATE_PRESET_LABELS,
  DATE_PRESET_ORDER,
  formatBRL,
  formatCostPerLead,
  formatInteger
} from "@/lib/meta/insights-format";
import { AdApprovalWorkspace } from "../campanhas/aprovacoes/ad-approval-workspace";

type Aba = "aprovacoes" | "desempenho";

export default async function CampanhasPage({
  searchParams
}: {
  searchParams: Promise<{ periodo?: string; aba?: string }>;
}) {
  const context = await requireCompletedProfile();
  if (!context.isOwner) {
    redirect("/dashboard/criacoes");
  }

  const params = await searchParams;
  const datePreset = normalizeInsightDatePreset(params.periodo);

  // Aprovações pendentes: consulta barata no banco, usada também para o badge da aba.
  const pendingState = await getPendingCampaignsForCurrentUser();
  const pendingCount = pendingState.campaigns.length;

  // Quando a aba não vem na URL, abrimos em "Aprovações" se houver algo pendente.
  const explicitAba = params.aba === "aprovacoes" || params.aba === "desempenho";
  const aba: Aba = explicitAba
    ? (params.aba as Aba)
    : pendingCount > 0
      ? "aprovacoes"
      : "desempenho";

  // Insights só são buscados na Meta quando a aba de Desempenho está ativa.
  const desempenhoData =
    aba === "desempenho" ? await loadDesempenho(datePreset) : null;

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Campanhas"
        title="Campanhas e desempenho"
        description="Aprove as campanhas enviadas pela equipe e acompanhe os resultados dos anúncios publicados — tudo em um só lugar."
      >
        <div className="flex flex-wrap gap-1 rounded-full border border-cobalt/20 bg-surface-elevated p-1">
          <TabLink
            href="/dashboard/desempenho?aba=aprovacoes"
            active={aba === "aprovacoes"}
            label="Aprovações"
            badge={pendingCount}
          />
          <TabLink
            href={`/dashboard/desempenho?aba=desempenho&periodo=${datePreset}`}
            active={aba === "desempenho"}
            label="Desempenho"
          />
        </div>
      </PageHeading>

      {aba === "aprovacoes" ? (
        <section className="surface-card rounded-[34px] p-6 md:p-8">
          <AdApprovalWorkspace
            initialCampaigns={pendingState.campaigns}
            mode={pendingState.mode}
            message={pendingState.message}
          />
        </section>
      ) : (
        <section className="surface-card space-y-6 rounded-[34px] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <Megaphone size={20} aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-cobalt">Desempenho</p>
              <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
                {desempenhoData && desempenhoData.length > 0
                  ? "Resultados dos anúncios"
                  : "Nenhuma campanha publicada ainda"}
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-ink/64">
                {desempenhoData && desempenhoData.length > 0
                  ? "Gasto, leads e custo por lead de cada campanha publicada — sem entrar no Gerenciador da Meta."
                  : "Assim que você publicar uma campanha na Meta, os resultados aparecem aqui automaticamente."}
              </p>
            </div>
            <div className="flex flex-wrap gap-1 rounded-full border border-cobalt/20 bg-surface-elevated p-1">
              {DATE_PRESET_ORDER.map((preset) => {
                const active = preset === datePreset;
                return (
                  <Link
                    key={preset}
                    href={`/dashboard/desempenho?aba=desempenho&periodo=${preset}`}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      active ? "bg-cobalt text-white" : "text-cobalt hover:bg-cobalt/10"
                    }`}
                  >
                    {DATE_PRESET_LABELS[preset]}
                  </Link>
                );
              })}
            </div>
          </div>

          {desempenhoData && desempenhoData.length > 0 ? (
            <div className="space-y-4">
              {desempenhoData.map(({ campaign, summary }) => (
                <article key={campaign.id} className="surface-card-muted rounded-[30px] p-5 md:p-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-semibold">{campaign.campaignName}</h3>
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
                      className="inline-flex w-fit items-center gap-2 rounded-full border border-cobalt/20 bg-surface-elevated px-4 py-2 text-sm font-semibold text-cobalt transition-colors hover:bg-cobalt/10"
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
                    <p className="text-muted-soft mt-5 rounded-[22px] border border-border bg-surface-elevated px-4 py-3 text-sm">
                      Ainda não há dados de veiculação para este período. Assim que a campanha
                      começar a rodar, os números aparecem aqui.
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

async function loadDesempenho(datePreset: ReturnType<typeof normalizeInsightDatePreset>) {
  const campaignState = await getCampaignsForCurrentUser(50);
  const publishedCampaigns = campaignState.campaigns.filter((campaign) =>
    Boolean(campaign.metaCampaignId)
  );

  return Promise.all(
    publishedCampaigns.map(async (campaign) => ({
      campaign,
      summary: await fetchCampaignInsights({
        organizationId: campaign.organizationId,
        metaCampaignId: campaign.metaCampaignId,
        datePreset
      })
    }))
  );
}

function TabLink({
  href,
  active,
  label,
  badge
}: {
  href: string;
  active: boolean;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-cobalt text-white" : "text-cobalt hover:bg-cobalt/10"
      }`}
    >
      {label}
      {badge && badge > 0 ? (
        <span
          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
            active ? "bg-white/20 text-white" : "bg-cobalt/10 text-cobalt"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </Link>
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

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CircleDollarSign,
  FileCheck,
  MousePointerClick,
  Users
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCampaignByIdForCurrentUser } from "@/lib/campaigns/repository.server";
import {
  fetchAdsInsights,
  fetchCampaignInsights,
  fetchCampaignInsightsSeries,
  normalizeInsightDatePreset
} from "@/lib/meta/insights.server";
import {
  DATE_PRESET_LABELS,
  DATE_PRESET_ORDER,
  formatBRL,
  formatCostPerLead,
  formatInteger
} from "@/lib/meta/insights-format";
import { CampaignControlsSection } from "../campaign-controls-section";
import { TrendArea, TrendBars, type Tone } from "../../../desempenho/performance-charts";
import { CARD_TONE, MetricCard, ReachImpressionsCard } from "../../../desempenho/metric-cards";

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

  const [summary, series, ads] = await Promise.all([
    fetchCampaignInsights({
      organizationId: campaign.organizationId,
      metaCampaignId: campaign.metaCampaignId,
      datePreset
    }),
    fetchCampaignInsightsSeries({
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
        description="Acompanhe gasto, leads e alcance da campanha e o resultado de cada criativo no período."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/desempenho"
            className="inline-flex items-center gap-2 rounded-full border border-cobalt/20 bg-surface-elevated px-4 py-2 text-sm font-semibold text-cobalt transition-colors hover:bg-cobalt/10"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar
          </Link>
          <div className="flex flex-wrap gap-1 rounded-full border border-cobalt/20 bg-surface-elevated p-1">
            {DATE_PRESET_ORDER.map((preset) => {
              const active = preset === datePreset;
              return (
                <Link
                  key={preset}
                  href={`/dashboard/anuncios/${id}/desempenho?periodo=${preset}`}
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
      </PageHeading>

      {summary ? (
        <section className="surface-card-strong rounded-[30px] p-5 md:p-6">
          <h2 className="text-lg font-semibold">Resumo da campanha</h2>
          <p className="text-muted-soft mt-1 text-sm">
            Evolução diária dos principais números no período selecionado.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
            {/* Card 1 (maior) — Gasto + Custo por lead */}
            <MetricCard
              className="xl:col-span-7"
              label="Gasto"
              sublabel="Quanto você investiu no período"
              value={formatBRL(summary.spend)}
              tone="blue"
              icon={CircleDollarSign}
              hero
              footer={
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-soft text-xs font-semibold uppercase tracking-wide">
                    Custo por lead
                    <span className="ml-1.5 font-normal normal-case tracking-normal opacity-80">
                      (gasto ÷ leads)
                    </span>
                  </span>
                  <strong className="text-lg font-semibold">
                    {formatCostPerLead(summary.costPerLead)}
                  </strong>
                </div>
              }
            >
              <TrendArea
                points={series.map((point) => ({ date: point.date, value: point.spend }))}
                tone="blue"
                label="Gasto"
                kind="currency"
                emptyMessage="Sem gasto registrado neste período."
              />
            </MetricCard>

            {/* Card 2 — Leads */}
            <MetricCard
              className="xl:col-span-5"
              label="Leads"
              sublabel="Pessoas que preencheram o formulário"
              value={formatInteger(summary.leads)}
              tone="green"
              icon={Users}
            >
              <TrendBars
                points={series.map((point) => ({ date: point.date, value: point.leads }))}
                tone="green"
                label="Leads"
                emptyMessage="Nenhum lead neste período ainda — eles aparecem aqui assim que alguém preencher o formulário."
              />
            </MetricCard>

            {/* Card 3 — Cliques */}
            <MetricCard
              className="xl:col-span-5"
              label="Cliques"
              sublabel="Vezes que clicaram no anúncio"
              value={formatInteger(summary.clicks)}
              tone="teal"
              icon={MousePointerClick}
            >
              <TrendBars
                points={series.map((point) => ({ date: point.date, value: point.clicks }))}
                tone="teal"
                label="Cliques"
                emptyMessage="Nenhum clique registrado neste período."
              />
            </MetricCard>

            {/* Card 4 (maior) — Alcance + Impressões na mesma escala */}
            <ReachImpressionsCard
              className="xl:col-span-7"
              reachValue={formatInteger(summary.reach)}
              impressionsValue={formatInteger(summary.impressions)}
              reachPoints={series.map((point) => ({ date: point.date, value: point.reach }))}
              impressionsPoints={series.map((point) => ({
                date: point.date,
                value: point.impressions
              }))}
            />
          </div>
        </section>
      ) : (
        <section className="surface-card-strong rounded-[30px] p-6">
          <p className="text-muted-soft text-sm leading-7">
            Ainda não há dados de veiculação para este período. Os resultados aparecem aqui assim que
            a campanha começar a rodar na Meta.
          </p>
        </section>
      )}

      <section className="surface-card-strong rounded-[30px] p-5 md:p-6">
        <h2 className="text-lg font-semibold">Por anúncio</h2>
        <p className="text-muted-soft mt-1 text-sm">
          O que cada criativo gastou e quantos leads gerou no período.
        </p>
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
                  <Stat label="Gasto" value={formatBRL(ad.spend)} tone="blue" />
                  <Stat label="Leads" value={formatInteger(ad.leads)} tone="green" />
                  <Stat label="Custo por lead" value={formatCostPerLead(ad.costPerLead)} />
                  <Stat label="Alcance" value={formatInteger(ad.reach)} />
                  <Stat label="Cliques" value={formatInteger(ad.clicks)} tone="teal" />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Mesmos controles de veiculação da página do anúncio: status real na Meta,
          pausar/ativar, orçamento diário e forma de pagamento. */}
      <CampaignControlsSection campaign={campaign} />

      {/* A revisão completa (textos, criativos, compliance e prontidão) vive na
          página do anúncio — aqui fica só o atalho. */}
      <section className="surface-card-strong flex flex-col gap-4 rounded-[30px] p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-cobalt">Anúncios</p>
          <h2 className="mt-1 text-lg font-semibold">Revisar e publicar</h2>
          <p className="text-muted-soft mt-1 text-sm leading-6">
            Edite os textos, confira os criativos e a prontidão para o Meta na página do anúncio.
          </p>
        </div>
        <Link
          href={`/dashboard/anuncios/${id}`}
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-cobalt/20 bg-surface-elevated px-4 py-2 text-sm font-semibold text-cobalt transition-colors hover:bg-cobalt/10"
        >
          <FileCheck size={16} aria-hidden="true" />
          Abrir revisão
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="rounded-[20px] bg-surface-elevated px-4 py-3">
      <p className="text-muted-soft flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
        {tone ? (
          <span className={`inline-block h-2 w-2 rounded-full ${CARD_TONE[tone].dot}`} />
        ) : null}
        {label}
      </p>
      <strong className="mt-1 block text-xl font-semibold">{value}</strong>
    </div>
  );
}

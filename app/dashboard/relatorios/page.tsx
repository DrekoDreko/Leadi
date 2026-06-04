import Link from "next/link";
import { BarChart3, Download, Filter, Info, TrendingUp } from "lucide-react";
import { Metric, PageHeading } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import {
  formatReportDate,
  getCommercialReportForCurrentUser,
  parseCommercialReportFilters
} from "@/lib/reports/commercial-report.server";
import {
  leadPeriodFilterOptions,
  leadSourceFilterOptions,
  type LeadPeriodFilterValue,
  type LeadSourceFilterValue
} from "@/lib/leads/filters";

type RelatoriosPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  const [context, resolvedSearchParams] = await Promise.all([
    requireCompletedProfile(),
    searchParams ?? Promise.resolve({})
  ]);
  const filters = parseCommercialReportFilters(resolvedSearchParams);
  const report = await getCommercialReportForCurrentUser(context, filters);
  const exportHref = buildExportHref(resolvedSearchParams);
  const selectedSellerLabel =
    filters.seller === "all"
      ? "Todos os consultores"
      : report.sellerOptions.find((option) => option.value === filters.seller)?.label ??
        "Consultor selecionado";

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Relatórios"
        title="ROI por campanha, origem e consultor"
        description="Os indicadores abaixo usam dados reais do Supabase. Quando custo ou receita nao existem, o ROI financeiro aparece como indisponível em vez de ser inventado."
      >
        <Link
          className="surface-action-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-sm"
          href="/dashboard/relatorios"
        >
          <Download size={18} aria-hidden="true" />
          Limpar filtros
        </Link>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/92 transition"
          href={exportHref}
        >
          <Download size={18} aria-hidden="true" />
          Exportar CSV
        </Link>
      </PageHeading>

      <section className="surface-card-strong rounded-[34px] p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full surface-pill px-3 py-1.5 text-xs font-semibold">
              <Info size={14} aria-hidden="true" className="text-cobalt" />
              {report.scopeLabel}
            </div>
            <h2 className="text-2xl font-semibold md:text-3xl">Filtros do relatório</h2>
            <p className="mt-2 max-w-3xl leading-7 text-muted-soft">{report.scopeDescription}</p>
          </div>
          <div className="surface-card-muted rounded-[22px] px-5 py-4 text-sm">
            <strong className="block text-foreground">Consultor selecionado</strong>
            <span className="text-muted-soft mt-1 block">{selectedSellerLabel}</span>
          </div>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]" method="get">
          <FilterSelect
            label="Período"
            name="period"
            defaultValue={filters.period}
            options={leadPeriodFilterOptions}
          />
          <FilterSelect
            label="Origem"
            name="source"
            defaultValue={filters.source}
            options={leadSourceFilterOptions}
          />
          <FilterSelect
            label="Consultor"
            name="seller"
            defaultValue={filters.seller}
            options={[
              { value: "all", label: "Todos os consultores" },
              ...report.sellerOptions
            ]}
          />
          <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92 w-full xl:w-auto"
              type="submit"
            >
              <Filter size={18} aria-hidden="true" />
              Aplicar
            </button>
            <Link
              className="surface-action-secondary inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold w-full xl:w-auto"
              href="/dashboard/relatorios"
            >
              Limpar
            </Link>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Leads no periodo"
          value={formatInteger(report.summary.leads)}
          note={report.message ?? "dados reais"}
          tone="blue"
        />
        <Metric
          label="Vendas fechadas"
          value={formatInteger(report.summary.won)}
          note={report.summary.leads ? `${formatPercentage(report.summary.conversionRate)} de conversão` : "sem base"}
          tone="teal"
        />
        <Metric
          label="Leads qualificados"
          value={formatInteger(report.summary.qualified)}
          note="qualificação, proposta, negociação"
          tone="yellow"
        />
        <Metric
          label="ROI financeiro"
          value={report.summary.roiLabel}
          note={report.summary.roiNote}
          tone="dark"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="surface-card rounded-[34px] p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cobalt">Métricas disponíveis</p>
              <h2 className="mt-2 text-2xl font-semibold">O que o banco permite medir hoje</h2>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full surface-card-muted">
              <BarChart3 size={22} className="text-cobalt" aria-hidden="true" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {report.availableMetrics.map((item) => (
              <div key={item} className="surface-card-muted rounded-[22px] px-4 py-3.5 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 surface-alert-warning rounded-[26px] p-5 text-sm leading-6">
            <strong className="block font-semibold">Limitação financeira</strong>
            <p className="mt-2 opacity-90">
              O schema atual não traz custo por campanha nem receita por venda ligada ao lead. Por
              isso o relatório mostra ROI financeiro como indisponível e não cria valores
              estimados.
            </p>
          </div>
        </div>

        <aside className="surface-card rounded-[34px] p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cobalt">Cobertura</p>
              <h2 className="mt-2 text-2xl font-semibold">Campos encontrados</h2>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full surface-card-muted">
              <TrendingUp size={22} className="text-cobalt" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-3">
            <KeyFigure label="Campanhas registradas" value={formatInteger(report.summary.campaignCount)} />
            <KeyFigure label="Leads sem consultor" value={formatInteger(report.summary.leadsWithoutOwner)} />
            <KeyFigure label="Conversão" value={formatPercentage(report.summary.conversionRate)} />
            <KeyFigure label="Base considerada" value={filters.period === "all" ? "Todos os períodos" : getPeriodLabel(filters.period)} />
            <KeyFigure label="Origem filtrada" value={getSourceLabel(filters.source)} />
          </div>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <BreakdownCard
          title="Por campanha"
          subtitle="Campanhas identificadas nos leads ou no ID da Meta."
          rows={report.campaignRows}
          emptyLabel="Nenhuma campanha identificada para os filtros."
        />
        <BreakdownCard
          title="Por origem"
          subtitle="Distribuição por canal de entrada do lead."
          rows={report.sourceRows}
          emptyLabel="Nenhuma origem encontrada."
        />
        <BreakdownCard
          title="Por consultor"
          subtitle="Responsáveis visíveis no workspace."
          rows={report.sellerRows}
          emptyLabel="Nenhum consultor encontrado."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="surface-card rounded-[34px] p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cobalt">Campanhas criadas</p>
              <h2 className="mt-2 text-2xl font-semibold">Histórico do módulo de campanhas</h2>
            </div>
            <span className="surface-pill rounded-full px-4 py-2 text-xs font-semibold">
              {formatInteger(report.campaigns.length)} registradas
            </span>
          </div>
          {report.campaigns.length ? (
            <div className="space-y-4">
              {report.campaigns.map((campaign) => (
                <article
                  key={campaign.id}
                  className="surface-card-muted rounded-[24px] p-5 transition hover:-translate-y-0.5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold leading-tight">{campaign.name}</h3>
                      <p className="mt-1.5 text-sm text-muted-soft">
                        Criada em {formatReportDate(campaign.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span className="surface-pill rounded-full px-3 py-1.5">
                        {campaign.publicationStatus.replaceAll("_", " ")}
                      </span>
                      <span className="surface-pill rounded-full px-3 py-1.5">
                        {campaign.publishMode.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-card-muted rounded-[26px] border border-dashed border-border/50 p-6 text-sm leading-6 text-muted-soft">
              Nenhuma campanha registrada no período e no escopo selecionados.
            </div>
          )}
        </section>

        <aside className="surface-card rounded-[34px] p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cobalt">Validação</p>
              <h2 className="mt-2 text-2xl font-semibold">O que foi conferido</h2>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full surface-card-muted">
              <Info size={22} className="text-cobalt" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-3">
            {report.missingMetrics.map((item) => (
              <div
                key={item}
                className="surface-card-muted rounded-[22px] px-4 py-3.5 text-sm font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

function BreakdownCard({
  title,
  subtitle,
  rows,
  emptyLabel
}: {
  title: string;
  subtitle: string;
  rows: {
    label: string;
    leads: number;
    won: number;
    qualified: number;
    conversionRate: number;
    campaignCount: number;
    note: string;
  }[];
  emptyLabel: string;
}) {
  return (
    <section className="surface-card rounded-[34px] p-5 md:p-6 flex flex-col">
      <div className="mb-6">
        <p className="text-sm font-medium text-cobalt">Detalhamento</p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-soft">{subtitle}</p>
      </div>
      {rows.length ? (
        <div className="space-y-4 flex-1">
          {rows.map((row) => (
            <article key={row.label} className="surface-card-strong rounded-[28px] p-5 transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold leading-tight">{row.label}</h3>
                  <p className="mt-1 text-sm text-muted-soft">{row.note}</p>
                </div>
                <span className="surface-pill rounded-full px-3 py-1.5 text-xs font-semibold">
                  {formatPercentage(row.conversionRate)}
                </span>
              </div>
              <div className="mt-6 grid gap-3 grid-cols-3">
                <MiniStat label="Leads" value={formatInteger(row.leads)} />
                <MiniStat label="Vendas" value={formatInteger(row.won)} />
                <MiniStat label="Qualific." value={formatInteger(row.qualified)} />
              </div>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-strong">
                {formatInteger(row.campaignCount)} leads com campanha
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-card-muted flex flex-1 items-center justify-center rounded-[28px] border border-dashed border-border/50 p-6 text-center text-sm leading-6 text-muted-soft">
          {emptyLabel}
        </div>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  name,
  defaultValue,
  options
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-muted-strong">{label}</span>
      <select
        className="h-12 w-full rounded-[18px] border border-border/70 bg-card px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function KeyFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card-muted flex items-center justify-between rounded-[22px] px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-strong">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card-muted rounded-[20px] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-strong">{label}</p>
      <p className="mt-1.5 text-sm font-bold">{value}</p>
    </div>
  );
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercentage(value: number) {
  return `${(value * 100).toFixed(value >= 1 ? 0 : 1)}%`;
}

function getPeriodLabel(value: LeadPeriodFilterValue) {
  return leadPeriodFilterOptions.find((option) => option.value === value)?.label ?? value;
}

function getSourceLabel(value: LeadSourceFilterValue) {
  return leadSourceFilterOptions.find((option) => option.value === value)?.label ?? value;
}

function buildExportHref(searchParams: Record<string, string | string[] | undefined>) {
  const exportSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        exportSearchParams.append(key, item);
      }
      continue;
    }

    if (typeof value === "string" && value.length > 0) {
      exportSearchParams.set(key, value);
    }
  }

  const query = exportSearchParams.toString();
  return query ? `/api/leads/export?${query}` : "/api/leads/export";
}

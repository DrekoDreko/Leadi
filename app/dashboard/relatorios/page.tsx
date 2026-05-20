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
    <div className="space-y-4">
      <PageHeading
        eyebrow="Relatórios"
        title="ROI por campanha, origem e consultor"
        description="Os indicadores abaixo usam dados reais do Supabase. Quando custo ou receita nao existem, o ROI financeiro aparece como indisponivel em vez de ser inventado."
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          href="/dashboard/relatorios"
        >
          <Download size={18} aria-hidden="true" />
          Limpar filtros
        </Link>
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/72 px-5 py-3 text-sm font-semibold text-ink"
          href={exportHref}
        >
          <Download size={18} aria-hidden="true" />
          Exportar CSV
        </Link>
      </PageHeading>

      <section className="glass-strong rounded-[30px] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1.5 text-xs font-semibold text-ink/70">
              <Info size={14} aria-hidden="true" />
              {report.scopeLabel}
            </div>
            <h2 className="text-2xl font-semibold">Filtros do relatório</h2>
            <p className="mt-2 max-w-3xl leading-7 text-ink/62">{report.scopeDescription}</p>
          </div>
          <div className="rounded-[22px] bg-white/54 px-4 py-3 text-sm text-ink/66">
            <strong className="block text-ink">Consultor selecionado</strong>
            <span>{selectedSellerLabel}</span>
          </div>
        </div>

        <form className="mt-5 grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]" method="get">
          <FilterSelect
            label="Periodo"
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
          <div className="flex items-end gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              <Filter size={18} aria-hidden="true" />
              Aplicar
            </button>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/72 px-5 py-3 text-sm font-semibold text-ink"
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
          note={report.summary.leads ? `${formatPercentage(report.summary.conversionRate)} de conversao` : "sem base"}
          tone="teal"
        />
        <Metric
          label="Leads qualificados"
          value={formatInteger(report.summary.qualified)}
          note="qualificacao, proposta, negociacao"
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
        <div className="glass-strong rounded-[34px] p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cobalt">Métricas disponíveis</p>
              <h2 className="mt-2 text-2xl font-semibold">O que o banco permite medir hoje</h2>
            </div>
            <BarChart3 size={22} aria-hidden="true" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {report.availableMetrics.map((item) => (
              <div key={item} className="rounded-[22px] bg-white/52 px-4 py-3 text-sm font-semibold text-ink/76">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[26px] border border-amber-200/70 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950">
            <strong className="block">Limitação financeira</strong>
            <p className="mt-2 text-amber-900/92">
              O schema atual não traz custo por campanha nem receita por venda ligada ao lead. Por
              isso o relatório mostra ROI financeiro como indisponível e não cria valores
              estimados.
            </p>
          </div>
        </div>

        <aside className="glass rounded-[34px] p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cobalt">Cobertura</p>
              <h2 className="mt-2 text-2xl font-semibold">Campos encontrados</h2>
            </div>
            <TrendingUp size={20} aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <KeyFigure label="Campanhas registradas" value={formatInteger(report.summary.campaignCount)} />
            <KeyFigure label="Leads sem consultor" value={formatInteger(report.summary.leadsWithoutOwner)} />
            <KeyFigure label="Conversao" value={formatPercentage(report.summary.conversionRate)} />
            <KeyFigure label="Base considerada" value={filters.period === "all" ? "Todos os periodos" : getPeriodLabel(filters.period)} />
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
          subtitle="Responsáveis visiveis no workspace."
          rows={report.sellerRows}
          emptyLabel="Nenhum consultor encontrado."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="glass-strong rounded-[34px] p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cobalt">Campanhas criadas</p>
              <h2 className="mt-2 text-2xl font-semibold">Histórico do módulo de campanhas</h2>
            </div>
            <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold text-ink/68">
              {formatInteger(report.campaigns.length)} registradas
            </span>
          </div>
          {report.campaigns.length ? (
            <div className="space-y-3">
              {report.campaigns.map((campaign) => (
                <article
                  key={campaign.id}
                  className="rounded-[24px] border border-white/46 bg-white/40 p-4 shadow-soft"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <p className="mt-1 text-sm text-ink/60">
                        Criada em {formatReportDate(campaign.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-white/62 px-3 py-1.5 text-ink/72">
                        {campaign.publicationStatus.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full bg-white/62 px-3 py-1.5 text-ink/72">
                        {campaign.publishMode.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-cobalt/20 bg-white/44 p-6 text-sm leading-6 text-ink/62">
              Nenhuma campanha registrada no período e no escopo selecionados.
            </div>
          )}
        </section>

        <aside className="glass rounded-[34px] p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cobalt">Validação</p>
              <h2 className="mt-2 text-2xl font-semibold">O que foi conferido</h2>
            </div>
            <Info size={20} aria-hidden="true" />
          </div>
          <div className="space-y-3">
            {report.missingMetrics.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/52 bg-white/42 px-4 py-3 text-sm font-semibold text-ink/70"
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
    <section className="glass-strong rounded-[34px] p-5">
      <div className="mb-5">
        <p className="text-sm font-medium text-cobalt">Detalhamento</p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">{subtitle}</p>
      </div>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.label} className="rounded-[24px] border border-white/46 bg-white/40 p-4 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{row.label}</h3>
                  <p className="mt-1 text-sm text-ink/56">{row.note}</p>
                </div>
                <span className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink/72">
                  {formatPercentage(row.conversionRate)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MiniStat label="Leads" value={formatInteger(row.leads)} />
                <MiniStat label="Vendas" value={formatInteger(row.won)} />
                <MiniStat label="Qualificados" value={formatInteger(row.qualified)} />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink/42">
                {formatInteger(row.campaignCount)} leads com campanha identificada
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[26px] border border-dashed border-cobalt/20 bg-white/44 p-6 text-sm leading-6 text-ink/62">
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
      <span className="mb-2 block text-sm font-semibold text-ink/70">{label}</span>
      <select
        className="h-12 w-full rounded-[18px] border border-white/62 bg-white/68 px-4 text-sm text-ink shadow-sm outline-none transition focus:border-cobalt/40 focus:bg-white"
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
    <div className="rounded-[22px] bg-white/52 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/42">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-white/52 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/42">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
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

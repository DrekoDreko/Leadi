import { BarChart3, Download, TrendingUp } from "lucide-react";
import { Metric, PageHeading } from "@/components/dashboard/widgets";

const funnelRows = [
  { label: "Leads recebidos", value: "128", width: "w-full", color: "bg-cobalt" },
  { label: "Qualificados", value: "76", width: "w-[74%]", color: "bg-lagoon" },
  { label: "Propostas enviadas", value: "31", width: "w-[46%]", color: "bg-signal" },
  { label: "Vendas fechadas", value: "12", width: "w-[24%]", color: "bg-ink" }
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Relatórios"
        title="Performance comercial"
        description="Página dedicada para acompanhar conversão, pipeline e desempenho das campanhas."
      >
        <button className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
          <Download size={18} aria-hidden="true" />
          Exportar
        </button>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Receita prevista" value="R$ 84k" note="pipeline" tone="teal" />
        <Metric label="Conversão" value="9.4%" note="+1.2 p.p." tone="blue" />
        <Metric label="CPL médio" value="R$ 19" note="-8%" tone="yellow" />
        <Metric label="Ticket médio" value="R$ 7k" note="empresarial" tone="dark" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <section className="glass-strong rounded-[34px] p-5 h-full">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Funil do mês</h2>
            <BarChart3 size={22} aria-hidden="true" />
          </div>
          <div className="space-y-5">
            {funnelRows.map((row) => (
              <div key={row.label}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="font-semibold">{row.label}</span>
                  <span className="text-sm text-ink/58">{row.value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/48">
                  <div className={`${row.width} ${row.color} h-full rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="flex h-full flex-col">
          <section className="glass rounded-[34px] p-5 h-full">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Crescimento</h2>
              <TrendingUp size={20} aria-hidden="true" />
            </div>
            <div className="space-y-3">
              {["+18% em leads ativos", "+6 propostas hoje", "12 vendas no mês", "94% de aprovação"].map((item) => (
                <div className="rounded-[22px] bg-white/42 px-4 py-3 text-sm font-semibold" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

import { CheckCircle2, Download, FilePlus2, Upload } from "lucide-react";
import { Metric, PageHeading } from "@/components/dashboard/widgets";

const orders = [
  { title: "Carrossel para captação", status: "Briefing recebido", owner: "Design" },
  { title: "Vídeo de plano empresarial", status: "Em produção", owner: "Vídeo" },
  { title: "Criativo para lead form", status: "Revisão final", owner: "Tráfego" }
];

export default function PedidosPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Pedidos"
        title="Pedidos criativos"
        description="Página dedicada para solicitar peças, acompanhar produção e centralizar arquivos de campanha."
      >
        <button className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
          <FilePlus2 size={18} aria-hidden="true" />
          Novo pedido
        </button>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pedidos ativos" value="9" note="3 em produção" tone="dark" />
        <Metric label="Entregues" value="18" note="no mês" tone="teal" />
        <Metric label="Pendentes" value="4" note="briefing" tone="yellow" />
        <Metric label="Aprovados" value="11" note="sem ajustes" tone="blue" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <section className="glass-strong rounded-[34px] p-5 h-full">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Fila de produção</h2>
            <FilePlus2 size={21} aria-hidden="true" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {orders.map((order) => (
              <article className="rounded-[26px] bg-white/42 p-4" key={order.title}>
                <p className="text-sm text-ink/52">{order.owner}</p>
                <h3 className="mt-2 min-h-[56px] font-semibold leading-tight">{order.title}</h3>
                <span className="mt-5 inline-flex rounded-full bg-white/62 px-3 py-1.5 text-xs font-semibold">
                  {order.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <aside className="flex h-full flex-col">
          <section className="glass rounded-[34px] p-5 h-full">
            <h2 className="font-semibold">Briefing rápido</h2>
            <div className="mt-5 space-y-3">
              {["Objetivo da peça", "Formato do anúncio", "Prazo desejado", "Arquivos de apoio"].map((item) => (
                <div className="flex items-center gap-3 rounded-2xl bg-white/42 px-4 py-3" key={item}>
                  <CheckCircle2 size={18} className="text-lagoon" aria-hidden="true" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button className="icon-button" type="button" title="Enviar arquivos">
                <Upload size={18} aria-hidden="true" />
              </button>
              <button className="icon-button" type="button" title="Baixar pacote">
                <Download size={18} aria-hidden="true" />
              </button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

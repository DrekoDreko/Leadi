import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { ComplianceChecklist, Metric, PageHeading } from "@/components/dashboard/widgets";

const reviewItems = [
  "Termos de economia sem garantia",
  "Sem coleta de histórico médico",
  "Consentimento LGPD no formulário",
  "Oferta posicionada como análise consultiva"
];

export default function CompliancePage() {
  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Compliance"
        title="Revisão de anúncios"
        description="Página dedicada para checar textos, formulários e promessas antes de publicar campanhas e abrir um novo anúncio."
      >
        <button
          className="group relative isolate flex w-full max-w-[380px] items-center gap-4 overflow-hidden rounded-[28px] border border-white/24 bg-[linear-gradient(135deg,#2246e0_0%,#3462EE_58%,#4A91A8_100%)] px-5 py-4 text-left text-white shadow-[0_22px_60px_rgba(52,98,238,0.34)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_30px_72px_rgba(52,98,238,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/40"
          aria-label="Criar nova revisão de anúncio"
          type="button"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_50%,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_36%)]"
          />
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/24">
            <ShieldCheck size={20} aria-hidden="true" />
          </span>
          <span className="relative flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/74">
              Fluxo principal
            </span>
            <span className="text-lg font-semibold leading-tight">Nova revisão de anúncio</span>
            <span className="mt-1 text-sm leading-5 text-white/84">
              Crie uma análise para preparar um anúncio novo com segurança.
            </span>
          </span>
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/24 transition duration-200 group-hover:bg-white/28 group-hover:shadow-[0_10px_26px_rgba(255,255,255,0.18)] group-hover:ring-white/45">
            <ArrowRight
              size={18}
              aria-hidden="true"
              className="block -translate-x-px transition duration-200"
            />
          </span>
        </button>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Aprovados" value="22" note="últimos 30 dias" tone="teal" />
        <Metric label="Pendentes" value="3" note="em análise" tone="yellow" />
        <Metric label="Bloqueios" value="0" note="sem risco alto" tone="blue" />
        <Metric label="Score médio" value="94%" note="campanhas" tone="dark" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <section className="glass rounded-[34px] p-5 h-full">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lagoon text-white">
              <ShieldCheck size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold">Checklist padrão</h2>
              <p className="text-sm text-ink/54">Critérios básicos aprovados</p>
            </div>
          </div>
          <ComplianceChecklist />
        </section>

        <section className="glass-strong rounded-[34px] p-5 h-full">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Itens revisados</h2>
            <AlertTriangle size={20} aria-hidden="true" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {reviewItems.map((item) => (
              <div className="rounded-[24px] bg-white/42 p-4" key={item}>
                <CheckCircle2 className="text-lagoon" size={20} aria-hidden="true" />
                <p className="mt-4 font-semibold">{item}</p>
                <p className="mt-2 text-sm leading-6 text-ink/58">Aprovado para campanha consultiva.</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

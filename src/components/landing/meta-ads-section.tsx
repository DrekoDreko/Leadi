import { CheckCircle2 } from "lucide-react";

const highlights = [
  "Captura de leads do Meta Lead Ads",
  "Organização automática no CRM",
  "Separação por campanha e formulário",
  "Status comercial de cada lead",
  "Distribuição para vendedores",
  "Acompanhamento de conversão",
  "Histórico completo de contato"
];

export function MetaAdsSection() {
  return (
    <section className="section-shell pb-24" id="meta-ads">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-3 text-sm font-medium text-cobalt">Meta Lead Ads</p>
          <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
            Feito para quem vende através do Facebook e Instagram
          </h2>
          <p className="mt-4 text-lg leading-7 text-ink/64">
            O LeadHealth foi pensado para operações que captam leads por formulários do Meta Lead Ads e precisam transformar esses contatos em oportunidades reais dentro de um processo comercial organizado.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li className="flex items-center gap-3" key={h}>
                <CheckCircle2 size={18} className="shrink-0 text-cobalt" aria-hidden="true" />
                <span className="text-sm font-medium text-ink/80">{h}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 inline-flex rounded-full bg-signal/20 px-4 py-2 text-sm font-medium text-ink/70">
            Integração com Meta Lead Ads em implantação
          </div>
        </div>
        <div className="glass-strong rounded-[34px] p-8">
          <div className="space-y-4">
            {[
              { label: "Campanha", value: "PME - Julho 2025", color: "bg-cobalt/10 text-cobalt" },
              { label: "Formulário", value: "Form Empresarial MEI", color: "bg-signal/30 text-ink" },
              { label: "Leads captados", value: "47 leads", color: "bg-green-100 text-green-700" },
              { label: "Em atendimento", value: "23 leads", color: "bg-blue-100 text-blue-700" },
              { label: "Em proposta", value: "8 leads", color: "bg-purple-100 text-purple-700" },
              { label: "Convertidos", value: "3 leads", color: "bg-signal/30 text-ink" }
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-[18px] bg-white/50 px-4 py-3">
                <span className="text-sm text-ink/60">{row.label}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.color}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

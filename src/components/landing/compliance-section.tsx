import { ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";

const risks = [
  "Perguntas sensíveis sobre saúde",
  "Promessas de economia garantida",
  "Linguagem agressiva ou imprecisa",
  "Textos com risco de reprovação no Meta",
  "Abordagens que parecem enganosas"
];

export function ComplianceSection() {
  return (
    <section className="section-shell pb-24" id="seguranca">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cobalt text-white shadow-soft">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <p className="mb-3 text-sm font-medium text-cobalt">Compliance comercial</p>
          <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
            Venda com uma linguagem mais segura
          </h2>
          <p className="mt-4 text-lg leading-7 text-ink/64">
            O sistema ajuda a identificar e evitar comunicações que podem gerar problemas em campanhas ou impressão negativa no cliente.
          </p>
          <ul className="mt-6 space-y-3">
            {risks.map((r) => (
              <li key={r} className="flex items-center gap-3">
                <XCircle size={16} className="shrink-0 text-red-400" aria-hidden="true" />
                <span className="text-sm text-ink/70">{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="glass-strong rounded-[28px] p-6">
            <div className="mb-3 flex items-center gap-2">
              <XCircle size={16} className="text-red-400" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wide text-red-400">Linguagem de risco</span>
            </div>
            <p className="rounded-[16px] bg-red-50/60 px-4 py-3 text-sm font-medium text-red-700">
              &ldquo;Está pagando caro no plano de saúde? Economize agora com garantia!&rdquo;
            </p>
          </div>
          <div className="glass-strong rounded-[28px] p-6">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-cobalt" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wide text-cobalt">Linguagem recomendada</span>
            </div>
            <p className="rounded-[16px] bg-cobalt/5 px-4 py-3 text-sm font-medium text-cobalt">
              &ldquo;Compare alternativas de contratação empresarial com orientação especializada.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

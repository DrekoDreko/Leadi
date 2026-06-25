import { CheckCircle2, XCircle } from "lucide-react";

const withoutLeadi = [
  "Leads espalhados em planilhas e prints de WhatsApp",
  "Demora no primeiro contato — o lead esfria e fecha com o concorrente",
  "Anúncio com linguagem de risco que pode ser reprovado no Meta",
  "Sem saber quanto custa cada lead nem onde o funil trava"
];

const withLeadi = [
  "Todos os leads do Facebook e Instagram em um CRM único",
  "Próxima ação clara para abordar o lead enquanto está quente",
  "Checklist de compliance revisa a linguagem antes de publicar",
  "Custo por lead e funil comercial visíveis em tempo real"
];

export function PainSection() {
  return (
    <section className="section-shell px-4 pb-24" id="problema">
      <div className="mb-12 max-w-3xl mx-auto text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-cobalt">O problema real</p>
        <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-ink dark:text-cloud md:text-5xl">
          Seu anúncio pode até gerar leads. O problema começa depois.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink/64 dark:text-cloud/70 md:text-lg">
          Quem vende plano de saúde sabe: o lead que não recebe resposta rápida compra de outro corretor. O Leadi organiza a operação para isso parar de acontecer.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-[28px] border border-rose-500/15 bg-rose-500/[0.04] p-6 shadow-soft dark:border-rose-400/16 dark:bg-rose-500/[0.07] md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500/80 dark:text-rose-400/85">
            Sem o Leadi
          </p>
          <ul className="mt-5 space-y-4">
            {withoutLeadi.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink/72 dark:text-cloud/78 md:text-base">
                <XCircle size={18} className="mt-0.5 shrink-0 text-rose-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-cobalt/18 bg-cobalt/[0.05] p-6 shadow-soft dark:border-cobalt/28 dark:bg-cobalt/[0.10] md:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(52,98,238,0.12),transparent_55%)]"
          />
          <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-cobalt">
            Com o Leadi
          </p>
          <ul className="relative mt-5 space-y-4">
            {withLeadi.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm font-medium leading-relaxed text-ink/82 dark:text-cloud/88 md:text-base">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-cobalt" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

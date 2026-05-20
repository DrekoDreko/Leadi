const steps = [
  {
    num: "01",
    title: "Conecte sua operação",
    desc: "Organize seus formulários, consultores e canais de atendimento em um ambiente centralizado."
  },
  {
    num: "02",
    title: "Receba leads do Meta",
    desc: "Leads de campanhas no Facebook e Instagram entram no CRM para acompanhamento imediato."
  },
  {
    num: "03",
    title: "Priorize e acompanhe",
    desc: "Veja status, responsável, histórico, proposta e próxima ação de cada oportunidade."
  },
  {
    num: "04",
    title: "Converta com mais controle",
    desc: "Use IA para mensagens, campanhas e linguagem consultiva sem perder o controle humano da venda."
  }
];

export function HowItWorksSection() {
  return (
    <section className="section-shell pb-24" id="como-funciona">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-cobalt">Como funciona</p>
        <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Do lead captado à oportunidade acompanhada
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div className="relative" key={step.num}>
            {i < steps.length - 1 && (
              <div className="absolute left-[calc(50%+2rem)] top-6 hidden h-px w-[calc(100%-1rem)] bg-ink/10 lg:block" />
            )}
            <div className="glass-strong rounded-[28px] p-6">
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-cobalt text-sm font-bold text-white shadow-soft">
                {step.num}
              </span>
              <h3 className="text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/64">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

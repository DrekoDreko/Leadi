import { CheckCircle2 } from "lucide-react";

const benefits = [
  { title: "Menos leads perdidos", desc: "Ajuda a garantir que nenhum contato fique sem acompanhamento ou resposta." },
  { title: "Atendimento mais rápido", desc: "Facilita o primeiro contato logo após a chegada do lead no sistema." },
  { title: "Mais clareza no funil", desc: "Cada oportunidade tem um status claro e um próximo passo definido." },
  { title: "Campanhas mais organizadas", desc: "Histórico e padronização reduzem retrabalho e melhora de resultados." },
  { title: "Melhor controle por consultor", desc: "Veja a performance de cada membro da equipe com rastreio claro." },
  { title: "Histórico centralizado", desc: "Tudo registrado: proposta, contato, combinado e próxima ação." },
  { title: "Menos dependência de planilhas", desc: "Substitui controles manuais por um processo estruturado e digital." },
  { title: "Mais previsibilidade comercial", desc: "Visualize o funil e antecipe o comportamento da operação." }
];

export function BenefitsSection() {
  return (
    <section className="section-shell pb-24" id="beneficios">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-cobalt">Benefícios</p>
        <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
          O que muda na rotina da sua equipe
        </h2>
        <p className="mt-4 text-lg leading-7 text-ink/64">
          Com uma operação mais organizada, a equipe ganha mais tempo para o que realmente importa: atender bem e conduzir a negociação.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b) => (
          <div className="glass-strong rounded-[24px] p-5" key={b.title}>
            <CheckCircle2 size={18} className="mb-3 text-cobalt" aria-hidden="true" />
            <h3 className="text-sm font-semibold">{b.title}</h3>
            <p className="mt-1.5 text-sm leading-5 text-ink/60">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

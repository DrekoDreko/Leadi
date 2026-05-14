import {
  BarChart2,
  BrainCircuit,
  CheckSquare,
  Filter,
  MessageCircle,
  Share2,
  ShieldCheck,
  UsersRound
} from "lucide-react";

const solutions = [
  { icon: UsersRound, title: "CRM de leads", desc: "Centralize todos os contatos em um único painel organizado por status e responsável." },
  { icon: Filter, title: "Funil de oportunidades", desc: "Acompanhe cada lead desde o primeiro contato até a proposta e fechamento." },
  { icon: Share2, title: "Captação do Meta", desc: "Preparado para integração com Meta Lead Ads para organização automática no CRM." },
  { icon: BrainCircuit, title: "IA comercial", desc: "Sugestão de campanhas, textos e mensagens com linguagem consultiva e segura." },
  { icon: MessageCircle, title: "Mensagens WhatsApp", desc: "Gere mensagens consultivas para cada etapa do atendimento com apoio de IA." },
  { icon: CheckSquare, title: "Compliance de anúncios", desc: "Checklist que ajuda a evitar linguagem sensível antes de publicar campanhas." },
  { icon: BarChart2, title: "Painel de métricas", desc: "Leads por campanha, conversão por vendedor e status da operação em tempo real." },
  { icon: ShieldCheck, title: "Segurança e LGPD", desc: "Dados comerciais organizados com controle de acesso e boas práticas de privacidade." }
];

export function SolutionSection() {
  return (
    <section className="section-shell pb-24" id="produto">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-cobalt">A solução</p>
        <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Uma operação comercial completa para leads do Meta
        </h2>
        <p className="mt-4 text-lg leading-7 text-ink/64">
          O LeadHealth une captação, CRM, funil, IA e compliance em uma plataforma focada em plano de saúde empresarial.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {solutions.map((s) => (
          <div className="glass rounded-[28px] p-5" key={s.title}>
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
              <s.icon size={20} aria-hidden="true" />
            </span>
            <h3 className="font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/64">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

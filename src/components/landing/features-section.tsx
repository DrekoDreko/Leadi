import {
  Bell,
  BarChart2,
  CheckSquare,
  FileInput,
  FileText,
  Filter,
  History,
  MessageCircle,
  Share2,
  Sparkles,
  Users,
  UsersRound
} from "lucide-react";

const features = [
  { icon: UsersRound, title: "CRM de leads", desc: "Painel central com todos os contatos, status e responsáveis." },
  { icon: Filter, title: "Funil de oportunidades", desc: "Visualize e mova leads pelas etapas do processo comercial." },
  { icon: FileInput, title: "Importação de leads", desc: "Importe contatos manualmente ou via formulários do Meta." },
  { icon: Share2, title: "Integração Meta Lead Ads", desc: "Preparado para receber leads de formulários do Facebook e Instagram." },
  { icon: Sparkles, title: "Campanhas com IA", desc: "Crie briefings e textos de campanha com apoio de inteligência artificial." },
  { icon: MessageCircle, title: "Mensagens WhatsApp com IA", desc: "Gere mensagens consultivas para cada etapa do atendimento." },
  { icon: CheckSquare, title: "Checklist de compliance", desc: "Verifique linguagem sensível antes de publicar anúncios." },
  { icon: Users, title: "Distribuição de leads", desc: "Atribua oportunidades a consultores com equilíbrio e rastreio." },
  { icon: Bell, title: "Agenda e lembretes", desc: "Agende próximos contatos e receba alertas de follow-up." },
  { icon: History, title: "Histórico de atendimento", desc: "Registros de tudo que foi dito, proposto e combinado." },
  { icon: BarChart2, title: "Painel de métricas", desc: "Leads por campanha, conversão por consultor e visão geral." },
  { icon: FileText, title: "Gestão de propostas", desc: "Associe planos e propostas a cada oportunidade no funil." }
];

export function FeaturesSection() {
  return (
    <section className="section-shell pb-24" id="recursos">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-cobalt">Recursos</p>
        <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Tudo que sua operação precisa em um lugar
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {features.map((f) => (
          <div className="glass rounded-[24px] p-5" key={f.title}>
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
              <f.icon size={18} aria-hidden="true" />
            </span>
            <h3 className="text-sm font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-5 text-ink/60">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

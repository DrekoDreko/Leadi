import Link from "next/link";
import { Clock3, Copy, MessageCircle, Send, Sparkles } from "lucide-react";
import { leads, type Lead } from "@/data/mock";
import { Metric, PageHeading } from "@/components/dashboard/widgets";

type WhatsAppPageProps = {
  searchParams?: Promise<{
    lead?: string | string[];
  }>;
};

function generatePrimaryMessage(lead: Lead) {
  const firstName = lead.name.split(" ")[0];

  return `Olá, ${firstName}! Aqui é o time da LeadHealth. Vi o seu interesse em ${lead.interest.toLowerCase()} e preparei uma análise objetiva para te ajudar a comparar as melhores opções.

Pelo perfil do contato, o foco pode ser:
- uma proposta clara e direta
- equilíbrio entre custo mensal e rede credenciada
- um próximo passo simples para avançarmos com a simulação

Se fizer sentido, eu posso te mandar agora uma sugestão pronta para seguirmos com a simulação.`;
}

function getSuggestions(lead: Lead) {
  const firstName = lead.name.split(" ")[0];

  return [
    {
      title: "Retomada comercial",
      copy: `Olá, ${firstName}. Seguindo a sua análise, posso te mandar um comparativo mais direto para o seu atendimento?`
    },
    {
      title: "Confirmação rápida",
      copy: `Olá, ${firstName}. Para deixar a proposta mais certeira, você pode me confirmar o melhor horário e se a prioridade é custo ou rede?`
    },
    {
      title: "Fechamento consultivo",
      copy: `Olá, ${firstName}. Já deixei uma mensagem pronta com foco em ${lead.interest.toLowerCase()}. Se quiser, eu posso adaptar o texto para envio imediato.`
    }
  ];
}

export default async function WhatsAppPage({ searchParams }: WhatsAppPageProps) {
  const resolvedSearchParams = await searchParams;
  const leadId = Array.isArray(resolvedSearchParams?.lead)
    ? resolvedSearchParams?.lead[0]
    : resolvedSearchParams?.lead;
  const selectedLead = leads.find((lead) => lead.id === leadId) ?? leads[0];
  const primaryMessage = generatePrimaryMessage(selectedLead);
  const suggestions = getSuggestions(selectedLead);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="WhatsApp"
        title={`Conversa com ${selectedLead.name}`}
        description={`Mensagem gerada por IA para ${selectedLead.name}, já com nome, contexto comercial e próximo passo sugerido.`}
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          href={`/dashboard/whatsapp?lead=${selectedLead.id}`}
        >
          <Send size={18} aria-hidden="true" />
          Enviar mensagem
        </Link>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Conversas" value="54" note="+12 hoje" tone="blue" />
        <Metric label="Respostas" value="71%" note="taxa média" tone="teal" />
        <Metric label="Agendados" value="16" note="semana" tone="yellow" />
        <Metric label="Aguardando" value="8" note="follow-up" tone="dark" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-stretch">
        <aside className="glass rounded-[34px] p-5 h-full">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">Leads recentes</h2>
            <MessageCircle size={20} aria-hidden="true" />
          </div>
          <div className="space-y-3">
            {leads.map((lead) => (
              <article className="rounded-[24px] bg-white/42 p-4" key={lead.id}>
                <h3 className="font-semibold">{lead.name}</h3>
                <p className="mt-1 text-sm text-ink/56">{lead.phone}</p>
                <p className="mt-1 text-sm text-ink/56">{lead.email}</p>
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1.5 text-xs font-semibold">
                  <Clock3 size={15} aria-hidden="true" />
                  {lead.nextContact}
                </span>
              </article>
            ))}
          </div>
        </aside>

        <section className="glass-strong rounded-[34px] p-5 h-full">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cobalt">Mensagem gerada por IA</p>
              <h2 className="mt-2 text-xl font-semibold">{selectedLead.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/64">
                A abordagem abaixo já considera o nome do cliente, o telefone, o email, o
                interesse e o próximo passo sugerido.
              </p>
            </div>
            <Sparkles className="text-lagoon" size={21} aria-hidden="true" />
          </div>
          <div className="rounded-[28px] border border-white/48 bg-white/36 p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-ink/42">
                  Rascunho pronto para envio
                </p>
                <h3 className="mt-1 text-lg font-semibold">{selectedLead.name}</h3>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/90"
                type="button"
              >
                <Copy size={16} aria-hidden="true" />
                Copiar texto
              </button>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-ink/72">
              {primaryMessage}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                href={`/dashboard/whatsapp?lead=${selectedLead.id}`}
              >
                <Send size={16} aria-hidden="true" />
                Gerar nova versão
              </Link>
              <span className="rounded-full bg-white/64 px-4 py-2 text-sm font-semibold text-ink">
                Pronto para WhatsApp
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {suggestions.map((suggestion) => (
              <article
                className="rounded-[24px] border border-white/40 bg-white/34 p-4 shadow-soft"
                key={suggestion.title}
              >
                <h3 className="text-sm font-semibold">{suggestion.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/68">{suggestion.copy}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 rounded-[24px] bg-white/38 p-4">
            <p className="text-sm font-semibold">Atalho rápido</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  className="rounded-full bg-white/62 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
                  type="button"
                  key={suggestion.title}
                >
                  {suggestion.title}
                </button>
              ))}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

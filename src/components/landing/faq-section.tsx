"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Quanto tempo leva para começar a usar?",
    a: "Minutos. Você assina, acessa a plataforma e já pode importar seus leads ou criar a primeira campanha com IA — sem instalação e sem treinamento longo."
  },
  {
    q: "Preciso entender de tráfego pago para usar?",
    a: "Não precisa ser especialista. A IA guia a criação da campanha a partir do seu público, região e oferta, e o checklist de compliance revisa a linguagem antes de publicar."
  },
  {
    q: "O Leadi cria anúncios automaticamente?",
    a: "A IA gera textos, estruturas e ideias de campanha prontos para usar em poucos cliques. A publicação pode depender da configuração da conta e do modo escolhido pela operação."
  },
  {
    q: "O Leadi substitui meu CRM?",
    a: "Sim. O Leadi foi feito para ser o CRM principal de quem capta leads do Meta — com funil, histórico e distribuição para a equipe — e também funciona como apoio para organizar campanhas e atendimento."
  },
  {
    q: "A IA responde meus clientes sozinha?",
    a: "Você mantém o controle do atendimento: a IA prepara mensagens e follow-ups personalizados em segundos, e a equipe decide o que enviar em cada etapa."
  },
  {
    q: "Funciona com Facebook e Instagram?",
    a: "Sim. O Leadi integra com o Meta Lead Ads para receber automaticamente os leads dos formulários oficiais do Facebook e do Instagram, sem planilhas."
  },
  {
    q: "Como funciona o suporte?",
    a: "Você fala com nosso time diretamente pelo WhatsApp — do primeiro contato à configuração da sua operação."
  },
  {
    q: "O sistema garante vendas ou aprovação de anúncios?",
    a: "Nenhuma ferramenta séria pode garantir vendas ou aprovação de campanhas. O que o Leadi faz é organizar sua operação para atender mais rápido, reduzir riscos de linguagem e perder menos oportunidades."
  }
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-strong rounded-[24px] overflow-hidden border border-border shadow-soft">
      <button
        className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold transition hover:bg-surface-elevated"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm md:text-base text-ink">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-relaxed text-ink/65">{a}</p>
        </div>
      )}
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="section-shell pb-24" id="faq">
      <div className="mb-12 max-w-2xl mx-auto text-center">
        <p className="mb-3 text-sm font-medium text-cobalt uppercase tracking-wider">Dúvidas frequentes</p>
        <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Perguntas sobre o Leadi
        </h2>
      </div>
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map((faq) => (
          <FAQItem key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </div>
    </section>
  );
}


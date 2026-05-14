"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "O LeadHealth cria anúncios automaticamente?",
    a: "O objetivo é ajudar na criação, organização e acompanhamento de campanhas. A publicação ou automação depende das integrações disponíveis e das permissões da conta Meta."
  },
  {
    q: "Preciso ter conta no Meta Business?",
    a: "Para integração com Meta Lead Ads, será necessário usar uma conta Meta com permissões adequadas. A integração está em fase de implantação."
  },
  {
    q: "O sistema substitui meu CRM atual?",
    a: "Pode substituir planilhas e CRMs genéricos em operações focadas em leads de plano de saúde empresarial."
  },
  {
    q: "A IA responde meus clientes sozinha?",
    a: "Não por padrão. A IA apoia textos, campanhas e mensagens, mas o controle comercial continua com a equipe. O vendedor sempre revisa antes de enviar."
  },
  {
    q: "Posso importar leads manualmente?",
    a: "Sim, a plataforma mantém suporte para importação de leads de forma manual, além da futura integração automática com o Meta."
  },
  {
    q: "O sistema garante vendas?",
    a: "Não. O LeadHealth organiza a operação, melhora controle e velocidade de atendimento, mas resultados comerciais dependem da oferta, equipe, campanha e processo."
  }
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-strong rounded-[24px] overflow-hidden">
      <button
        className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold transition hover:bg-white/30"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm md:text-base">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-6 text-ink/65">{a}</p>
        </div>
      )}
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="section-shell pb-24" id="faq">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-cobalt">Dúvidas frequentes</p>
        <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Perguntas sobre o LeadHealth
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

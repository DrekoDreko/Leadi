"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "O Leadi cria anúncios automaticamente?",
    a: "O Leadi ajuda a criar textos, estruturas e ideias de campanha com IA. A publicação pode depender da configuração da conta e do modo escolhido pela operação."
  },
  {
    q: "O Leadi substitui meu CRM?",
    a: "Ele pode funcionar como CRM principal para leads do Meta ou como apoio para organizar campanhas e atendimento."
  },
  {
    q: "A IA responde meus clientes sozinha?",
    a: "Não. A IA apoia a criação de mensagens e campanhas, mas a equipe mantém o controle do atendimento."
  },
  {
    q: "Funciona com Facebook e Instagram?",
    a: "O Leadi foi pensado para operações que captam leads por Facebook e Instagram Lead Ads."
  },
  {
    q: "O sistema garante vendas ou aprovação de anúncios?",
    a: "Não. O Leadi ajuda a organizar a operação e reduzir riscos de linguagem, mas não garante vendas, economia ou aprovação de campanhas."
  }
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-strong rounded-[24px] overflow-hidden border border-white/50 shadow-soft">
      <button
        className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold transition hover:bg-white/30"
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
      <div className="mb-12 max-w-2xl">
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


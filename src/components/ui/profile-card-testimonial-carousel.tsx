"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  type LucideIcon,
  MessageSquareMore,
  Share2,
  Sparkles,
  Target
} from "lucide-react";

import { cn } from "@/lib/utils";

interface AdvantageHighlight {
  icon: LucideIcon;
  label: string;
}

interface AdvantageCard {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  highlights: AdvantageHighlight[];
}

const advantageCards: AdvantageCard[] = [
  {
    eyebrow: "Operação organizada",
    title: "Tenha seus leads, responsáveis e próximos passos no mesmo lugar.",
    description:
      "O Leadi reduz a bagunça de planilhas, mensagens soltas e contatos esquecidos. Sua equipe acompanha o funil com clareza e mantém cada oportunidade em movimento.",
    imageUrl:
      "https://images.unsplash.com/photo-1758876022836-70b89d3e6944?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Atendente comercial feliz falando ao telefone enquanto trabalha no notebook",
    highlights: [
      { icon: FolderKanban, label: "CRM com visão por etapa" },
      { icon: Target, label: "Follow-up sem perder timing" },
      { icon: Sparkles, label: "Mais previsibilidade comercial" }
    ]
  },
  {
    eyebrow: "IA aplicada ao dia a dia",
    title: "Ganhe velocidade para criar campanhas e mensagens mais convincentes.",
    description:
      "Use IA para sair do rascunho mais rápido, estruturar campanhas e responder leads com mais consistência. Você economiza tempo sem abrir mão de contexto comercial.",
    imageUrl:
      "https://images.unsplash.com/photo-1758876202014-6b2062bed4e8?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Profissional sorrindo enquanto trabalha com notebook no escritório",
    highlights: [
      { icon: Bot, label: "Ideias e textos com IA" },
      { icon: MessageSquareMore, label: "Mensagens consultivas no WhatsApp" },
      { icon: Sparkles, label: "Produtividade com menos retrabalho" }
    ]
  },
  {
    eyebrow: "Captação conectada",
    title: "Integre Meta Lead Ads à rotina comercial e responda mais rápido.",
    description:
      "Quando a captação entra direto no fluxo do time, o lead não esfria. O Leadi aproxima anúncio, atendimento e acompanhamento para aumentar a chance de conversão.",
    imageUrl:
      "https://images.unsplash.com/photo-1758873272955-3b066dd11c6b?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Atendente sorrindo em contato com cliente no notebook e telefone",
    highlights: [
      { icon: Share2, label: "Leads vindos do Meta em um só painel" },
      { icon: Target, label: "Ação imediata após a entrada" },
      { icon: Sparkles, label: "Mais controle da jornada até o fechamento" }
    ]
  }
];

export interface TestimonialCarouselProps {
  className?: string;
}

export function LeadAdvantagesCarousel({ className }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => setCurrentIndex((index) => (index + 1) % advantageCards.length);
  const handlePrevious = () => setCurrentIndex((index) => (index - 1 + advantageCards.length) % advantageCards.length);

  const currentCard = advantageCards[currentIndex];

  return (
    <section className={cn("section-shell pb-12 md:pb-20", className)} aria-label="Vantagens do Leadi">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cobalt">
          Por que escolher o Leadi
        </p>
        <h2 className="text-3xl font-semibold leading-tight text-ink dark:text-cloud md:text-5xl">
          Mais clareza, velocidade e consistência para vender melhor.
        </h2>
        <p className="mt-4 text-base leading-7 text-ink/64 dark:text-cloud/64 md:text-lg">
          Abaixo dos planos, este é o ganho prático: uma operação mais organizada, respostas mais rápidas e um
          processo comercial mais forte do primeiro lead ao fechamento.
        </p>
      </div>

      <div className="mt-12">
        <div className="hidden items-center md:flex">
          <div className="relative h-[460px] w-[420px] overflow-hidden rounded-[36px] bg-mist/30 shadow-soft">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.imageUrl}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="h-full w-full"
              >
                <Image
                  src={currentCard.imageUrl}
                  alt={currentCard.imageAlt}
                  width={840}
                  height={920}
                  className="h-full w-full object-cover"
                  draggable={false}
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="glass-strong relative z-10 ml-[-56px] flex-1 rounded-[36px] p-8 shadow-[0_24px_70px_rgba(18,34,61,0.12)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cobalt">
                  {currentCard.eyebrow}
                </p>
                <h3 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-ink dark:text-cloud">
                  {currentCard.title}
                </h3>
                <p className="mt-5 max-w-2xl text-base leading-8 text-ink/68 dark:text-cloud/70">
                  {currentCard.description}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {currentCard.highlights.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="rounded-[24px] border border-white/50 bg-white/62 p-4 backdrop-blur dark:border-white/10 dark:bg-white/6"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cobalt/12 text-cobalt dark:bg-cobalt/20">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <p className="mt-3 text-sm font-medium leading-6 text-ink dark:text-cloud">{label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="glass-strong mx-auto max-w-md overflow-hidden rounded-[32px] md:hidden">
          <div className="relative aspect-[4/4.3] overflow-hidden bg-mist/30">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.imageUrl}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="h-full w-full"
              >
                <Image
                  src={currentCard.imageUrl}
                  alt={currentCard.imageAlt}
                  width={900}
                  height={968}
                  className="h-full w-full object-cover"
                  draggable={false}
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cobalt">{currentCard.eyebrow}</p>
              <h3 className="mt-3 text-2xl font-semibold leading-tight text-ink dark:text-cloud">
                {currentCard.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-ink/68 dark:text-cloud/70">{currentCard.description}</p>

              <div className="mt-6 grid gap-3">
                {currentCard.highlights.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-[20px] border border-white/50 bg-white/62 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-white/6"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cobalt/12 text-cobalt dark:bg-cobalt/20">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <p className="text-sm font-medium leading-6 text-ink dark:text-cloud">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={handlePrevious}
            aria-label="Mostrar vantagem anterior"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-mist/35 bg-cloud shadow-soft transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-ink dark:hover:bg-ink/90"
          >
            <ChevronLeft className="text-ink dark:text-cloud" size={20} />
          </button>

          <div className="flex gap-2">
            {advantageCards.map((card, index) => (
              <button
                key={card.title}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-3 w-3 rounded-full transition-all",
                  index === currentIndex ? "w-8 bg-cobalt" : "bg-ink/20 dark:bg-cloud/28"
                )}
                aria-label={`Ir para vantagem ${index + 1}`}
                aria-pressed={index === currentIndex}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Mostrar próxima vantagem"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-mist/35 bg-cloud shadow-soft transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-ink dark:hover:bg-ink/90"
          >
            <ChevronRight className="text-ink dark:text-cloud" size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

export const TestimonialCarousel = LeadAdvantagesCarousel;

export default LeadAdvantagesCarousel;

"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Sparkles,
  Facebook,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowRight
} from "lucide-react";

interface JourneyCard {
  id: number;
  titleText: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  visual: React.ReactNode;
}

export function HighlightCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);

      const cardsList = Array.from(container.children).filter(
        (el) => el.getAttribute("data-card") === "true"
      ) as HTMLElement[];

      if (cardsList.length === 0) return;

      const style = window.getComputedStyle(container);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;

      // Find the card closest to currentScroll
      let activeIdx = 0;
      let minDiff = Infinity;

      cardsList.forEach((card, idx) => {
        const cardTargetScroll = card.offsetLeft - paddingLeft;
        const diff = Math.abs(cardTargetScroll - scrollLeft);
        if (diff < minDiff) {
          minDiff = diff;
          activeIdx = idx;
        }
      });

      setActiveIndex(activeIdx);
    }
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      // Wait for components to mount fully so computed styles and positions are correct
      const timer = setTimeout(() => {
        handleScroll();
      }, 100);
      return () => {
        el.removeEventListener("scroll", handleScroll);
        clearTimeout(timer);
      };
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardsList = Array.from(container.children).filter(
        (el) => el.getAttribute("data-card") === "true"
      ) as HTMLElement[];

      if (cardsList.length === 0) return;

      const style = window.getComputedStyle(container);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const currentScroll = container.scrollLeft;

      let currentCardIndex = 0;
      let minDiff = Infinity;

      cardsList.forEach((card, idx) => {
        const cardTargetScroll = card.offsetLeft - paddingLeft;
        const diff = Math.abs(cardTargetScroll - currentScroll);
        if (diff < minDiff) {
          minDiff = diff;
          currentCardIndex = idx;
        }
      });

      let targetIndex = currentCardIndex;
      if (direction === "right") {
        targetIndex = Math.min(cardsList.length - 1, currentCardIndex + 1);
      } else {
        targetIndex = Math.max(0, currentCardIndex - 1);
      }

      const targetCard = cardsList[targetIndex];
      if (targetCard) {
        container.scrollTo({
          left: targetCard.offsetLeft - paddingLeft,
          behavior: "smooth"
        });
      }
    }
  };

  const scrollToCard = (index: number) => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardsList = Array.from(container.children).filter(
        (el) => el.getAttribute("data-card") === "true"
      ) as HTMLElement[];

      const targetCard = cardsList[index];
      if (targetCard) {
        const style = window.getComputedStyle(container);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        container.scrollTo({
          left: targetCard.offsetLeft - paddingLeft,
          behavior: "smooth"
        });
      }
    }
  };

  const cards: JourneyCard[] = [
    {
      id: 1,
      bgColor: "bg-white dark:bg-white/5",
      textColor: "text-ink",
      borderColor: "border-neutral-200/60",
      titleText: "Crie uma campanha com IA. Descreva público, região e oferta, e o Leadi organiza a campanha em um fluxo mais simples e guiado.",
      visual: (
        <div className="w-[85%] rounded-2xl bg-neutral-50/80 p-5 border border-ink/6 shadow-sm text-left select-none max-w-sm">
          <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold text-cobalt uppercase tracking-wider">
            <Sparkles size={11} className="animate-pulse" /> Briefing da Campanha
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="block text-[9px] text-ink/40 font-bold uppercase tracking-wider">Público da Operação</span>
              <div className="mt-1 rounded-lg bg-white dark:bg-white/5 border border-ink/5 px-3 py-1.5 text-ink font-medium">
                PME e MEI de Planos de Saúde
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[9px] text-ink/40 font-bold uppercase tracking-wider">Região</span>
                <div className="mt-1 rounded-lg bg-white dark:bg-white/5 border border-ink/5 px-3 py-1.5 text-ink font-medium truncate">
                  Minas Gerais
                </div>
              </div>
              <div>
                <span className="block text-[9px] text-ink/40 font-bold uppercase tracking-wider">Oferta</span>
                <div className="mt-1 rounded-lg bg-white dark:bg-white/5 border border-ink/5 px-3 py-1.5 text-ink font-medium truncate">
                  40% de Desconto
                </div>
              </div>
            </div>
          </div>
          <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-cobalt to-indigo-600 text-white font-extrabold py-2.5 px-4 text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cobalt/20 transition-all duration-300">
            <Sparkles size={13} className="fill-white/10" />
            Gerar campanha com IA
          </button>
        </div>
      )
    },
    {
      id: 2,
      bgColor: "bg-[#121721]",
      textColor: "text-white",
      borderColor: "border-white/10",
      titleText: "Revise a linguagem antes de publicar. A IA ajuda a estruturar textos mais consultivos e o checklist aponta termos que merecem atenção.",
      visual: (
        <div className="w-[85%] rounded-2xl bg-white/5 p-5 border border-white/10 shadow-lg text-left max-w-sm backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded flex items-center gap-1">
              <CheckCircle2 size={11} className="stroke-[2.5px]" /> Status: Seguro
            </span>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Compliance</span>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center gap-2.5 text-xs text-white/80">
              <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={12} className="stroke-[3px]" />
              </div>
              <span className="font-semibold">Linguagem consultiva e qualificada</span>
            </li>
            <li className="flex items-center gap-2.5 text-xs text-white/80">
              <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={12} className="stroke-[3px]" />
              </div>
              <span className="font-semibold">Sem promessa de economia proibida</span>
            </li>
            <li className="flex items-center gap-2.5 text-xs text-white/80">
              <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={12} className="stroke-[3px]" />
              </div>
              <span className="font-semibold">Preparado para Meta Lead Ads</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 3,
      bgColor: "bg-gradient-to-br from-[#EAF0DC] to-[#DCE3CE] dark:from-white/5 dark:to-white/10",
      textColor: "text-ink",
      borderColor: "border-white/50",
      titleText: "Capture leads com formulário padrão. Os interessados preenchem um formulário simples e entram no fluxo comercial da operação.",
      visual: (
        <div className="w-[85%] rounded-2xl bg-white/70 dark:bg-white/5 p-5 border border-white/60 shadow-sm text-left max-w-sm backdrop-blur-xl">
          <div className="mb-3 border-b border-ink/8 pb-2 flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Meta Lead Ads Form</h4>
            <Facebook size={14} className="text-[#1877F2] fill-[#1877F2] shrink-0" />
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/80 dark:bg-white/10 border border-ink/5 p-2 shadow-inner">
                <span className="block text-[8px] text-ink/40 font-bold uppercase">Nome</span>
                <span className="text-xs font-bold text-ink/85">Marcos Silva</span>
              </div>
              <div className="rounded-xl bg-white/80 dark:bg-white/10 border border-ink/5 p-2 shadow-inner">
                <span className="block text-[8px] text-ink/40 font-bold uppercase">Tipo de Plano</span>
                <span className="text-xs font-bold text-ink/85 truncate block">PME</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/80 dark:bg-white/10 border border-ink/5 p-2 shadow-inner">
                <span className="block text-[8px] text-ink/40 font-bold uppercase">Telefone</span>
                <span className="text-xs font-bold text-ink/85">(31) 98765-4321</span>
              </div>
              <div className="rounded-xl bg-white/80 dark:bg-white/10 border border-ink/5 p-2 shadow-inner">
                <span className="block text-[8px] text-ink/40 font-bold uppercase">Quantidade de vidas</span>
                <span className="text-xs font-bold text-ink/85">4</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      bgColor: "bg-gradient-to-br from-[#E8F0FE] to-[#D2E3FC] dark:from-white/5 dark:to-white/10",
      textColor: "text-ink",
      borderColor: "border-white/50",
      titleText: "Importe os leads para o CRM. Leve os leads para a plataforma e centralize atendimento, histórico e próximas ações.",
      visual: (
        <div className="w-[85%] rounded-2xl bg-white/60 dark:bg-white/5 p-5 border border-white/60 shadow-sm text-center max-w-sm">
          <div className="flex items-center justify-between gap-2.5 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 font-bold text-[10px] shrink-0">
              <Facebook size={11} className="fill-blue-600/10" /> Meta Ads
            </div>
            
            <ArrowRight size={13} className="text-cobalt/40 shrink-0" />

            <div className="h-7 w-7 rounded-full bg-cobalt text-white flex items-center justify-center font-extrabold text-[9px] tracking-wider shadow-sm shadow-cobalt/20 shrink-0 select-none">
              API
            </div>

            <ArrowRight size={13} className="text-cobalt/40 shrink-0" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cobalt/10 border border-cobalt/20 text-cobalt font-bold text-[10px] shrink-0">
              <Zap size={11} className="fill-cobalt" /> Leadi
            </div>
          </div>
          <div className="rounded-xl bg-white dark:bg-white/5 border border-ink/5 p-3 flex items-center justify-between text-left shadow-sm">
            <div>
              <p className="text-xs font-bold text-ink">Marcos Silva</p>
              <p className="text-[10px] text-ink/50 mt-0.5">Campanha • MG • PME • 4 vidas</p>
            </div>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Importado
            </span>
          </div>
        </div>
      )
    },
    {
      id: 5,
      bgColor: "bg-white dark:bg-white/5",
      textColor: "text-ink",
      borderColor: "border-neutral-200/60",
      titleText: "Distribua os leads para a equipe. No plano Equipe, o supervisor pode organizar e direcionar oportunidades para cada consultor.",
      visual: (
        <div className="w-[85%] rounded-2xl bg-neutral-50/80 p-5 border border-ink/6 shadow-sm text-left max-w-sm">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">Painel Supervisor</span>
            <span className="text-[9px] font-semibold bg-cobalt text-white px-2 py-0.5 rounded-full">Automático</span>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl bg-white dark:bg-white/5 border border-ink/5 p-2.5 flex items-center justify-between shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">Marcos Silva</p>
                <p className="text-[9px] text-ink/40">4 vidas</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold text-ink/70 bg-neutral-100 px-2.5 py-0.5 rounded-lg border border-ink/5">Consultor Gabriel</span>
              </div>
            </div>
            <div className="rounded-xl bg-white dark:bg-white/5 border border-ink/5 p-2.5 flex items-center justify-between shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">Marina Azevedo</p>
                <p className="text-[9px] text-ink/40">48 vidas</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold text-ink/70 bg-neutral-100 px-2.5 py-0.5 rounded-lg border border-ink/5">Consultora Beatriz</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      bgColor: "bg-[#0A0E17]",
      textColor: "text-white",
      borderColor: "border-white/10",
      titleText: "Saiba o custo por lead. Acompanhe o investimento e tenha mais clareza sobre o desempenho das campanhas.",
      visual: (
        <div className="w-[85%] rounded-2xl bg-white/5 p-5 border border-white/10 shadow-lg text-left max-w-sm">
          <div className="mb-3 text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center justify-between">
            <span>Performance Financeira</span>
            <span className="flex items-center gap-1 text-[8px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              7 dias ativa
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <div className="rounded-xl bg-white/5 border border-white/5 p-3">
              <span className="block text-[9px] text-white/40 font-bold uppercase">Investimento</span>
              <span className="text-sm font-extrabold text-white">R$ 175,00</span>
              <span className="block text-[8px] text-white/30 font-medium mt-0.5">de R$ 600,00</span>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/5 p-3">
              <span className="block text-[9px] text-white/40 font-bold uppercase">Leads</span>
              <span className="text-sm font-extrabold text-white">35</span>
              <span className="block text-[8px] text-white/30 font-medium mt-0.5">Média 5/dia</span>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex justify-between items-center">
            <div>
              <span className="block text-[9px] text-emerald-400 font-bold uppercase">Custo por Lead</span>
              <span className="text-xl font-extrabold text-emerald-400 leading-none">R$ 5,00</span>
              <span className="text-[7px] text-white/40 mt-1 block font-medium">*Valor ilustrativo, não garantido</span>
            </div>
            <span className="text-[8px] font-bold text-white bg-emerald-500 rounded px-2 py-0.5 uppercase tracking-wider">
              Excelente
            </span>
          </div>
        </div>
      )
    },
    {
      id: 7,
      bgColor: "bg-gradient-to-br from-[#FFF577] to-[#DDD022] dark:from-[#FFF577]/10 dark:to-[#DDD022]/10",
      textColor: "text-ink",
      borderColor: "border-yellow-400/40",
      titleText: "Turbine os anúncios com mais potencial. Pause, ajuste ou turbine campanhas com base no que está performando melhor.",
      visual: (
        <div className="w-[85%] rounded-2xl bg-white/80 dark:bg-white/10 p-5 border border-ink/6 shadow-sm text-center max-w-sm">
          <p className="text-[9px] font-bold text-ink/40 uppercase tracking-widest mb-3.5 text-left">Controle de Otimização</p>
          <div className="flex gap-2 justify-center">
            <button className="flex-1 rounded-xl border border-ink/5 py-2.5 px-2 text-[10px] font-extrabold text-ink/50 bg-white/50 hover:bg-white/70 dark:bg-white/5 transition-colors">
              Pausar
            </button>
            <button className="flex-1 rounded-xl border border-ink/5 py-2.5 px-2 text-[10px] font-extrabold text-ink/50 bg-white/50 hover:bg-white/70 dark:bg-white/5 transition-colors">
              Ajustar
            </button>
            <button className="flex-[1.3] rounded-xl bg-ink text-cloud py-2.5 px-3 text-[10px] font-extrabold shadow-md shadow-black/10 hover:scale-[1.02] transition-transform duration-200 flex items-center justify-center gap-1.5 border border-white/10 relative overflow-hidden group">
              <Zap size={11} className="fill-yellow-400 text-yellow-400" />
              Turbinar
            </button>
          </div>
          <p className="text-[9px] font-bold text-ink/50 mt-3.5 flex items-center justify-center gap-1 select-none">
            <Sparkles size={10} className="text-cobalt fill-cobalt/10" /> Destaque máximo de performance
          </p>
        </div>
      )
    },
    {
      id: 8,
      bgColor: "bg-gradient-to-br from-white to-[#F0F3F6] dark:from-white/5 dark:to-white/10",
      textColor: "text-ink",
      borderColor: "border-neutral-200/60",
      titleText: "Acompanhe o funil e ganhe produtividade. Veja o andamento dos leads, acompanhe a equipe e conduza mais oportunidades com organização.",
      visual: (
        <div className="w-[95%] sm:w-full rounded-2xl bg-white/80 dark:bg-white/10 p-4 border border-ink/6 shadow-sm text-left max-w-sm md:max-w-md relative overflow-hidden select-none">
          <style>{`
            @keyframes mini-kanban-float {
              0%, 100% { transform: translateY(0) rotate(-3deg); }
              50% { transform: translateY(-5px) rotate(-1deg); }
            }
            .animate-mini-float {
              animation: mini-kanban-float 3s ease-in-out infinite;
            }
          `}</style>
          
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">Pipeline Comercial</span>
            <span className="text-[9px] font-bold text-cobalt bg-cobalt/10 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cobalt animate-ping"></span>
              Real time
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2.5 relative min-h-[140px]">
            {/* Column 1: Novo Lead */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cobalt"></span>
                  <span className="text-[9px] font-bold text-ink/70">Novo Lead</span>
                </div>
                <span className="text-[8px] font-bold text-ink/40 bg-ink/5 px-1 rounded">1</span>
              </div>
              
              <div className="space-y-1.5">
                {/* Static Lead Card */}
                <div className="bg-white dark:bg-white/5 border border-ink/5 rounded-lg p-1.5 shadow-sm">
                  <span className="block h-1 w-5 rounded-full bg-cobalt mb-1" />
                  <p className="text-[9px] font-bold text-ink leading-tight">Ana Souza</p>
                  <p className="text-[7px] text-ink/40 mt-0.5">PME • 5 vidas</p>
                </div>
                
                {/* Ghost Card Placeholder (representing the card being dragged) */}
                <div className="border border-dashed border-cobalt/20 bg-cobalt/[0.02] rounded-lg h-[38px] flex items-center justify-center">
                  <span className="text-[6px] font-bold text-cobalt/30 uppercase tracking-widest scale-90">Movendo...</span>
                </div>
              </div>
            </div>

            {/* Column 2: Qualificação */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-lagoon"></span>
                  <span className="text-[9px] font-bold text-ink/70">Qualificação</span>
                </div>
                <span className="text-[8px] font-bold text-ink/40 bg-ink/5 px-1 rounded">2</span>
              </div>
              
              <div className="space-y-1.5">
                {/* Active Dropzone Placeholder */}
                <div className="border border-dashed border-cobalt/60 bg-cobalt/5 rounded-lg h-[38px] flex flex-col items-center justify-center border-spacing-2 animate-pulse">
                  <span className="text-[7px] font-bold text-cobalt uppercase tracking-widest scale-90">Solte Aqui</span>
                  <span className="text-[5px] text-cobalt/60 font-semibold uppercase tracking-wider scale-90">Mover Etapa</span>
                </div>

                {/* Existing Card */}
                <div className="bg-white dark:bg-white/5 border border-ink/5 rounded-lg p-1.5 shadow-sm opacity-60">
                  <span className="block h-1 w-5 rounded-full bg-lagoon mb-1" />
                  <p className="text-[9px] font-bold text-ink leading-tight">Lucas Lima</p>
                  <p className="text-[7px] text-ink/40 mt-0.5">PME • 12 vidas</p>
                </div>
              </div>
            </div>

            {/* Column 3: Proposta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal"></span>
                  <span className="text-[9px] font-bold text-ink/70">Proposta</span>
                </div>
                <span className="text-[8px] font-bold text-ink/40 bg-ink/5 px-1 rounded">1</span>
              </div>
              
              <div className="space-y-1.5">
                {/* Existing Card */}
                <div className="bg-white dark:bg-white/5 border border-ink/5 rounded-lg p-1.5 shadow-sm">
                  <span className="block h-1 w-5 rounded-full bg-signal mb-1" />
                  <p className="text-[9px] font-bold text-ink leading-tight">Marcos Silva</p>
                  <p className="text-[7px] text-ink/40 mt-0.5">PME • 4 vidas</p>
                </div>
              </div>
            </div>

            {/* Dragging Card Overlay (floating) */}
            <div className="absolute top-[38px] left-[18%] sm:left-[20%] w-[90px] sm:w-[100px] bg-white dark:bg-white/5 border border-cobalt/35 rounded-lg p-1.5 shadow-xl animate-mini-float z-20 pointer-events-none">
              <div className="flex items-start justify-between">
                <span className="block h-1 w-5 rounded-full bg-cobalt mb-1" />
                <span className="text-cobalt/60">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-2 w-2"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </span>
              </div>
              <p className="text-[9px] font-bold text-ink leading-tight">Marina Azevedo</p>
              <p className="text-[7px] text-ink/40 mt-0.5">PME • 48 vidas</p>
              
              {/* Grab Hand / Cursor Icon inside the floating card */}
              <div className="absolute -bottom-1 -right-1 z-30 pointer-events-none drop-shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="2.5" className="text-cobalt">
                  <path d="M4 4l11.73 11.73a1 1 0 0 1-.37 1.75l-4.67 1.17a1 1 0 0 0-.7.7l-1.17 4.67a1 1 0 0 1-1.75.37L4 4z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="relative overflow-hidden py-24" id="como-funciona">
      {/* Header aligned with section-shell */}
      <div className="section-shell">
        <div className="max-w-4xl px-4">
          <h2 className="text-3.5xl sm:text-4xl md:text-5.5xl font-bold tracking-tight text-ink leading-[1.06] mb-12">
            Crie, capture e acompanhe.
          </h2>
        </div>
      </div>

      {/* Carousel Window - FULL WIDTH of the screen */}
      <div
        ref={carouselRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-10 scrollbar-none scroll-smooth w-full"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingLeft: "calc((100vw - min(1180px, 100vw - 32px)) / 2 + 16px)",
          paddingRight: "calc((100vw - min(1180px, 100vw - 32px)) / 2 + 16px)",
          scrollPaddingLeft: "calc((100vw - min(1180px, 100vw - 32px)) / 2 + 16px)",
          scrollPaddingRight: "calc((100vw - min(1180px, 100vw - 32px)) / 2 + 16px)"
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            data-card="true"
            className={`w-[290px] sm:w-[480px] md:w-[560px] aspect-[1.15/1] sm:aspect-[4/3] md:aspect-[1.4/1] shrink-0 rounded-[30px] border ${card.borderColor} ${card.bgColor} p-6 sm:p-9 md:p-10 flex flex-col justify-between snap-start transition-all duration-500 hover:shadow-[0_24px_60px_rgba(0,0,0,0.06)] hover:scale-[1.005] relative group`}
          >
            {/* Top Left single block bold typography */}
            <div className="text-left">
              <p className={`text-base sm:text-lg md:text-xl font-bold leading-snug tracking-tight max-w-[92%] ${card.textColor}`}>
                {card.titleText}
              </p>
            </div>

            {/* Bottom aligned mockup visual with high whitespace (respiro) */}
            <div className="mt-8 flex justify-center items-center h-[170px] sm:h-[220px] w-full rounded-2xl bg-neutral-50/0 p-2.5 transition-all duration-300">
              {card.visual}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation & Indicators Block (Apple Style: Right aligned setas, left aligned indicators) */}
      <div className="section-shell">
        <div className="mt-8 flex items-center justify-between px-4">
          {/* Pagination Indicators (Left) */}
          <div className="flex gap-2">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToCard(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-6 bg-cobalt" : "w-2 bg-ink/15 hover:bg-ink/30"
                }`}
                aria-label={`Ir para destaque ${i + 1}`}
              />
            ))}
          </div>

          {/* Action Navigation Arrows (Right) */}
          <div className="flex gap-3">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`h-11 w-11 rounded-full border border-neutral-300 bg-white/80 hover:bg-white dark:bg-white/5 text-ink flex items-center justify-center transition-all duration-300 ${
                !canScrollLeft ? "opacity-30 cursor-not-allowed" : "active:scale-95 hover:border-ink/20 hover:-translate-x-0.5 shadow-sm"
              }`}
              aria-label="Destaque anterior"
            >
              <ChevronLeft size={20} className="stroke-[2.5px]" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`h-11 w-11 rounded-full border border-neutral-300 bg-white/80 hover:bg-white dark:bg-white/5 text-ink flex items-center justify-center transition-all duration-300 ${
                !canScrollRight ? "opacity-30 cursor-not-allowed" : "active:scale-95 hover:border-ink/20 hover:translate-x-0.5 shadow-sm"
              }`}
              aria-label="Próximo destaque"
            >
              <ChevronRight size={20} className="stroke-[2.5px]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const { scrollLeft } = container;

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
  }, []);

  const scrollToCard = useCallback((index: number) => {
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
        setActiveIndex(index);
      }
    }
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll);

      // Wait for components to mount fully so computed styles and positions are correct
      const timer = window.setTimeout(handleScroll, 100);

      return () => {
        el.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
        window.clearTimeout(timer);
      };
    }
  }, [handleScroll]);

  const cards: JourneyCard[] = [
    {
      id: 1,
      bgColor: "bg-white dark:bg-surface-elevated/90",
      textColor: "text-ink dark:text-cloud",
      borderColor: "border-neutral-200/60 dark:border-border/70",
      titleText: "Crie uma campanha com IA. Descreva público, região e oferta, e o Leadi organiza a campanha em um fluxo mais simples e guiado.",
      visual: (
        <div className="w-[85%] max-w-sm select-none rounded-2xl border border-ink/6 bg-neutral-50/80 p-5 text-left shadow-sm dark:border-border/60 dark:bg-dashboard-card-muted/90">
          <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold text-cobalt uppercase tracking-wider">
            <Sparkles size={11} className="animate-pulse" /> Briefing da Campanha
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-wider text-ink/40 dark:text-cloud/52">Público da Operação</span>
              <div className="mt-1 rounded-lg border border-ink/5 bg-white px-3 py-1.5 font-medium text-ink dark:border-border/60 dark:bg-surface-elevated/90 dark:text-cloud">
                PME e MEI de Planos de Saúde
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-ink/40 dark:text-cloud/52">Região</span>
                <div className="mt-1 rounded-lg border border-ink/5 bg-white px-3 py-1.5 font-medium text-ink truncate dark:border-border/60 dark:bg-surface-elevated/90 dark:text-cloud">
                  Minas Gerais
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-ink/40 dark:text-cloud/52">Oferta</span>
                <div className="mt-1 rounded-lg border border-ink/5 bg-white px-3 py-1.5 font-medium text-ink truncate dark:border-border/60 dark:bg-surface-elevated/90 dark:text-cloud">
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
      borderColor: "border-white/10 dark:border-border/70",
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
      bgColor: "bg-gradient-to-br from-[#EAF0DC] to-[#DCE3CE] dark:from-[#26344A] dark:to-[#1B2432]",
      textColor: "text-ink dark:text-cloud",
      borderColor: "border-white/50 dark:border-[#587092]/78",
      titleText: "Capture leads com formulário padrão. Os interessados preenchem um formulário simples e entram no fluxo comercial da operação.",
      visual: (
        <div className="w-[85%] max-w-sm rounded-2xl border border-white/60 bg-white/70 p-5 text-left shadow-sm backdrop-blur-xl dark:border-[#536A89]/65 dark:bg-[#223046]">
          <div className="mb-3 border-b border-ink/8 pb-2 flex items-center justify-between dark:border-white/12">
            <h4 className="text-[10px] font-bold text-ink/40 uppercase tracking-widest dark:text-cloud/56">Meta Lead Ads Form</h4>
            <Facebook size={14} className="text-[#1877F2] fill-[#1877F2] shrink-0" />
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-ink/5 bg-white/80 p-2 shadow-inner dark:border-white/8 dark:bg-[#2A3950] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <span className="block text-[8px] text-ink/40 font-bold uppercase dark:text-cloud/42">Nome</span>
                <span className="text-xs font-bold text-ink/85 dark:text-cloud/88">Marcos Silva</span>
              </div>
              <div className="rounded-xl border border-ink/5 bg-white/80 p-2 shadow-inner dark:border-white/8 dark:bg-[#2A3950] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <span className="block text-[8px] text-ink/40 font-bold uppercase dark:text-cloud/42">Tipo de Plano</span>
                <span className="text-xs font-bold text-ink/85 truncate block dark:text-cloud/88">PME</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-ink/5 bg-white/80 p-2 shadow-inner dark:border-white/8 dark:bg-[#2A3950] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <span className="block text-[8px] text-ink/40 font-bold uppercase dark:text-cloud/42">Telefone</span>
                <span className="text-xs font-bold text-ink/85 dark:text-cloud/88">(31) 98765-4321</span>
              </div>
              <div className="rounded-xl border border-ink/5 bg-white/80 p-2 shadow-inner dark:border-white/8 dark:bg-[#2A3950] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <span className="block text-[8px] text-ink/40 font-bold uppercase dark:text-cloud/42">Quantidade de vidas</span>
                <span className="text-xs font-bold text-ink/85 dark:text-cloud/88">4</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      bgColor: "bg-gradient-to-br from-[#E8F0FE] to-[#D2E3FC] dark:from-[#263752] dark:to-[#1A2433]",
      textColor: "text-ink dark:text-cloud",
      borderColor: "border-white/50 dark:border-cobalt/28",
      titleText: "Importe os leads para o CRM. Leve os leads para a plataforma e centralize atendimento, histórico e próximas ações.",
      visual: (
        <div className="w-[85%] max-w-sm rounded-2xl border border-white/60 bg-white/60 p-5 text-center shadow-sm dark:border-cobalt/16 dark:bg-[#243449]">
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
          <div className="surface-card-strong rounded-xl border border-ink/5 p-3 flex items-center justify-between text-left shadow-sm dark:border-white/8 dark:bg-[#182231]">
            <div>
              <p className="text-xs font-bold text-ink dark:text-cloud">Marcos Silva</p>
              <p className="mt-0.5 text-[10px] text-ink/50 dark:text-cloud/58">Campanha • MG • PME • 4 vidas</p>
            </div>
              <span className="surface-alert-success text-[9px] font-bold px-2.5 py-1 rounded-full">
                Importado
              </span>
          </div>
        </div>
      )
    },
    {
      id: 5,
      bgColor: "bg-white dark:bg-[#24344B]",
      textColor: "text-ink dark:text-cloud",
      borderColor: "border-neutral-200/60 dark:border-[#677F9F]/85",
      titleText: "Distribua os leads para a equipe. No plano Equipe, o supervisor pode organizar e direcionar oportunidades para cada consultor.",
      visual: (
        <div className="w-[85%] max-w-sm rounded-2xl border border-ink/6 bg-neutral-50/80 p-5 text-left shadow-sm dark:border-[#637A9A]/68 dark:bg-[#2E3E55]/95">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest dark:text-cloud/48">Painel Supervisor</span>
            <span className="text-[9px] font-semibold bg-cobalt text-white px-2 py-0.5 rounded-full">Automático</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/5 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-[#1C2738]">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink dark:text-cloud">Marcos Silva</p>
                <p className="text-[9px] text-ink/40 dark:text-cloud/56">4 vidas</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="surface-pill rounded-lg px-2.5 py-0.5 text-[10px] font-bold text-ink/70 dark:border-white/10 dark:bg-[#253247] dark:text-cloud/82">Consultor Gabriel</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/5 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-[#1C2738]">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink dark:text-cloud">Marina Azevedo</p>
                <p className="text-[9px] text-ink/40 dark:text-cloud/56">48 vidas</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="surface-pill rounded-lg px-2.5 py-0.5 text-[10px] font-bold text-ink/70 dark:border-white/10 dark:bg-[#253247] dark:text-cloud/82">Consultora Beatriz</span>
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
      bgColor: "bg-gradient-to-br from-[#FFF577] to-[#DDD022] dark:from-[#262216] dark:to-[#1D1A16]",
      textColor: "text-ink dark:text-cloud",
      borderColor: "border-yellow-400/40 dark:border-yellow-300/26",
      titleText: "Turbine os anúncios com mais potencial. Pause, ajuste ou turbine campanhas com base no que está performando melhor.",
      visual: (
        <div className="w-[85%] rounded-2xl border border-ink/6 bg-white/80 p-5 text-center shadow-sm max-w-sm dark:border-white/10 dark:bg-[#2A241D]">
          <p className="mb-3.5 text-left text-[9px] font-bold uppercase tracking-widest text-ink/40 dark:text-cloud/48">Controle de Otimização</p>
          <div className="flex gap-2 justify-center">
            <button className="flex-1 rounded-xl border border-ink/5 bg-white/50 px-2 py-2.5 text-[10px] font-extrabold text-ink/50 transition-colors hover:bg-white/70 dark:border-white/8 dark:bg-[#6A5524] dark:text-cloud/84 dark:hover:bg-[#786028]">
              Pausar
            </button>
            <button className="flex-1 rounded-xl border border-ink/5 bg-white/50 px-2 py-2.5 text-[10px] font-extrabold text-ink/50 transition-colors hover:bg-white/70 dark:border-white/8 dark:bg-[#6A5524] dark:text-cloud/84 dark:hover:bg-[#786028]">
              Ajustar
            </button>
            <button className="relative flex-[1.3] overflow-hidden rounded-xl border border-signal/60 bg-signal px-3 py-2.5 text-[10px] font-extrabold text-accent-foreground shadow-md shadow-black/10 transition-transform duration-200 hover:scale-[1.02] flex items-center justify-center gap-1.5 group">
              <Zap size={11} className="fill-yellow-400 text-yellow-400" />
              Turbinar
            </button>
          </div>
          <p className="mt-3.5 flex items-center justify-center gap-1 select-none text-[9px] font-bold text-ink/50 dark:text-cloud/54">
            <Sparkles size={10} className="text-cobalt fill-cobalt/10" /> Destaque máximo de performance
          </p>
        </div>
      )
    },
    {
      id: 8,
      bgColor: "bg-gradient-to-br from-white to-[#F0F3F6] dark:from-[#243046] dark:to-[#1A2232]",
      textColor: "text-ink dark:text-cloud",
      borderColor: "border-neutral-200/60 dark:border-cobalt/24",
      titleText: "Acompanhe o funil e ganhe produtividade. Veja o andamento dos leads, acompanhe a equipe e conduza mais oportunidades com organização.",
      visual: (
        <div className="w-[95%] sm:w-full rounded-2xl border border-ink/6 bg-white/80 p-4 text-left shadow-sm max-w-sm md:max-w-md relative overflow-hidden select-none dark:border-white/10 dark:bg-[#253247]">
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
            <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest dark:text-cloud/48">Pipeline Comercial</span>
            <span className="surface-pill flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold text-cobalt dark:bg-surface-elevated dark:text-cloud/82">
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
                  <span className="text-[9px] font-bold text-ink/70 dark:text-cloud/82">Novo Lead</span>
                </div>
                <span className="rounded bg-ink/5 px-1 text-[8px] font-bold text-ink/40 dark:bg-[#1A2332] dark:text-cloud/56">1</span>
              </div>
              
              <div className="space-y-1.5">
                {/* Static Lead Card */}
                <div className="rounded-lg border border-ink/5 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-[#1A2332]">
                  <span className="block h-1 w-5 rounded-full bg-cobalt mb-1" />
                  <p className="text-[9px] font-bold leading-tight text-ink dark:text-cloud">Ana Souza</p>
                  <p className="mt-0.5 text-[7px] text-ink/40 dark:text-cloud/56">PME • 5 vidas</p>
                </div>
                
                {/* Ghost Card Placeholder (representing the card being dragged) */}
                <div className="border border-dashed border-cobalt/20 bg-cobalt/[0.02] rounded-lg h-[38px] flex items-center justify-center dark:border-cobalt/36 dark:bg-cobalt/10">
                  <span className="text-[6px] font-bold text-cobalt/30 uppercase tracking-widest scale-90">Movendo...</span>
                </div>
              </div>
            </div>

            {/* Column 2: Qualificação */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-lagoon"></span>
                  <span className="text-[9px] font-bold text-ink/70 dark:text-cloud/82">Qualificação</span>
                </div>
                <span className="rounded bg-ink/5 px-1 text-[8px] font-bold text-ink/40 dark:bg-[#1A2332] dark:text-cloud/56">2</span>
              </div>
              
              <div className="space-y-1.5">
                {/* Active Dropzone Placeholder */}
                <div className="border border-dashed border-cobalt/60 bg-cobalt/5 rounded-lg h-[38px] flex flex-col items-center justify-center border-spacing-2 animate-pulse dark:bg-cobalt/12">
                  <span className="text-[7px] font-bold text-cobalt uppercase tracking-widest scale-90">Solte Aqui</span>
                  <span className="text-[5px] text-cobalt/60 font-semibold uppercase tracking-wider scale-90">Mover Etapa</span>
                </div>

                {/* Existing Card */}
                <div className="rounded-lg border border-ink/5 bg-white p-1.5 shadow-sm opacity-60 dark:border-white/10 dark:bg-[#1A2332]">
                  <span className="block h-1 w-5 rounded-full bg-lagoon mb-1" />
                  <p className="text-[9px] font-bold leading-tight text-ink dark:text-cloud">Lucas Lima</p>
                  <p className="mt-0.5 text-[7px] text-ink/40 dark:text-cloud/56">PME • 12 vidas</p>
                </div>
              </div>
            </div>

            {/* Column 3: Proposta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal"></span>
                  <span className="text-[9px] font-bold text-ink/70 dark:text-cloud/82">Proposta</span>
                </div>
                <span className="rounded bg-ink/5 px-1 text-[8px] font-bold text-ink/40 dark:bg-[#1A2332] dark:text-cloud/56">1</span>
              </div>
              
              <div className="space-y-1.5">
                {/* Existing Card */}
                <div className="rounded-lg border border-ink/5 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-[#1A2332]">
                  <span className="block h-1 w-5 rounded-full bg-signal mb-1" />
                  <p className="text-[9px] font-bold leading-tight text-ink dark:text-cloud">Marcos Silva</p>
                  <p className="mt-0.5 text-[7px] text-ink/40 dark:text-cloud/56">PME • 4 vidas</p>
                </div>
              </div>
            </div>

            {/* Dragging Card Overlay (floating) */}
            <div className="absolute top-[38px] left-[18%] sm:left-[20%] z-20 w-[90px] sm:w-[100px] rounded-lg border border-cobalt/35 bg-white p-1.5 shadow-xl animate-mini-float pointer-events-none dark:border-cobalt/45 dark:bg-[#324560]">
              <div className="flex items-start justify-between">
                <span className="block h-1 w-5 rounded-full bg-cobalt mb-1" />
                <span className="text-cobalt/60">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-2 w-2"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </span>
              </div>
              <p className="text-[9px] font-bold leading-tight text-ink dark:text-cloud">Marina Azevedo</p>
              <p className="mt-0.5 text-[7px] text-ink/40 dark:text-cloud/56">PME • 48 vidas</p>
              
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

  const canScrollLeft = activeIndex > 0;
  const canScrollRight = activeIndex < cards.length - 1;

  const scroll = (direction: "left" | "right") => {
    const nextIndex =
      direction === "right"
        ? Math.min(cards.length - 1, activeIndex + 1)
        : Math.max(0, activeIndex - 1);

    if (nextIndex !== activeIndex) {
      scrollToCard(nextIndex);
    }
  };

  return (
    <section className="relative overflow-hidden pb-24" id="como-funciona">
      {/* Header aligned with section-shell */}
      <div className="section-shell">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-12 text-3.5xl sm:text-4xl md:text-5.5xl font-bold tracking-tight text-ink dark:text-cloud leading-[1.06]">
            Crie, capture e acompanhe.
          </h2>
        </div>
      </div>

      {/* Carousel Window - FULL WIDTH of the screen */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
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
            className={`w-[290px] sm:w-[480px] md:w-[560px] aspect-[1.15/1] sm:aspect-[4/3] md:aspect-[1.4/1] shrink-0 rounded-[30px] border ${card.borderColor} ${card.bgColor} p-6 sm:p-9 md:p-10 flex flex-col justify-between snap-start shadow-[0_24px_60px_rgba(18,23,33,0.08)] transition-all duration-500 hover:scale-[1.005] hover:shadow-[0_24px_60px_rgba(0,0,0,0.06)] dark:ring-1 dark:ring-white/6 dark:shadow-[0_28px_90px_rgba(0,0,0,0.40)] dark:hover:shadow-[0_38px_120px_rgba(0,0,0,0.48)] relative group`}
          >
            {/* Top Left single block bold typography */}
            <div className="text-left">
              <p className={`text-base sm:text-lg md:text-xl font-bold leading-snug tracking-tight max-w-[92%] ${card.textColor}`}>
                {card.titleText}
              </p>
            </div>

            {/* Bottom aligned mockup visual with high whitespace (respiro) */}
            <div className="mt-8 flex justify-center items-center h-[170px] sm:h-[220px] w-full rounded-2xl bg-muted/0 p-2.5 transition-all duration-300">
              {card.visual}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation & Indicators Block (Apple Style: Right aligned setas, left aligned indicators) */}
      <div className="section-shell">
        <div className="relative z-20 mt-8 flex items-center justify-between px-4">
          {/* Pagination Indicators (Left) */}
          <div className="flex gap-2">
            {cards.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToCard(i)}
                className={`relative z-10 h-2 touch-manipulation rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-6 bg-cobalt" : "w-2 bg-ink/15 hover:bg-ink/30"
                }`}
                aria-label={`Ir para destaque ${i + 1}`}
              />
            ))}
          </div>

          {/* Action Navigation Arrows (Right) */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`surface-card-strong relative z-10 flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-neutral-300 bg-white/80 text-ink transition-all duration-300 dark:text-cloud ${
                !canScrollLeft ? "opacity-30 cursor-not-allowed" : "active:scale-95 hover:border-ink/20 hover:-translate-x-0.5 shadow-sm"
              }`}
              aria-label="Destaque anterior"
            >
              <ChevronLeft size={20} className="stroke-[2.5px]" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`surface-card-strong relative z-10 flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-neutral-300 bg-white/80 text-ink transition-all duration-300 dark:text-cloud ${
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

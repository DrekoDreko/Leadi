"use client";
import { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  Facebook,
  Instagram,
  UserPlus,
  UsersRound,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  type LucideIcon
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  shortDesc: string;
  icon: LucideIcon;
  previewTitle: string;
  previewContent: React.ReactNode;
}

export function FlowSection() {
  const [activeStep, setActiveStep] = useState(1);
  const [isAutoplay, setIsAutoplay] = useState(true);

  const steps: Step[] = [
    {
      id: 1,
      title: "1. Criação com IA",
      shortDesc: "A IA cria ideias, textos e criativos estruturados de alta conversão.",
      icon: Sparkles,
      previewTitle: "Briefing & Copy Gerados por IA",
      previewContent: (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-[18px] border border-cobalt/10 bg-cobalt/5 p-4 dark:bg-cobalt/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-cobalt flex items-center gap-1.5 mb-2">
              <Sparkles size={12} /> Prompt da Operação
            </span>
            <p className="text-sm font-semibold text-ink dark:text-cloud">
              &ldquo;Criar anúncio de plano de saúde para PME e MEI em Minas Gerais&rdquo;
            </p>
          </div>
          <div className="surface-card-strong rounded-[22px] p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-muted-soft text-xs font-semibold">Opção Sugerida</span>
            </div>
            <p className="text-base font-semibold leading-snug text-ink dark:text-cloud">
              Compare planos de saúde para sua empresa com MEI ou CNPJ. Cotação personalizada com até 40% de desconto na adesão.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="text-[11px] font-semibold bg-cobalt/10 text-cobalt px-2.5 py-1 rounded-full">PME & MEI</span>
              <span className="rounded-full bg-signal/30 px-2.5 py-1 text-[11px] font-semibold text-ink">Linguagem Consultiva</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Compliance",
      shortDesc: "O checklist aponta termos sensíveis antes de publicar a campanha.",
      icon: ShieldCheck,
      previewTitle: "Checklist de Linguagem Consultiva",
      previewContent: (
        <div className="space-y-3 animate-fade-in">
          <div className="surface-alert-success rounded-[20px] p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 mb-2">
              <CheckCircle2 size={12} /> Status: Seguro
            </span>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 size={14} className="text-emerald-600" /> Sem termos agressivos ou proibidos
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 size={14} className="text-emerald-600" /> Ausência de promessa de economia garantida
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 size={14} className="text-emerald-600" /> Estrutura informativa/consultiva validada
              </li>
            </ul>
          </div>
          <div className="surface-card rounded-[20px] p-4 shadow-soft">
            <p className="text-muted-soft text-xs font-semibold uppercase">Sugestão Técnica</p>
            <p className="mt-1 text-sm italic text-foreground/80">
              &ldquo;A linguagem foi ajustada para conformidade absoluta com as políticas do Meta Business.&rdquo;
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "3. Preparação no Meta",
      shortDesc: "A campanha é configurada com foco em Facebook e Instagram Lead Ads.",
      icon: Facebook,
      previewTitle: "Pronto para Meta Lead Ads",
      previewContent: (
        <div className="space-y-4 animate-fade-in">
          <div className="surface-card rounded-[22px] mx-auto max-w-[290px] p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-cobalt flex items-center justify-center text-white font-bold text-xs">
                L
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Aliança Corretora</p>
                <p className="text-[10px] text-ink/40 dark:text-cloud/52">Patrocinado</p>
              </div>
            </div>
            <p className="mb-3 text-xs leading-snug text-ink dark:text-cloud">
              Compare as melhores opções de planos de saúde de forma rápida e segura.
            </p>
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-ink/8 bg-neutral-100 dark:border-border/60 dark:bg-dashboard-card-muted/92">
              <span className="text-xs font-medium text-ink/40 dark:text-cloud/52">Criativo de Saúde PME</span>
              <div className="absolute bottom-2 right-2 flex gap-1">
                <span className="bg-black/60 p-1 rounded-full text-white"><Facebook size={12} /></span>
                <span className="bg-black/60 p-1 rounded-full text-white"><Instagram size={12} /></span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-ink/6 pt-3">
              <div>
                <p className="text-[10px] text-ink/50 uppercase">Formulário de Leads</p>
                <p className="text-xs font-semibold">Solicitar Cotação CNPJ</p>
              </div>
                <span className="rounded bg-cobalt px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
                Cadastrar-se
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "4. Entrada de Leads",
      shortDesc: "Os leads dos formulários são importados e centralizados instantaneamente.",
      icon: UserPlus,
      previewTitle: "Notificação em Tempo Real",
      previewContent: (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-[24px] bg-gradient-to-r from-cobalt to-indigo-600 p-5 text-white shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <UserPlus size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold opacity-75">Meta Lead Ads • Há 2 segundos</p>
                <h4 className="text-base font-bold">Novo Lead Recebido!</h4>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="opacity-80">Nome:</span>
                <span className="font-semibold">Marcos Silva</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="opacity-80">Tipo de Plano:</span>
                <span className="font-semibold">PME</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="opacity-80">Quantidade de vidas:</span>
                <span className="font-semibold">4</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="opacity-80">Origem:</span>
                <span className="font-semibold text-signal">Campanha • MG • PME</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "5. Organização no CRM",
      shortDesc: "O CRM divide os leads por responsáveis e coloca-os no status correto.",
      icon: UsersRound,
      previewTitle: "Distribuição e Kanban Leadi",
      previewContent: (
        <div className="space-y-4 animate-fade-in">
          <div className="surface-card rounded-[22px] p-5 shadow-soft">
            <div className="flex items-center justify-between border-b border-ink/8 pb-3 mb-3">
              <div>
                <span className="rounded-full bg-signal px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                  Primeiro Contato
                </span>
                <h4 className="text-base font-bold mt-1">Marcos Silva</h4>
              </div>
              <div className="h-8 w-8 rounded-full bg-cobalt/10 text-cobalt flex items-center justify-center font-bold text-xs">
                MS
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/50 dark:text-cloud/58">Responsável:</span>
                <span className="font-semibold text-ink">Consultor Gabriel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50 dark:text-cloud/58">E-mail:</span>
                <span className="font-semibold text-ink">marcos@silva.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50 dark:text-cloud/58">Telefone:</span>
                <span className="font-semibold text-ink">(31) 98765-4321</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "6. Mensagens com IA",
      shortDesc: "A IA sugere abordagens de WhatsApp personalizadas e consultivas.",
      icon: MessageSquare,
      previewTitle: "Abordagem Inteligente por WhatsApp",
      previewContent: (
        <div className="space-y-4 animate-fade-in">
          <div className="surface-card rounded-[22px] p-5 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-cobalt flex items-center gap-1.5 mb-3">
              <Sparkles size={12} /> Sugestão de IA para WhatsApp
            </span>
            <div className="surface-alert-success relative rounded-2xl p-4 text-sm leading-relaxed text-foreground">
              <p>
                &ldquo;Olá Marcos! Tudo bem? Sou o Gabriel da Aliança Corretora. Vi que você solicitou uma simulação de plano de saúde para <strong>4 vidas</strong>.&rdquo;
              </p>
              <p className="mt-2">
                &ldquo;Preparei um comparativo das principais operadoras que atendem em <strong>Minas Gerais</strong>. Podemos falar 5 minutinhos hoje às 14h para alinhar suas preferências?&rdquo;
              </p>
              <span className="absolute bottom-2 right-3 text-[10px] text-ink/40 dark:text-cloud/52">Revisado por IA</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-full bg-ink py-2.5 text-xs font-semibold text-cloud transition hover:-translate-y-0.5">
                Copiar
              </button>
              <button className="flex-1 bg-cobalt text-white rounded-full py-2.5 text-xs font-semibold transition hover:-translate-y-0.5 flex items-center justify-center gap-1.5">
                <MessageSquare size={13} /> Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "7. Funil e Follow-up",
      shortDesc: "Monitore propostas e acompanhe negociações até o fechamento.",
      icon: TrendingUp,
      previewTitle: "Fechamento da Oportunidade",
      previewContent: (
        <div className="space-y-4 animate-fade-in">
          <div className="surface-card rounded-[22px] p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-ink dark:text-cloud">Histórico da Negociação</h4>
              <span className="surface-alert-success rounded-full px-2.5 py-0.5 text-xs font-semibold">
                Proposta Enviada
              </span>
            </div>
            <div className="relative border-l border-ink/10 pl-4 space-y-4 text-xs">
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-cobalt"></span>
                <p className="font-bold text-ink">Proposta Comercial Enviada</p>
                <p className="text-ink/50 mt-0.5">Comparativo Bradesco, Amil e SulAmérica</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-signal"></span>
                <p className="font-bold text-ink">Contato via WhatsApp</p>
                <p className="text-ink/50 mt-0.5">Confirmou recebimento dos valores e vidas.</p>
              </div>
            </div>
            <div className="mt-5 border-t border-ink/8 pt-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-ink/40 uppercase">Valor Estimado</p>
                <p className="text-lg font-bold text-ink">R$ 2.450 /mês</p>
              </div>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-5 rounded-full text-xs transition">
                Ganhar Lead
              </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Auto-play logic to switch steps every 5 seconds on desktop unless paused
  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev === steps.length ? 1 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoplay, steps.length]);

  const activeStepData = steps.find((s) => s.id === activeStep) || steps[0];

  return (
    <section className="section-shell pb-24" id="como-funciona">
      <div className="mb-12 max-w-3xl text-center md:text-left">
        <p className="mb-3 text-sm font-semibold text-cobalt uppercase tracking-wider">Como funciona</p>
        <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
          Da ideia do anúncio ao lead no CRM
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink/64 md:text-lg">
          O Leadi unifica as etapas de atração e conversão em um fluxo único, integrado e assistido por inteligência artificial.
        </p>
      </div>

      {/* Desktop view */}
      <div className="hidden lg:grid grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        {/* Left Side: Step selector cards */}
        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === activeStep;
            return (
              <button
                key={step.id}
                className={`w-full text-left p-4 rounded-[24px] transition-all duration-300 border flex items-start gap-4 ${
                  isActive
                    ? "glass-strong border-cobalt/20 shadow-[0_12px_36px_rgba(52,98,238,0.06)] bg-surface-elevated translate-x-2"
                    : "border-transparent bg-white/20 hover:bg-surface-elevated"
                }`}
                onClick={() => {
                  setActiveStep(step.id);
                  setIsAutoplay(false); // Stop autoplay when clicked
                }}
              >
                <div
                  className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    isActive ? "bg-cobalt text-cloud" : "bg-ink/5 text-ink/60"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className={`text-base font-semibold leading-tight ${isActive ? "text-ink" : "text-ink/80"}`}>
                    {step.title}
                  </h3>
                  <p className="text-sm mt-1 text-ink/60 leading-relaxed">{step.shortDesc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Interactive preview screen */}
        <div className="glass-strong rounded-[40px] p-8 border border-border relative shadow-soft min-h-[460px] flex flex-col justify-between overflow-hidden">
          {/* Header of mockup */}
          <div className="flex items-center justify-between border-b border-ink/8 pb-4 mb-6">
            <h4 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cobalt animate-pulse"></span>
              {activeStepData.previewTitle}
            </h4>
            <span className="text-xs font-semibold text-ink/40">Leadi Preview</span>
          </div>

          {/* Interactive Dynamic Content */}
          <div className="flex-1 flex flex-col justify-center">
            {activeStepData.previewContent}
          </div>

          {/* Bottom stepper navigator */}
          <div className="mt-8 flex items-center justify-between pt-4 border-t border-ink/6">
            <span className="text-xs font-bold text-ink/40 uppercase">
              Etapa {activeStep} de {steps.length}
            </span>
            <div className="flex gap-1.5">
              {steps.map((s) => (
                <button
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s.id === activeStep ? "w-6 bg-cobalt" : "w-1.5 bg-ink/20"
                  }`}
                  onClick={() => {
                    setActiveStep(s.id);
                    setIsAutoplay(false);
                  }}
                  aria-label={`Ir para etapa ${s.id}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="lg:hidden space-y-6">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="glass-strong rounded-[28px] p-6 border border-border shadow-soft">
              <div className="flex items-center gap-3.5 border-b border-ink/6 pb-3.5 mb-4">
                <div className="h-10 w-10 rounded-full bg-cobalt flex items-center justify-center text-white shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink leading-tight">{step.title}</h3>
                  <p className="text-xs text-ink/50 mt-0.5">{step.shortDesc}</p>
                </div>
              </div>
              <div className="rounded-[20px] bg-surface-elevated p-4 border border-border shadow-inner">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/40 mb-3">{step.previewTitle}</p>
                {step.previewContent}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  RotateCw,
  Sparkles,
  Share,
  Upload,
  UserPlus,
  UsersRound
} from "lucide-react";
import { campaignDraft, kanbanColumns, leads } from "@/data/mock";

export function MockDashboardPreview() {
  return (
    <div className="pointer-events-none relative w-full select-none overflow-hidden rounded-[34px] border border-border/60 bg-surface-elevated/80 shadow-[0_24px_70px_rgba(18,23,33,0.16)] backdrop-blur-3xl">
      <div className="relative flex h-12 items-center border-b border-white/12 bg-[#1b2230] px-4 text-white">
        <div className="flex items-center gap-2 pr-3">
          <span className="h-3.5 w-3.5 rounded-full bg-[#ff5f57]" aria-hidden="true" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#ffbd2e]" aria-hidden="true" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" aria-hidden="true" />
        </div>

        <div className="hidden items-center rounded-full border border-white/10 bg-[#141b27] p-1 md:flex">
          <div className="flex h-7 w-8 items-center justify-center rounded-full text-white/86">
            <ChevronLeft size={18} aria-hidden="true" />
          </div>
          <div className="flex h-7 w-8 items-center justify-center rounded-full text-white/36">
            <ChevronRight size={18} aria-hidden="true" />
          </div>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-7 w-[clamp(220px,40vw,460px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#141b27] px-3 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]">
          <span className="truncate">Leadi</span>
          <div className="absolute right-3 hidden items-center gap-2 text-white/74 lg:flex">
            <RotateCw size={15} aria-hidden="true" />
          </div>
        </div>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          {[
            { label: "Compartilhar", icon: Share },
            { label: "Nova aba", icon: Plus },
            { label: "Visão geral de abas", icon: Copy }
          ].map((item) => (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/88"
              key={item.label}
            >
              <item.icon size={17} aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-5 xl:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[64px_minmax(0,1fr)_320px] xl:grid-cols-[70px_minmax(0,1fr)_360px]">
        <aside className="hidden rounded-[32px] bg-[#1b2230] px-3 py-5 text-white shadow-soft lg:flex lg:flex-col lg:items-center lg:justify-between">
          <div className="space-y-4">
            {[
              { label: "Leads", icon: UsersRound },
              { label: "Importar Leads", icon: Upload },
              { label: "Criar Equipe", icon: UserPlus },
              { label: "Criações", icon: Sparkles }
            ].map((item) => (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
                key={item.label}
              >
                <item.icon size={18} aria-hidden="true" />
              </div>
            ))}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-signal text-ink">
            <Sparkles size={18} aria-hidden="true" />
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Novo lead Meta" value="Marina Azevedo" delta="Responsável atribuído" />
            <MetricCard label="Leads recebidos" value="128 no mês" delta="+18% do Meta" />
            <MetricCard label="Proposta em andamento" value="31 ativas" delta="Funil comercial" />
          </div>

          <section className="glass-strong rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
              <p className="text-muted-soft text-sm">Funil de oportunidades</p>
                <h2 className="text-2xl font-semibold">Plano de Saúde PME</h2>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-cobalt/10 px-3 py-1.5 text-xs font-semibold text-cobalt flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cobalt"></span>
                  Meta Lead Ads ativo
                </span>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {kanbanColumns.map((column) => (
                <div className="surface-card-muted min-w-0 rounded-[28px] p-3" key={column.title}>
                  <p className="text-muted-soft mb-2 px-1 text-xs font-semibold uppercase tracking-wider">{column.title}</p>
                  <div className="flex flex-col gap-2">
                    {column.cards.map((lead) => (
                      <div
                        className={`${column.color} flex min-h-[132px] flex-col justify-between rounded-[24px] p-4 shadow-soft`}
                        key={lead.id}
                      >
                        <div className="space-y-3">
                          <p className="text-base font-semibold leading-tight">
                            {lead.name}
                          </p>
                          <p className="text-xs opacity-75">{lead.companyName || "PME"}</p>
                          <p className="text-sm font-medium opacity-90">{lead.livesCount ? `${lead.livesCount} vidas` : ""}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] opacity-75">
                          <span>{lead.owner}</span>
                          <span>{lead.budget}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="glass rounded-[30px] p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Captura automática Meta</h3>
                  <p className="text-muted-soft mt-1 text-sm">
                    Leads importados dos formulários.
                  </p>
                </div>
                <UsersRound size={18} aria-hidden="true" />
              </div>
              <div className="space-y-2">
                {leads.slice(0, 3).map((lead) => (
                  <div
                    className="surface-card-muted flex items-start justify-between gap-3 rounded-[22px] p-3"
                    key={lead.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{lead.name}</p>
                      <p className="text-muted-soft mt-1 text-xs">{lead.companyName || "PME"}</p>
                    </div>
                    <span className="rounded-full bg-cobalt/10 text-cobalt px-2.5 py-1 text-[11px] font-semibold">
                      Meta Ads
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass rounded-[30px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-cobalt" />
                  <h3 className="font-semibold">Campanha criada com IA</h3>
                </div>
                <span className="surface-alert-success rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  Checklist aprovado
                </span>
              </div>
              <p className="text-base font-semibold leading-snug text-foreground">{campaignDraft.title}</p>
              <p className="text-muted-soft mt-3 text-sm leading-6">
                {campaignDraft.copy}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-cobalt px-3 py-1.5 text-xs font-medium text-white">
                  Linguagem Consultiva
                </span>
                <span className="rounded-full bg-signal px-3 py-1.5 text-xs font-medium text-ink">
                  Preparado para Meta
                </span>
              </div>
            </section>
          </div>
        </main>

        <aside className="min-w-0 space-y-4">
          <section className="glass-strong rounded-[34px] p-5 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3462EE,#4A91A8)] text-2.5xl font-semibold text-white shadow-soft">
              MA
            </div>
            <h3 className="text-xl font-bold">{leads[0].name}</h3>
            <p className="text-muted-soft mt-1 text-xs">{leads[0].companyName} • {leads[0].livesCount} vidas</p>
            
            {/* Suggested WhatsApp message block */}
            <div className="surface-card-muted mt-4 rounded-2xl p-3.5 text-left text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-cobalt uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} /> Mensagem por IA
                </span>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Recomendada</span>
              </div>
              <p className="text-foreground/76 leading-relaxed italic">
                &ldquo;Olá Marina! Vi que solicitou cotação para 48 vidas da Azevedo Clínica. Montei um estudo Bradesco e Amil...&rdquo;
              </p>
            </div>

            <div className="mt-4 flex justify-center gap-2">
              <div className="rounded-full bg-cobalt text-white flex px-4 py-2 text-xs font-semibold items-center gap-1.5 shadow-soft cursor-pointer hover:bg-cobalt/95">
                <Sparkles size={14} />
                Enviar WhatsApp
              </div>
            </div>
          </section>

          <section className="glass rounded-[34px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Detalhes do Lead</h3>
            </div>
            <div className="space-y-3 text-xs">
              <InfoRow label="Origem" value="Meta Lead Ads" />
              <InfoRow label="Campanha" value="PME Campinas" />
              <InfoRow label="Orçamento" value="R$ 18k/mês" />
            </div>
          </section>
        </aside>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="glass rounded-[28px] p-5">
      <p className="text-muted-soft text-sm">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <strong className="text-3xl font-semibold">{value}</strong>
        <span className="rounded-full bg-signal px-2.5 py-1 text-xs font-medium">
          {delta}
        </span>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/8 pb-3 last:border-0 last:pb-0">
      <span className="text-muted-soft">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

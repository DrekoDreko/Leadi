import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
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
    <div className="pointer-events-none relative w-full select-none overflow-hidden rounded-[34px] border border-[#1d2229] bg-white/24 shadow-[0_24px_70px_rgba(18,23,33,0.10)] backdrop-blur-3xl">
      <div className="relative flex h-12 items-center border-b border-white/10 bg-[#303438] px-4 text-white">
        <div className="flex items-center gap-2 pr-3">
          <span className="h-3.5 w-3.5 rounded-full bg-[#ff5f57]" aria-hidden="true" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#ffbd2e]" aria-hidden="true" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" aria-hidden="true" />
        </div>

        <div className="hidden items-center rounded-full border border-white/10 bg-[#24292a] p-1 md:flex">
          <div className="flex h-7 w-8 items-center justify-center rounded-full text-white/86">
            <ChevronLeft size={18} aria-hidden="true" />
          </div>
          <div className="flex h-7 w-8 items-center justify-center rounded-full text-white/36">
            <ChevronRight size={18} aria-hidden="true" />
          </div>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-7 w-[clamp(220px,40vw,460px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#24292a] px-3 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]">
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
        <aside className="hidden rounded-[32px] bg-[#303438] px-3 py-5 text-white shadow-soft lg:flex lg:flex-col lg:items-center lg:justify-between">
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
            <MetricCard label="Leads no mês" value="128" delta="+18%" />
            <MetricCard label="Em proposta" value="31" delta="+6 hoje" />
            <MetricCard label="Pedidos ativos" value="9" delta="+2 novos" />
          </div>

          <section className="glass-strong rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-ink/55">Funil de oportunidades</p>
                <h2 className="text-2xl font-semibold">Plano empresarial</h2>
              </div>
              <div className="flex gap-2">
                <div className="icon-button">
                  <MoreHorizontal size={18} aria-hidden="true" />
                </div>
                <div className="icon-button">
                  <ArrowUpRight size={18} aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {kanbanColumns.map((column) => (
                <div className="min-w-0 rounded-[28px] bg-white/42 p-3" key={column.title}>
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
                          <p className="text-sm opacity-85">{lead.owner}</p>
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
                  <h3 className="font-semibold">Leads recentes</h3>
                  <p className="mt-1 text-sm text-ink/54">
                    Contatos em atendimento na operação.
                  </p>
                </div>
                <UsersRound size={18} aria-hidden="true" />
              </div>
              <div className="space-y-2">
                {leads.slice(0, 3).map((lead) => (
                  <div
                    className="flex items-start justify-between gap-3 rounded-[22px] bg-white/44 p-3"
                    key={lead.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{lead.name}</p>
                      <p className="mt-1 text-sm text-ink/58">{lead.owner}</p>
                    </div>
                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-ink/62">
                      {lead.stage}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass rounded-[30px] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Criar nova campanha</h3>
                  <Sparkles size={18} aria-hidden="true" />
                </div>
              <p className="text-lg font-semibold">{campaignDraft.title}</p>
              <p className="mt-3 text-sm leading-6 text-ink/64">
                {campaignDraft.copy}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-cobalt px-3 py-1.5 text-xs font-medium text-white">
                  Seguro para Meta
                </span>
                <span className="rounded-full bg-signal px-3 py-1.5 text-xs font-medium text-ink">
                  MEI, ME e LTDA
                </span>
              </div>
            </section>
          </div>
        </main>

        <aside className="min-w-0 space-y-4">
          <section className="glass-strong rounded-[34px] p-5 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3462EE,#4A91A8)] text-3xl font-semibold text-white shadow-soft">
              MA
            </div>
            <h3 className="text-2xl font-semibold">{leads[0].name}</h3>
            <p className="mt-1 text-sm text-ink/58">{leads[0].phone}</p>
            <p className="mt-1 text-sm text-ink/58">{leads[0].email}</p>
            <div className="mt-6 flex justify-center gap-2">
              {[
                { label: "Mensagem", icon: Sparkles },
                { label: "Concluir", icon: CheckCircle2 }
              ].map((item) => (
                <div
                  className="icon-button"
                  key={item.label}
                >
                  <item.icon size={18} aria-hidden="true" />
                </div>
              ))}
            </div>
          </section>

          <section className="glass rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">Informações</h3>
              <div className="icon-button">
                <ArrowUpRight size={18} aria-hidden="true" />
              </div>
            </div>
            <div className="space-y-4 text-sm">
              <InfoRow label="Nome" value={leads[0].name} />
              <InfoRow label="Telefone" value={leads[0].phone} />
              <InfoRow label="Email" value={leads[0].email} />
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
      <p className="text-sm text-ink/56">{label}</p>
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
      <span className="text-ink/48">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

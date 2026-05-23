import Link from "next/link";
import { ArrowUpRight, Megaphone, ShieldCheck, Pause, CheckCircle2, Copy } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";

function getStatusDisplay(publicationStatus: string, publishMode: string) {
  if (publishMode === "paused" || publicationStatus === "paused") {
    return { label: "Pausada", color: "bg-amber-100/80 text-amber-900 border border-amber-200/50", Icon: Pause };
  }
  if (publicationStatus === "published") {
    return { label: "Publicada", color: "bg-emerald-100/80 text-emerald-900 border border-emerald-200/50", Icon: CheckCircle2 };
  }
  if (publicationStatus === "not_connected") {
    return { label: "Pronta", color: "bg-blue-100/80 text-blue-900 border border-blue-200/50", Icon: ShieldCheck };
  }
  if (publicationStatus === "ready_to_prepare" || publicationStatus === "draft_created" || publicationStatus === "pending_review") {
    return { label: "Revisão Manual", color: "bg-purple-100/80 text-purple-900 border border-purple-200/50", Icon: ShieldCheck };
  }
  return { label: publicationStatus.replaceAll("_", " "), color: "bg-white/62 text-ink/62 border border-white/20", Icon: ShieldCheck };
}

export default async function AnunciosPage() {
  const campaignState = await getCampaignsForCurrentUser(12);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Anúncios"
        title="Meus anúncios"
        description="Veja campanhas já geradas, acompanhe o estado atual e retome uma criação quando precisar revisar ou duplicar a ideia."
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white"
          href="/dashboard/criacoes/campanhas"
        >
          Criar anúncio
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      {campaignState.message ? (
        <div
          className={`rounded-[26px] border p-4 text-sm ${
            campaignState.mode === "supabase"
              ? "border-white/46 bg-white/34 text-ink/72"
              : "border-amber-200/70 bg-amber-50/80 text-amber-900"
          }`}
        >
          {campaignState.message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {campaignState.campaigns.length ? (
          campaignState.campaigns.map((campaign) => (
            <article
              className="glass-strong flex min-h-[220px] flex-col justify-between rounded-[30px] p-5"
              key={campaign.id}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  {(() => {
                    const status = getStatusDisplay(campaign.publicationStatus, campaign.publishMode);
                    const StatusIcon = status.Icon;
                    return (
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${status.color}`}>
                        <StatusIcon size={14} aria-hidden="true" />
                        {status.label}
                      </span>
                    );
                  })()}
                  <Megaphone className="text-cobalt" size={18} aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-xl font-semibold leading-tight">{campaign.campaignName}</h2>
                <div className="mt-3 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40">Copy Principal</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/62">{campaign.result.primaryText}</p>
                  </div>
                  
                  {campaign.result.variants && campaign.result.variants.length > 0 && (
                    <div className="border-t border-white/40 pt-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40 mb-2">Variações Geradas</h3>
                      <ul className="space-y-3">
                        {campaign.result.variants.map((variant, index) => (
                          <li key={index} className="rounded-xl bg-white/40 p-3 text-sm leading-6 text-ink/62 shadow-sm">
                            {variant}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-4 border-t border-white/40 pt-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold text-ink/58">
                    {campaign.input.audience}
                  </span>
                  <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold text-ink/58">
                    {new Date(campaign.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <Link
                  href={`/dashboard/criacoes/campanhas?copyFrom=${campaign.id}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/60 px-4 py-2 text-xs font-semibold text-cobalt transition-colors hover:bg-white"
                >
                  <Copy size={14} aria-hidden="true" />
                  Reaproveitar ideia
                </Link>
              </div>
            </article>
          ))
        ) : (
          <article className="glass-strong rounded-[30px] p-6 md:col-span-2 xl:col-span-3">
            <h2 className="text-2xl font-semibold">Nenhum anúncio salvo ainda</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/62">
              Assim que você criar campanhas na área de Criações, elas aparecem aqui com o
              histórico principal da conta.
            </p>
          </article>
        )}
      </section>
    </div>
  );
}

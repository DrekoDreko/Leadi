import Link from "next/link";
import { ArrowUpRight, Megaphone, ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";

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
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1.5 text-xs font-semibold text-ink/62">
                    <ShieldCheck size={14} aria-hidden="true" />
                    {campaign.publicationStatus.replaceAll("_", " ")}
                  </span>
                  <Megaphone className="text-cobalt" size={18} aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-xl font-semibold leading-tight">{campaign.campaignName}</h2>
                <p className="mt-3 text-sm leading-6 text-ink/62">{campaign.result.primaryText}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold text-ink/58">
                  {campaign.input.audience}
                </span>
                <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold text-ink/58">
                  {new Date(campaign.createdAt).toLocaleDateString("pt-BR")}
                </span>
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

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, FileText, TrendingUp } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { CampaignListClient } from "./campaign-list-client";

export default async function AnunciosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const context = await requireCompletedProfile();
  if (!context.isOwner) {
    redirect("/dashboard/criacoes");
  }
  const params = await searchParams;
  const filterDrafts = params.filtro === "rascunhos";
  const campaignState = await getCampaignsForCurrentUser(50);

  const displayedCampaigns = filterDrafts
    ? campaignState.campaigns.filter(
        (c) => c.publishMode === "draft" || c.publicationStatus === "draft_created"
      )
    : campaignState.campaigns;

  const draftCount = campaignState.campaigns.filter(
    (c) => c.publishMode === "draft" || c.publicationStatus === "draft_created"
  ).length;

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Anúncios"
        title={filterDrafts ? "Meus rascunhos" : "Meus anúncios"}
        description={
          filterDrafts
            ? "Campanhas salvas como rascunho. Retome a edição ou publique quando estiver pronto."
            : "Veja campanhas já geradas, acompanhe o estado atual e retome uma criação quando precisar revisar ou duplicar a ideia."
        }
      >
        <div className="flex items-center gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-cobalt/20 bg-surface-elevated px-5 py-3 text-sm font-semibold text-cobalt transition-colors hover:bg-surface-elevated"
            href="/dashboard/desempenho"
          >
            <TrendingUp size={16} aria-hidden="true" />
            Desempenho
          </Link>
          {filterDrafts ? (
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-cobalt/20 bg-surface-elevated px-5 py-3 text-sm font-semibold text-cobalt transition-colors hover:bg-surface-elevated"
              href="/dashboard/anuncios"
            >
              Ver todos
            </Link>
          ) : draftCount > 0 ? (
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-cobalt/20 bg-surface-elevated px-5 py-3 text-sm font-semibold text-cobalt transition-colors hover:bg-surface-elevated"
              href="/dashboard/anuncios?filtro=rascunhos"
            >
              <FileText size={16} aria-hidden="true" />
              Rascunhos
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cobalt/10 px-1.5 text-xs font-bold text-cobalt">
                {draftCount}
              </span>
            </Link>
          ) : null}
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white"
            href="/dashboard/criacoes/campanhas"
          >
            Criar anúncio
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </PageHeading>

      {campaignState.message ? (
        <div
          className={`rounded-[26px] border p-4 text-sm ${
            campaignState.mode === "supabase"
              ? "border-border bg-surface-elevated text-ink/72"
              : "border-amber-200/70 bg-amber-50/80 text-amber-900"
          }`}
        >
          {campaignState.message}
        </div>
      ) : null}

      {displayedCampaigns.length ? (
        <CampaignListClient campaigns={displayedCampaigns} />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="glass-strong rounded-[30px] p-6 md:col-span-2 xl:col-span-3">
            <h2 className="text-2xl font-semibold">
              {filterDrafts ? "Nenhum rascunho salvo ainda" : "Nenhum anúncio salvo ainda"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/62">
              {filterDrafts
                ? "Ao criar uma campanha, clique em \"Salvar rascunho para publicar depois\" para salvá-la aqui."
                : "Assim que você criar campanhas na área de Criações, elas aparecem aqui com o histórico principal da conta."}
            </p>
          </article>
        </section>
      )}
    </div>
  );
}

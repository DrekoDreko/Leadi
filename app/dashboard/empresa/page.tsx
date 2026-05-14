import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Link2,
  RefreshCw,
  ShieldCheck,
  Unplug,
  UserPlus,
  UsersRound
} from "lucide-react";
import { AiCreditsPanel, OpenAIComingSoonCard } from "@/components/dashboard/ai-credits-panel";
import { PageHeading } from "@/components/dashboard/widgets";
import { getAiBalance } from "@/lib/ai/credits";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";

const COMPANY_RETURN_TO = "/dashboard/empresa";

const integrationFeedbackMessages: Record<string, string> = {
  connected: "Conta Meta conectada com sucesso.",
  disconnected: "Conta Meta desconectada com sucesso.",
  coming_soon: "A conta OpenAI própria está em breve. Hoje as gerações usam os Créditos de IA da plataforma.",
  success: "Sincronizacao concluida com sucesso.",
  partial: "Sincronizacao concluida com avisos.",
  error: "Nao foi possivel concluir a atualizacao das contas conectadas."
};

export default async function EmpresaPage({
  searchParams
}: {
  searchParams?: Promise<{
    meta?: string;
    openai?: string;
    sync?: string;
  }>;
}) {
  const context = await requireCompletedProfile();
  const params = await searchParams;
  const connectedAccounts = await getConnectedAccountsForCurrentUser();
  const aiBalance = await getAiBalance(context.workspace?.id ?? "");

  const companyMessage =
    (params?.meta && integrationFeedbackMessages[params.meta]) ||
    (params?.openai && integrationFeedbackMessages[params.openai]) ||
    (params?.sync && integrationFeedbackMessages[params.sync]) ||
    connectedAccounts.message ||
    null;

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Empresa e contas conectadas"
        title="Operacao da conta"
        description="Aqui ficam os dados da empresa, as conexoes de Meta, o saldo de créditos de IA e a base para futuras integracoes com Facebook e Instagram."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink">
          <Building2 size={18} aria-hidden="true" />
          {context.workspaceName}
        </span>
      </PageHeading>

      {companyMessage ? (
        <p className="rounded-[22px] bg-white/50 px-4 py-3 text-sm font-semibold text-ink">
          {companyMessage}
        </p>
      ) : null}

      <section className="rounded-[34px] p-6 glass-strong">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-4">
            <article className="rounded-[28px] bg-white/46 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-cobalt">Meta</p>
                  <h3 className="mt-2 text-xl font-semibold">Conta conectada</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">
                    Conecte a conta Meta da empresa para importar paginas, formularios e preparar campanhas com os ativos autorizados.
                  </p>
                </div>
                <Link2 size={20} aria-hidden="true" />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <InfoTile
                  label="Status"
                  value={connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
                />
                <InfoTile
                  label="Paginas"
                  value={String(connectedAccounts.metaPages.length)}
                />
                <InfoTile
                  label="Formularios"
                  value={String(connectedAccounts.metaLeadForms.length)}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {connectedAccounts.canManageConnections ? (
                  <>
                    <a
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white ${
                        connectedAccounts.metaConnection ? "bg-cobalt" : "bg-ink"
                      }`}
                      href={`/api/integrations/meta/connect?returnTo=${encodeURIComponent(COMPANY_RETURN_TO)}`}
                    >
                      {connectedAccounts.metaConnection ? "Reconectar Meta" : "Conectar Meta"}
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </a>
                    <form action="/api/integrations/meta/sync" method="post">
                      <input name="returnTo" type="hidden" value={COMPANY_RETURN_TO} />
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/80"
                        type="submit"
                      >
                        <RefreshCw size={18} aria-hidden="true" />
                        Sincronizar ativos
                      </button>
                    </form>
                    {connectedAccounts.metaConnection ? (
                      <form action="/api/integrations/meta/disconnect" method="post">
                        <input name="returnTo" type="hidden" value={COMPANY_RETURN_TO} />
                        <button
                          className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/80"
                          type="submit"
                        >
                          <Unplug size={18} aria-hidden="true" />
                          Desconectar
                        </button>
                      </form>
                    ) : null}
                  </>
                ) : (
                  <span className="rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink/62">
                    Apenas owner e admins podem mudar conexoes.
                  </span>
                )}
              </div>
            </article>

            <AiCreditsPanel balance={aiBalance} />
            <div className="mt-4">
              <OpenAIComingSoonCard />
            </div>
          </div>

          <div className="space-y-4">
            <article className="rounded-[28px] bg-white/46 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-cobalt">Integracoes futuras</p>
                  <h3 className="mt-2 text-xl font-semibold">Meta, Facebook e Instagram</h3>
                </div>
                <ShieldCheck size={20} aria-hidden="true" />
              </div>
              <div className="mt-4 space-y-3">
                {[
                  "Facebook e Instagram vao usar a base de permissoes da Meta conectada aqui.",
                  "As contas conectadas passam a ser a origem de anuncios, formularios e futuras automacoes.",
                  "O perfil empresa concentra as configuracoes da operacao sem espalhar botoes no menu."
                ].map((item) => (
                  <div className="rounded-[22px] bg-white/60 px-4 py-3 text-sm leading-6 text-ink/64" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] bg-white/46 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-cobalt">Equipe</p>
                  <h3 className="mt-2 text-xl font-semibold">Convidar para a equipe</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">
                    Em breve o supervisor podera gerar um link para convidar vendedores que entram automaticamente no modo simples da empresa.
                  </p>
                </div>
                <UsersRound size={20} aria-hidden="true" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-ink/10 px-4 py-3 text-sm font-semibold text-ink/62"
                  disabled
                  type="button"
                >
                  <UserPlus size={18} aria-hidden="true" />
                  Em breve
                </button>
                {context.isManager || context.isSoloOwner ? (
                  <Link
                    className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/80"
                    href="/team/setup"
                  >
                    Ver equipe atual
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white/58 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

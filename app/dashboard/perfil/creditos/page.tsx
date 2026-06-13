import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Coins,
  ImagePlus,
  Megaphone,
  MessageSquareText,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { AiCreditsPanel } from "@/components/dashboard/ai-credits-panel";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/dashboard/widgets";
import { DEFAULT_AI_CREDIT_PACKAGES } from "@/lib/ai/credit-packages";
import {
  getCurrentAiBalanceDetails,
  getAiUsageHistory,
  listActiveAiCreditPackages,
  type AiUsageHistoryItem
} from "@/lib/ai/credits";
import { getAiCreditPurchaseEligibilityForOrganization } from "@/lib/ai/credit-orders.server";
import { cn } from "@/lib/utils";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getAccessibleWallets } from "@/lib/ai/wallets.server";
import { CreditPackagesSection } from "./credit-packages-section";

const purchaseFeedbackMessages: Record<string, { tone: "success" | "warning" | "error"; text: string }> = {
  confirmed: {
    tone: "success",
    text: "Pagamento confirmado. Os créditos de IA já foram adicionados ao saldo da organização."
  },
  pending: {
    tone: "warning",
    text: "Pagamento pendente. Assim que a confirmação do pagamento acontecer, os créditos entrarão automaticamente no saldo da organização."
  },
  failed: {
    tone: "error",
    text: "O pagamento não foi concluído. Revise os dados do cartão ou tente novamente."
  },
  cancelled: {
    tone: "error",
    text: "A compra foi cancelada antes da confirmação do pagamento."
  },
  package_unavailable: {
    tone: "error",
    text: "Esse pacote de créditos não está disponível no momento. Escolha outro pacote para continuar."
  }
};

const paymentReturnStatusMessages: Record<string, { tone: "success" | "warning" | "error"; text: string }> = {
  success: purchaseFeedbackMessages.confirmed,
  pending: purchaseFeedbackMessages.pending,
  failure: purchaseFeedbackMessages.failed
};

type ConsumptionCardItem = {
  title: string;
  consumption: string;
  description: string;
  supportText: string;
  icon: typeof MessageSquareText;
  featured?: boolean;
  breakdown?: Array<{
    label: string;
    value: string;
  }>;
};

const AI_CONSUMPTION_CARDS: ConsumptionCardItem[] = [
  {
    title: "Mensagem com IA",
    consumption: "1 crédito por geração",
    description:
      "Crie mensagens rápidas para WhatsApp, abordagem inicial, follow-up e respostas para leads.",
    supportText: "Ideal para agilizar o contato diário com novos leads.",
    icon: MessageSquareText
  },
  {
    title: "Campanha completa",
    consumption: "25 créditos por geração",
    description:
      "Receba uma estrutura completa com público, oferta, chamada principal, textos e sugestões de campanha.",
    supportText: "Ideal para quem quer sair do zero com uma campanha pronta para revisão.",
    icon: Megaphone
  },
  {
    title: "Revisão de anúncio",
    consumption: "10 créditos por análise",
    description:
      "Analise o texto antes de publicar e receba alertas sobre clareza, promessa exagerada e possíveis ajustes.",
    supportText: "Ajuda a revisar o anúncio antes de levar para publicação.",
    icon: ShieldCheck
  },
  {
    title: "Imagem de anúncio",
    consumption: "30 créditos por geração",
    description: "Gere imagens para usar em campanhas, criativos e peças de divulgação.",
    supportText: "Imagens em alta qualidade, prontas para usar em criativos e peças de divulgação.",
    icon: ImagePlus
  }
] as const;

export default async function PerfilCreditosPage({
  searchParams
}: {
  searchParams?: Promise<{
    purchase?: string;
    status?: string;
    showPackages?: string;
  }>;
}) {
  const context = await requireCompletedProfile();
  const params = await searchParams;

  let packagesError = "";
  const [aiBalance, purchaseAccess, accessibleWallets, usageHistory] = await Promise.all([
    getCurrentAiBalanceDetails(),
    context.workspace?.id
      ? getAiCreditPurchaseEligibilityForOrganization(context.workspace.id)
      : Promise.resolve({
          allowed: false,
          reason: "billing_not_configured" as const,
          message: "Billing ainda nao esta configurado neste ambiente.",
          subscriptionStatus: null
        }),
    getAccessibleWallets(),
    getAiUsageHistory(50)
  ]);
  const packages = purchaseAccess.allowed
    ? await listActiveAiCreditPackages().catch(() => {
        packagesError = "Nao foi possivel carregar os pacotes agora. Tente novamente em instantes.";
        return [];
      })
    : DEFAULT_AI_CREDIT_PACKAGES.map((pkg) => ({ ...pkg, id: null }));

  const purchaseFeedback =
    (params?.purchase && purchaseFeedbackMessages[params.purchase]) ||
    (params?.status && paymentReturnStatusMessages[params.status]) ||
    null;
  const purchaseSuccessMessage =
    "Os créditos serão adicionados ao saldo da organização após a confirmação do pagamento.";
  const purchaseRequirementMessage =
    purchaseAccess.allowed || context.role !== "owner"
      ? null
      : "Para comprar créditos, sua organização precisa ter uma assinatura ativa ou estar em período de teste.";

  let displayBalance = aiBalance.availableCredits;
  let includedBalance = aiBalance.includedCredits;
  let purchasedBalance = aiBalance.purchasedCredits;
  let walletLabel = "Saldo da organização";

  if (context.role === "admin" && context.teamId) {
    const teamWallet = accessibleWallets.find(
      (w) => w.walletType === "team" && w.teamId === context.teamId
    );
    if (teamWallet) {
      displayBalance = teamWallet.availableCredits;
      includedBalance = 0;
      purchasedBalance = 0;
      walletLabel = "Saldo da equipe";
    }
  } else if (context.role === "seller") {
    const userWallet = accessibleWallets.find((w) => w.walletType === "user");
    if (userWallet) {
      displayBalance = userWallet.availableCredits;
      includedBalance = 0;
      purchasedBalance = 0;
      walletLabel = "Meu saldo";
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Conta"
        title="Créditos de IA"
        description={
          context.role === "owner"
            ? "Acompanhe a franquia incluída do plano, o saldo extra comprado e o consumo das rotinas de IA da organização."
            : context.role === "admin"
              ? "Acompanhe o saldo de créditos alocados para sua equipe e solicite mais ao gestor se necessário."
              : "Acompanhe seu saldo de créditos disponível para uso nas rotinas de IA."
        }
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink dark:bg-white/12 dark:text-cloud">
          <Coins size={18} aria-hidden="true" />
          {walletLabel}: {displayBalance.toLocaleString("pt-BR")} créditos
        </span>
      </PageHeading>

      {purchaseFeedback ? (
        <FeedbackBanner message={purchaseFeedback.text} tone={purchaseFeedback.tone} />
      ) : null}

      {!purchaseFeedback && purchaseAccess.allowed ? (
        <FeedbackBanner message={purchaseSuccessMessage} tone="success" />
      ) : null}

      {packagesError ? <FeedbackBanner message={packagesError} tone="error" /> : null}

      <AiCreditsPanel
        includedBalance={includedBalance}
        purchaseRequirementMessage={purchaseRequirementMessage}
        purchasedBalance={purchasedBalance}
        totalBalance={displayBalance}
        walletLabel={walletLabel}
      />

      <section className="glass rounded-[34px] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cobalt">Consumo por ação</p>
            <h2 className="mt-2 text-2xl font-semibold">Veja quanto cada rotina consome</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/64">
              Cada ação informa o consumo antes de gerar. Assim você compara os pacotes com mais
              clareza e evita surpresas.
            </p>
          </div>
          <Coins className="text-cobalt" size={20} aria-hidden="true" />
        </div>

        <div className="mt-6 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AI_CONSUMPTION_CARDS.map((item) => (
            <ConsumptionCard item={item} key={item.title} />
          ))}
        </div>

        <p className="mt-4 flex items-start gap-3 rounded-[24px] border border-white/40 bg-white/28 px-4 py-3 text-sm leading-6 text-ink/62 dark:bg-white/[0.04] dark:text-cloud/72">
          <AlertCircle className="mt-0.5 shrink-0 text-cobalt" size={16} aria-hidden="true" />
          <span>Antes de qualquer geração, o sistema mostra quantos créditos serão consumidos.</span>
        </p>
      </section>

      <UsageHistorySection items={usageHistory} />

      {context.role !== "seller" ? (
        <CreditPackagesSection
          canPurchase={purchaseAccess.allowed}
          disabledMessage={purchaseAccess.allowed ? null : purchaseAccess.message}
          packages={packages}
          isOwner={context.isOwner}
        />
      ) : null}
    </div>
  );
}

function ConsumptionCard({
  item
}: {
  item: ConsumptionCardItem;
}) {
  const Icon = item.icon;

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[32px] border p-6 transition-all duration-300",
        item.featured
          ? "border-cobalt/30 bg-gradient-to-b from-cobalt/[0.08] to-transparent shadow-[0_24px_60px_rgba(52,98,238,0.12)]"
          : "border-white/50 bg-white/58 shadow-sm hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      )}
    >
      {/* Background glow on hover */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cobalt/5 blur-3xl transition-colors duration-500 group-hover:bg-cobalt/10 pointer-events-none" />

      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] shadow-sm",
            item.featured
              ? "bg-cobalt text-white shadow-md shadow-cobalt/20"
              : "bg-white border border-white/80 text-cobalt dark:bg-white/10 dark:border-white/5"
          )}
        >
          <Icon size={22} aria-hidden="true" />
        </span>
        <div className="pt-0.5">
          <h3 className="text-lg font-bold tracking-tight text-ink dark:text-cloud">{item.title}</h3>
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-cobalt/10 px-2.5 py-1 text-xs font-semibold text-cobalt dark:bg-cobalt/20">
            <Sparkles size={12} aria-hidden="true" />
            {item.consumption}
          </span>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-4">
        <p className="text-sm leading-relaxed text-ink/70 dark:text-cloud/70">
          {item.description}
        </p>

        {item.breakdown ? (
          <ul className="mt-4 space-y-2">
            {item.breakdown.map((entry) => (
              <li
                className="flex items-center justify-between gap-3 rounded-[16px] border border-white/60 bg-white/60 px-4 py-3 text-sm text-ink/80 dark:border-white/10 dark:bg-white/10 dark:text-cloud/80"
                key={entry.label}
              >
                <span className="font-medium">{entry.label}</span>
                <span className="font-bold text-ink dark:text-cloud">{entry.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-6 border-t border-ink/5 pt-5 dark:border-white/5">
        <p className="text-[13px] leading-relaxed text-ink/50 dark:text-cloud/50">
          {item.supportText}
        </p>
      </div>
    </Card>
  );
}

function FeedbackBanner({
  tone,
  message
}: {
  tone: "success" | "warning" | "error";
  message: string;
}) {
  const className =
    tone === "success"
      ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-900"
      : tone === "warning"
        ? "border-signal/28 bg-signal/14 text-ink dark:text-cloud"
        : "border-red-200/70 bg-red-50/80 text-red-800";
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? Clock3 : AlertCircle;

  return (
    <div className={`rounded-[24px] border p-4 text-sm leading-6 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
        <p>{message}</p>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  success: {
    label: "Sucesso",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  },
  failed: {
    label: "Falhou",
    className: "bg-red-500/10 text-red-700 dark:text-red-300"
  },
  refunded: {
    label: "Estornado",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300"
  }
} as const;

function UsageHistorySection({ items }: { items: AiUsageHistoryItem[] }) {
  return (
    <section className="glass rounded-[34px] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cobalt">Histórico</p>
          <h2 className="mt-2 text-2xl font-semibold">Uso de créditos</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/64">
            Registro de todas as ações que consumiram créditos de IA, incluindo estornos automáticos
            em caso de erro.
          </p>
        </div>
        <Clock3 className="text-cobalt" size={20} aria-hidden="true" />
      </div>

      {items.length > 0 ? (
        <div className="mt-6 space-y-3">
          {items.map((item) => {
            const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.failed;
            const date = new Date(item.createdAt);

            return (
              <div
                className="flex flex-col gap-2 rounded-[22px] border border-white/50 bg-white/58 p-4 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                key={item.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink dark:text-cloud">
                    {item.featureLabel}
                  </p>
                  <p className="mt-1 text-xs text-ink/54 dark:text-cloud/54">
                    {date.toLocaleDateString("pt-BR")} às{" "}
                    {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {item.errorMessage ? ` · ${item.errorMessage}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      status.className
                    )}
                  >
                    {status.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold",
                      item.status === "refunded"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : item.status === "success"
                          ? "bg-ink text-cloud"
                          : "bg-red-500/10 text-red-700 dark:text-red-300"
                    )}
                  >
                    {item.status === "refunded" ? "+" : "-"}
                    {item.creditsCharged}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 text-sm leading-6 text-ink/58">Nenhum uso de créditos registrado ainda.</p>
      )}
    </section>
  );
}

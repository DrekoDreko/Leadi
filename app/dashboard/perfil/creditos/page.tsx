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
import { UsageHistorySection } from "@/components/dashboard/usage-history-section";
import { DEFAULT_AI_CREDIT_PACKAGES } from "@/lib/ai/credit-packages";
import {
  getCurrentAiBalanceDetails,
  getAccessibleAiCreditsForUser,
  getAiUsageHistory,
  listActiveAiCreditPackages
} from "@/lib/ai/credits";
import {
  getAiCreditPurchaseEligibilityForOrganization,
  getLatestAiCreditOrderForUser,
  getAiCreditOrderPixDetails,
  isAiCreditOrderPixExpired,
  wasAiCreditOrderExpiryNotified,
  updateAiCreditOrder,
  type AiCreditOrder
} from "@/lib/ai/credit-orders.server";
import { cn } from "@/lib/utils";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { SupervisorCreditsWorkspace } from "../../equipes/creditos/supervisor-credits-workspace";
import { loadSupervisedTeamsWithCredits } from "../../equipes/creditos/supervised-teams.server";
import { CreditPackagesSection } from "./credit-packages-section";

const purchaseFeedbackMessages: Record<string, { tone: "success" | "warning" | "error"; text: string }> = {
  confirmed: {
    tone: "success",
    text: "Pagamento confirmado. Os créditos de IA já foram adicionados ao seu saldo pessoal."
  },
  pending: {
    tone: "warning",
    text: "Pagamento pendente. Assim que a confirmação do pagamento acontecer, os créditos entrarão automaticamente no seu saldo pessoal."
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
    consumption: "50 créditos por geração",
    description: "Gere o par de imagens (Feed 4:5 e Vertical 9:16) pronto para os posicionamentos da Meta.",
    supportText: "Cada geração entrega duas artes em alta qualidade, prontas para Feed, Stories e Reels.",
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

  // Supervisor (admin de equipe) distribui créditos diretamente nesta página.
  const isSupervisor = context.role === "admin" && context.workspaceType === "team";
  const supervisedTeams =
    isSupervisor && context.workspace?.id && context.profile?.id
      ? await loadSupervisedTeamsWithCredits(context.workspace.id, context.profile.id).catch(
          () => []
        )
      : [];

  let packagesError = "";
  const [aiBalance, purchaseAccess, accessibleTotal, usageHistory] = await Promise.all([
    getCurrentAiBalanceDetails(),
    context.workspace?.id
      ? getAiCreditPurchaseEligibilityForOrganization(context.workspace.id)
      : Promise.resolve({
          allowed: false,
          reason: "billing_not_configured" as const,
          message: "Billing ainda nao esta configurado neste ambiente.",
          subscriptionStatus: null
        }),
    getAccessibleAiCreditsForUser(context.workspace?.id ?? "", context.profile?.id ?? null),
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

  // Banner orientado ao estado real do ultimo pedido PIX do proprio usuario.
  // So aparece quando nao ha feedback vindo da URL (retorno imediato da compra).
  const latestCreditOrder =
    !purchaseFeedback && context.workspace?.id && context.profile?.id
      ? await getLatestAiCreditOrderForUser(context.workspace.id, context.profile.id).catch(
          () => null
        )
      : null;
  const pixOrderBanner = await resolvePixOrderBanner(latestCreditOrder);

  const purchaseRequirementMessage = purchaseAccess.allowed
    ? null
    : "Para comprar créditos, a organização precisa ter uma assinatura ativa ou estar em período de teste.";

  // O saldo exibido é o total que o usuário pode efetivamente gastar:
  // carteira pessoal + carteiras das equipes ativas + pool da organização
  // (mesma cascata do consumo). Para o owner, ainda separamos a franquia
  // incluída do plano (incluídos) do restante (avulsos/alocados).
  const displayBalance = accessibleTotal;
  const includedBalance = context.role === "owner" ? aiBalance.includedCredits : 0;
  const purchasedBalance = Math.max(0, accessibleTotal - includedBalance);
  const walletLabel =
    context.role === "owner" ? "Saldo da organização" : "Saldo disponível";

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

      {!purchaseFeedback && pixOrderBanner ? (
        <FeedbackBanner
          message={pixOrderBanner.message}
          tone={pixOrderBanner.tone}
          action={pixOrderBanner.action}
        />
      ) : null}

      {packagesError ? <FeedbackBanner message={packagesError} tone="error" /> : null}

      <AiCreditsPanel
        includedBalance={includedBalance}
        purchaseRequirementMessage={purchaseRequirementMessage}
        purchasedBalance={purchasedBalance}
        totalBalance={displayBalance}
        walletLabel={walletLabel}
      />

      {isSupervisor ? (
        <SupervisorCreditsWorkspace teams={supervisedTeams} embedded />
      ) : null}

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

      <CreditPackagesSection
        canPurchase={purchaseAccess.allowed}
        disabledMessage={purchaseAccess.allowed ? null : purchaseAccess.message}
        packages={packages}
        isOwner={context.isOwner}
      />
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

type PixOrderBanner = {
  tone: "success" | "warning" | "error";
  message: string;
  action?: { href: string; label: string };
};

async function resolvePixOrderBanner(order: AiCreditOrder | null): Promise<PixOrderBanner | null> {
  if (!order) {
    return null;
  }

  if (order.status === "pending") {
    if (isAiCreditOrderPixExpired(order)) {
      if (!wasAiCreditOrderExpiryNotified(order)) {
        await updateAiCreditOrder(order.id, {
          status: "failed",
          metadata: { pix_expiry_notified: true }
        }).catch(() => null);
        return {
          tone: "error",
          message:
            "O PIX da sua última compra de créditos expirou sem pagamento. Gere um novo PIX para concluir."
        };
      }
      return null;
    }

    const pix = getAiCreditOrderPixDetails(order);
    if (!pix) {
      return null;
    }

    return {
      tone: "warning",
      message:
        "Você tem um pagamento PIX aguardando confirmação. Conclua o pagamento para liberar os créditos.",
      action: { href: `/checkout?mode=ai_credits&resume=${order.id}`, label: "Retomar pagamento" }
    };
  }

  if (order.status === "failed" || order.status === "cancelled") {
    if (!wasAiCreditOrderExpiryNotified(order)) {
      await updateAiCreditOrder(order.id, {
        metadata: { pix_expiry_notified: true }
      }).catch(() => null);
      return {
        tone: "error",
        message:
          "Sua última compra de créditos via PIX não foi concluída. Gere um novo PIX para tentar novamente."
      };
    }
    return null;
  }

  return null;
}

function FeedbackBanner({
  tone,
  message,
  action
}: {
  tone: "success" | "warning" | "error";
  message: string;
  action?: { href: string; label: string };
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
        <div className="flex-1">
          <p>{message}</p>
          {action ? (
            <a
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cloud transition-opacity hover:opacity-90"
              href={action.href}
            >
              {action.label}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}


import { AlertTriangle, Banknote, Sparkles } from "lucide-react";

export function AiCreditsPanel({
  includedBalance,
  purchasedBalance,
  totalBalance,
  purchaseRequirementMessage,
  walletLabel = "Saldo"
}: {
  includedBalance: number;
  purchasedBalance: number;
  totalBalance: number;
  purchaseRequirementMessage?: string | null;
  walletLabel?: string;
}) {
  const totalBalanceLabel = totalBalance.toLocaleString("pt-BR");
  const includedLabel = includedBalance.toLocaleString("pt-BR");
  const purchasedLabel = purchasedBalance.toLocaleString("pt-BR");
  const status = getBalanceStatus(totalBalance);
  const showBreakdown = walletLabel === "Saldo" || walletLabel === "Saldo da organização";

  return (
    <article className="glass-strong rounded-[34px] p-6 md:p-8 relative overflow-hidden group">
      {/* Modern premium background glow */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cobalt/8 blur-3xl group-hover:bg-cobalt/12 transition-colors duration-500 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cobalt/10 px-3.5 py-1.5 text-xs font-semibold text-cobalt dark:bg-cobalt/20">
            <Sparkles size={12} className="animate-pulse" aria-hidden="true" />
            Créditos de IA
          </span>
          <h3 className="text-2xl font-bold tracking-tight text-ink dark:text-cloud">{walletLabel}</h3>
          
          <p className="mt-2 text-sm leading-6 text-ink/64 dark:text-cloud/64">
            {showBreakdown
              ? "Os créditos inclusos são usados primeiro em cada geração. Quando a franquia do plano termina, o consumo passa automaticamente para os créditos extras comprados."
              : "Estes são os créditos alocados diretamente para o seu uso nas rotinas de IA."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 shadow-sm border border-white/50 text-cobalt dark:bg-white/10 dark:border-white/10 dark:text-cobalt">
            <Banknote size={22} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3 items-stretch">
        {showBreakdown && (
          <>
            <BalanceBox label="Créditos inclusos disponíveis" value={`${includedLabel} créditos`} />
            <BalanceBox label="Créditos avulsos disponíveis" value={`${purchasedLabel} créditos`} />
          </>
        )}
        
        <div className={`rounded-[24px] border px-5 py-4 flex flex-col justify-center ${status.cardClassName}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
            Total disponível
          </p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <p className="text-xl font-bold leading-tight">{totalBalanceLabel} créditos</p>
            <span className="text-sm font-semibold">{status.label}</span>
          </div>
        </div>
      </div>

      {purchaseRequirementMessage ? (
        <div className="mt-5 rounded-[24px] border border-amber-200/70 bg-amber-500/[0.08] px-5 py-4 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/[0.12] dark:text-amber-300">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
            Compra de créditos
          </p>
          <p className="mt-2 text-sm font-semibold leading-6">{purchaseRequirementMessage}</p>
        </div>
      ) : null}

      {totalBalance <= 0 ? (
        <div className="mt-5 flex items-start gap-3 rounded-[24px] border border-signal/28 bg-signal/12 px-5 py-4 text-sm leading-6 text-ink dark:text-cloud">
          <AlertTriangle className="mt-0.5 shrink-0 text-cobalt" size={18} aria-hidden="true" />
          <p className="font-semibold text-ink/90 dark:text-cloud/90">
            Você não tem créditos suficientes para esta ação. Compre créditos para continuar usando
            as rotinas de IA.
          </p>
        </div>
      ) : null}
    </article>
  );
}

function BalanceBox({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col justify-center rounded-[24px] border border-white/50 bg-white/58 px-5 py-4 dark:border-white/10 dark:bg-white/6">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/48 dark:text-cloud/48">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold leading-tight text-ink dark:text-cloud">{value}</p>
    </div>
  );
}

export function OpenAIComingSoonCard({
  highlight = false
}: {
  highlight?: boolean;
}) {
  return (
    <article
      className={`glass-strong rounded-[34px] p-6 md:p-8 relative overflow-hidden group transition-all duration-300 ${
        highlight ? "ring-2 ring-lagoon/24 shadow-lg" : ""
      }`}
    >
      {/* Subtle background glow */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lagoon/8 blur-3xl group-hover:bg-lagoon/12 transition-colors duration-500 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-lagoon/12 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-lagoon dark:bg-lagoon/20">
            Em breve
          </span>
          <h3 className="text-2xl font-bold tracking-tight text-ink dark:text-cloud">Conta OpenAI própria</h3>
          <p className="text-sm leading-6 text-ink/62 dark:text-cloud/62 max-w-2xl">
            Em breve você poderá conectar sua própria conta OpenAI para usar sua estrutura de IA
            diretamente no Leadi. Por enquanto, as gerações usam os Créditos de IA do
            plataforma.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 shadow-sm border border-white/50 text-lagoon dark:bg-white/10 dark:border-white/10 shrink-0">
          <Sparkles size={22} aria-hidden="true" />
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-white/50 bg-white/58 px-5 py-4 text-sm leading-6 text-ink/64 dark:border-white/10 dark:bg-white/5 dark:text-cloud/64">
        Recurso reservado para uma próxima etapa da plataforma. Hoje, o fluxo principal usa a
        chave global do Leadi e o saldo interno de créditos.
      </div>

      <button
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/62 px-5 py-3 text-sm font-semibold text-ink/62 cursor-not-allowed dark:bg-white/10 dark:text-cloud/62"
        disabled
        type="button"
      >
        Disponível em breve
      </button>
    </article>
  );
}

function getBalanceStatus(balance: number) {
  if (balance >= 31) {
    return {
      label: "Saudável",
      cardClassName:
        "border-emerald-200/60 bg-emerald-500/[0.08] text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/[0.12] dark:text-emerald-300"
    };
  }

  if (balance >= 15) {
    return {
      label: "Atenção",
      cardClassName:
        "border-amber-200/70 bg-amber-500/[0.08] text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/[0.12] dark:text-amber-300"
    };
  }

  return {
    label: balance === 0 ? "Sem saldo" : "Crítico",
    cardClassName:
      "border-red-200/70 bg-red-500/[0.08] text-red-700 dark:border-red-500/25 dark:bg-red-500/[0.12] dark:text-red-300"
  };
}

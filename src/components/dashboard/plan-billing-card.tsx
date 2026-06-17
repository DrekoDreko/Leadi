import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet
} from "lucide-react";
import type { BillingPlanOverview } from "@/lib/billing/subscription-limits.server";
import type { BillingSnapshot } from "@/lib/billing/admin";
import { BILLING_PRODUCTS, type BillingProductKey } from "@/lib/billing/catalog";

type PlanBillingCardProps = {
  overview: BillingPlanOverview | null;
  snapshot: BillingSnapshot | null;
  manageHref: string;
};

const INTERVAL_LABELS: Record<string, string> = {
  day: "dia",
  week: "semana",
  month: "mês",
  year: "ano"
};

const STATUS_TONES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200",
  trialing: "bg-cobalt/10 text-cobalt",
  pending: "bg-signal/14 text-ink dark:text-cloud",
  past_due: "bg-amber-50 text-amber-700 dark:bg-amber-500/12 dark:text-amber-200",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-500/12 dark:text-amber-200",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-500/12 dark:text-red-200",
  expired: "bg-red-50 text-red-700 dark:bg-red-500/12 dark:text-red-200"
};

const PURCHASE_STATUS: Record<
  BillingSnapshot["recentPurchases"][number]["status"],
  { label: string; tone: string }
> = {
  created: { label: "Iniciado", tone: "bg-ink/8 text-ink/60 dark:text-cloud/60" },
  pending: { label: "Pendente", tone: "bg-signal/14 text-ink dark:text-cloud" },
  approved: { label: "Aprovado", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200" },
  credited: { label: "Creditado", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200" },
  rejected: { label: "Recusado", tone: "bg-red-50 text-red-700 dark:bg-red-500/12 dark:text-red-200" },
  cancelled: { label: "Cancelado", tone: "bg-red-50 text-red-700 dark:bg-red-500/12 dark:text-red-200" },
  expired: { label: "Expirado", tone: "bg-red-50 text-red-700 dark:bg-red-500/12 dark:text-red-200" }
};

function formatCurrency(amountCents: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(amountCents / 100);
}

function formatDate(iso: string | null) {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function productLabel(productKey: string) {
  const known = BILLING_PRODUCTS[productKey as BillingProductKey];
  if (known) {
    return known.label;
  }
  return productKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function PlanBillingCard({ overview, snapshot, manageHref }: PlanBillingCardProps) {
  const plan = overview?.plan ?? null;
  const subscription = overview?.subscription ?? null;
  const wallet = snapshot?.wallet ?? null;
  const purchases = snapshot?.recentPurchases ?? [];
  const billingConfigured = overview?.billingConfigured ?? false;

  const statusTone = subscription
    ? STATUS_TONES[subscription.status] ?? "bg-ink/8 text-ink/60 dark:text-cloud/60"
    : "bg-ink/8 text-ink/60 dark:text-cloud/60";
  const intervalLabel = plan
    ? plan.intervalCount > 1
      ? `a cada ${plan.intervalCount} ${INTERVAL_LABELS[plan.intervalUnit] ?? plan.intervalUnit}`
      : `/${INTERVAL_LABELS[plan.intervalUnit] ?? plan.intervalUnit}`
    : "";

  const usageRows: Array<{ label: string; used: number; limit: number | null }> = overview
    ? [
        { label: "Leads", used: overview.usage.leads, limit: overview.limits.leads },
        { label: "Campanhas", used: overview.usage.campaigns, limit: overview.limits.campaigns },
        { label: "Usuários", used: overview.usage.users, limit: overview.limits.users }
      ]
    : [];

  return (
    <section className="glass-strong rounded-[34px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
            <CreditCard size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-cobalt">Plano &amp; Faturamento</p>
            <h2 className="mt-1 text-2xl font-semibold">
              {plan?.name ?? (billingConfigured ? "Sem assinatura ativa" : "Billing em modo local")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/62">
              {plan?.description ??
                (billingConfigured
                  ? "Nenhum plano ativo encontrado nesta organização. Escolha um plano para liberar leads, campanhas, convites e IA."
                  : "Billing não está configurado neste ambiente. Os recursos seguem liberados para desenvolvimento local.")}
            </p>
          </div>
        </div>

        {subscription ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusTone}`}
          >
            <ShieldCheck size={14} aria-hidden="true" />
            {subscription.statusLabel}
          </span>
        ) : null}
      </div>

      {/* Resumo: preço, período, próxima cobrança */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoTile
          icon={<Sparkles size={16} aria-hidden="true" />}
          label="Valor do plano"
          value={plan ? formatCurrency(plan.amountCents, plan.currency) : "—"}
          hint={plan ? intervalLabel : "Nenhum plano ativo"}
        />
        <InfoTile
          icon={<CalendarClock size={16} aria-hidden="true" />}
          label="Período atual"
          value={subscription ? formatDate(subscription.currentPeriodStart) : "—"}
          hint={subscription ? `até ${formatDate(subscription.currentPeriodEnd)}` : "Sem período vigente"}
        />
        <InfoTile
          icon={<ReceiptText size={16} aria-hidden="true" />}
          label={subscription?.cancelAtPeriodEnd ? "Encerra em" : "Próxima cobrança"}
          value={subscription ? formatDate(subscription.currentPeriodEnd) : "—"}
          hint={
            subscription?.cancelAtPeriodEnd
              ? "Assinatura será cancelada"
              : subscription
                ? "Renovação automática"
                : "—"
          }
        />
      </div>

      {/* Carteira de créditos */}
      {wallet ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <InfoTile
            icon={<Wallet size={16} aria-hidden="true" />}
            label="Saldo de créditos"
            value={wallet.balance.toLocaleString("pt-BR")}
            hint="Disponível na organização"
            accent
          />
          <InfoTile
            label="Total concedido"
            value={wallet.totalGranted.toLocaleString("pt-BR")}
            hint="Plano + compras + ajustes"
          />
          <InfoTile
            label="Total consumido"
            value={wallet.totalSpent.toLocaleString("pt-BR")}
            hint="Gasto em rotinas de IA"
          />
        </div>
      ) : null}

      {/* Uso x limites */}
      {usageRows.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-ink/70">Uso no plano</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {usageRows.map((row) => {
              const pct =
                row.limit && row.limit > 0
                  ? Math.min(100, Math.round((row.used / row.limit) * 100))
                  : null;
              return (
                <div
                  key={row.label}
                  className="rounded-[20px] border border-white/44 bg-white/36 p-4 dark:bg-white/[0.04]"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-ink/70">{row.label}</span>
                    <span className="text-sm font-semibold text-ink">
                      {row.used.toLocaleString("pt-BR")}
                      <span className="text-ink/45">
                        {" "}/ {row.limit === null ? "∞" : row.limit.toLocaleString("pt-BR")}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
                    <div
                      className="h-full rounded-full bg-cobalt transition-all"
                      style={{ width: `${pct ?? (row.used > 0 ? 100 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Histórico de compras e pagamentos */}
      <div className="mt-6">
        <p className="text-sm font-medium text-ink/70">Compras e pagamentos recentes</p>
        {purchases.length > 0 ? (
          <ul className="mt-3 divide-y divide-white/40 overflow-hidden rounded-[20px] border border-white/44 bg-white/36 dark:bg-white/[0.04]">
            {purchases.map((purchase) => {
              const status = PURCHASE_STATUS[purchase.status];
              return (
                <li
                  key={purchase.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {productLabel(purchase.productKey)}
                    </p>
                    <p className="mt-0.5 text-xs text-ink/55">
                      {purchase.productKind === "plan" ? "Assinatura" : "Pacote de créditos"} ·{" "}
                      {formatDate(purchase.createdAt)}
                      {purchase.credits > 0 ? ` · ${purchase.credits.toLocaleString("pt-BR")} créditos` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-ink">
                      {formatCurrency(purchase.amountCents)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.tone}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 rounded-[20px] border border-white/44 bg-white/36 px-4 py-3 text-sm leading-6 text-ink/60 dark:bg-white/[0.04]">
            Nenhuma compra registrada ainda. Compras de planos e pacotes de créditos aparecerão aqui.
          </p>
        )}
      </div>

      <Link
        href={manageHref}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/90"
      >
        Gerenciar assinatura e créditos
        <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}

function InfoTile({
  icon,
  label,
  value,
  hint,
  accent
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] border p-4 ${
        accent
          ? "border-cobalt/25 bg-cobalt/[0.06]"
          : "border-white/44 bg-white/36 dark:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-1.5 text-ink/55">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}

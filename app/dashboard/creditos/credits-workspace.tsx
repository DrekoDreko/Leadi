"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Coins, Loader2, Package, RefreshCcw, ShoppingCart } from "lucide-react";
import {
  BILLING_PRODUCTS,
  billingPacks,
  billingPlans,
  FEATURE_LABELS,
  getBillingProduct,
  getProductPriceDisplay
} from "@/lib/billing/catalog";

type BillingSnapshot = {
  wallet: {
    balance: number;
    totalGranted: number;
    totalSpent: number;
  };
  recentTransactions: Array<{
    id: string;
    kind: string;
    source: string;
    featureKey: string | null;
    amount: number;
    balanceAfter: number;
    referenceType: string | null;
    referenceId: string | null;
    status: string;
    createdAt: string;
  }>;
  recentPurchases: Array<{
    id: string;
    productKey: string;
    productKind: "plan" | "pack";
    credits: number;
    amountCents: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export function CreditsWorkspace({
  snapshot,
  liveCheckoutEnabled,
  modeLabel
}: {
  snapshot: BillingSnapshot;
  liveCheckoutEnabled: boolean;
  modeLabel: string;
}) {
  const [loadingKey, setLoadingKey] = useState<string>("");
  const [error, setError] = useState("");

  const planProducts = useMemo(() => billingPlans.map((key) => getBillingProduct(key)), []);
  const packProducts = useMemo(() => billingPacks.map((key) => getBillingProduct(key)), []);

  async function startCheckout(productKey: string) {
    setError("");
    setLoadingKey(productKey);

    try {
      const response = await fetch("/api/billing/mercadopago/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({ productKey })
      });

      const payload = (await response.json().catch(() => null)) as {
        checkout?: { checkoutUrl?: string };
        error?: string;
      } | null;

      if (!response.ok || !payload?.checkout?.checkoutUrl) {
        throw new Error(payload?.error ?? "Nao foi possivel iniciar o checkout.");
      }

      window.location.assign(payload.checkout.checkoutUrl);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Nao foi possivel iniciar o checkout."
      );
    } finally {
      setLoadingKey("");
    }
  }

  return (
    <div className="space-y-4">
      <section className="glass-strong rounded-[34px] p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-cobalt">Créditos</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Saldo da conta</h1>
            <p className="mt-3 leading-7 text-ink/64">
              {modeLabel} do saldo de uso para campanhas, mensagens e perguntas geradas por IA.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/54 px-4 py-2 text-sm font-semibold">
              <Coins size={16} aria-hidden="true" />
              {snapshot.wallet.balance} créditos
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/54 px-4 py-2 text-sm font-semibold">
              <ShoppingCart size={16} aria-hidden="true" />
              {snapshot.recentPurchases.length} compras
            </span>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
              onClick={() => window.location.reload()}
              type="button"
            >
              <RefreshCcw size={16} aria-hidden="true" />
              Atualizar
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="glass rounded-[30px] p-5">
          <p className="text-sm text-ink/54">Saldo atual</p>
          <strong className="mt-3 block text-4xl font-semibold">{snapshot.wallet.balance}</strong>
          <span className="mt-3 inline-flex rounded-full bg-cobalt px-3 py-1.5 text-xs font-semibold text-white">
            créditos disponíveis
          </span>
        </article>
        <article className="glass rounded-[30px] p-5">
          <p className="text-sm text-ink/54">Créditos recebidos</p>
          <strong className="mt-3 block text-4xl font-semibold">{snapshot.wallet.totalGranted}</strong>
          <span className="mt-3 inline-flex rounded-full bg-lagoon px-3 py-1.5 text-xs font-semibold text-white">
            total acumulado
          </span>
        </article>
        <article className="glass rounded-[30px] p-5">
          <p className="text-sm text-ink/54">Créditos usados</p>
          <strong className="mt-3 block text-4xl font-semibold">{snapshot.wallet.totalSpent}</strong>
          <span className="mt-3 inline-flex rounded-full bg-signal px-3 py-1.5 text-xs font-semibold text-ink">
            consumo total
          </span>
        </article>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-red-200/70 bg-red-50/80 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="glass-strong rounded-[34px] p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink/54">Planos</p>
              <h2 className="text-2xl font-semibold">Pacotes com créditos inclusos</h2>
            </div>
            <Package size={20} aria-hidden="true" />
          </div>
          <div className="grid gap-3">
            {planProducts.map((product) => (
              <article
                className={`rounded-[26px] border p-4 ${
                  product.featured ? "border-cobalt/30 bg-cobalt/8" : "border-white/40 bg-white/34"
                }`}
                key={product.key}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{product.label}</h3>
                      {product.badge ? (
                        <span className="rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-normal text-ink/54">
                          {product.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink/64">{product.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-semibold">{getProductPriceDisplay(product)}</p>
                    <p className="mt-1 text-sm text-ink/56">{product.credits} créditos</p>
                  </div>
                </div>
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={loadingKey === product.key || !liveCheckoutEnabled}
                  onClick={() => startCheckout(product.key)}
                  type="button"
                >
                  {loadingKey === product.key ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <ArrowRight size={16} aria-hidden="true" />
                  )}
                  {liveCheckoutEnabled ? "Comprar agora" : "Checkout indisponível"}
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-[34px] p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink/54">Recargas</p>
              <h2 className="text-2xl font-semibold">Comprar mais créditos</h2>
            </div>
            <ShoppingCart size={20} aria-hidden="true" />
          </div>
          <div className="grid gap-3">
            {packProducts.map((product) => (
              <article
                className={`rounded-[26px] border p-4 ${
                  product.featured ? "border-lagoon/30 bg-lagoon/8" : "border-white/40 bg-white/34"
                }`}
                key={product.key}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{product.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/64">{product.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-semibold">{getProductPriceDisplay(product)}</p>
                    <p className="mt-1 text-sm text-ink/56">{product.credits} créditos</p>
                  </div>
                </div>
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={loadingKey === product.key || !liveCheckoutEnabled}
                  onClick={() => startCheckout(product.key)}
                  type="button"
                >
                  {loadingKey === product.key ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <ArrowRight size={16} aria-hidden="true" />
                  )}
                  {liveCheckoutEnabled ? "Comprar pacote" : "Checkout indisponível"}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="glass rounded-[34px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Últimos movimentos</h2>
            <Coins size={18} aria-hidden="true" />
          </div>
          {snapshot.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {snapshot.recentTransactions.map((transaction) => (
                <div className="rounded-[22px] bg-white/46 p-4" key={transaction.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold capitalize">
                        {FEATURE_LABELS[transaction.featureKey as keyof typeof FEATURE_LABELS] ??
                          transaction.kind}
                      </p>
                      <p className="mt-1 text-xs text-ink/54">
                        {transaction.source} · {new Date(transaction.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                      -{transaction.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-ink/58">Nenhum movimento ainda.</p>
          )}
        </div>

        <div className="glass rounded-[34px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Compras recentes</h2>
            <ShoppingCart size={18} aria-hidden="true" />
          </div>
          {snapshot.recentPurchases.length > 0 ? (
            <div className="space-y-3">
              {snapshot.recentPurchases.map((purchase) => {
                const product = BILLING_PRODUCTS[purchase.productKey as keyof typeof BILLING_PRODUCTS];

                return (
                  <div className="rounded-[22px] bg-white/46 p-4" key={purchase.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{product?.label ?? purchase.productKey}</p>
                        <p className="mt-1 text-xs text-ink/54">
                          {purchase.credits} créditos · {purchase.status}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink">
                        {formatMoney(purchase.amountCents)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm leading-6 text-ink/58">Nenhuma compra registrada ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function formatMoney(amountCents: number) {
  return `R$ ${(amountCents / 100).toFixed(2).replace(".", ",")}`;
}

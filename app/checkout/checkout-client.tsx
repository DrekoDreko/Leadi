"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
  Timer
} from "lucide-react";

type CheckoutClientProps =
  | {
      checkoutMode: "plan";
      planSlug: string;
      billingCycle: "monthly" | "annual";
      amount: number;
      nextPath?: string;
      creditPackageSlug?: never;
      initialPix?: never;
    }
  | {
      checkoutMode: "ai_credits";
      creditPackageSlug: string;
      amount: number;
      nextPath?: never;
      billingCycle?: never;
      planSlug?: never;
      initialPix?: PixData | null;
    };

export type PixData = {
  orderId: string;
  transparentId: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
  expiresAt: string;
};

type SubscriptionPending = {
  subscriptionId: string;
  checkoutUrl: string;
  simulated?: boolean;
};

export function CheckoutClient(props: CheckoutClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(
    props.checkoutMode === "ai_credits" ? props.initialPix ?? null : null
  );
  const [subscriptionPending, setSubscriptionPending] =
    useState<SubscriptionPending | null>(null);

  const newPixHref =
    props.checkoutMode === "ai_credits"
      ? `/checkout?mode=ai_credits&package=${encodeURIComponent(props.creditPackageSlug)}`
      : "/dashboard/perfil/creditos";

  async function handleCheckout() {
    setError(null);
    setIsLoading(true);

    try {
      if (props.checkoutMode === "plan") {
        const response = await fetch("/api/billing/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planSlug: props.planSlug,
            cycle: props.billingCycle
          })
        });

        const data = await response.json().catch(() => null);

        // Modo de testes (BILLING_DISABLED): a API ja aprovou o pagamento,
        // entao nao ha aba externa para abrir — apenas mostramos a tela de
        // confirmacao, que vai detectar a assinatura ativa na hora.
        if (!data?.simulated) {
          if (!response.ok || !data?.checkoutUrl) {
            throw new Error(data?.error || "Erro ao processar assinatura.");
          }

          window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
        }

        setSubscriptionPending({
          subscriptionId: data.subscriptionId,
          checkoutUrl: data.checkoutUrl,
          simulated: Boolean(data.simulated)
        });

        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/billing/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageSlug: props.creditPackageSlug
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.brCode) {
        throw new Error(data?.error || "Erro ao gerar o PIX.");
      }

      setPixData({
        orderId: data.orderId,
        transparentId: data.transparentId,
        brCode: data.brCode,
        brCodeBase64: data.brCodeBase64,
        amount: data.amount,
        expiresAt: data.expiresAt
      });
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao processar pagamento.");
    } finally {
      setIsLoading(false);
    }
  }

  if (subscriptionPending) {
    return (
      <SubscriptionWaiting
        pending={subscriptionPending}
        nextPath={props.checkoutMode === "plan" ? props.nextPath : undefined}
      />
    );
  }

  if (pixData) {
    return <PixInlineCheckout pixData={pixData} newPixHref={newPixHref} />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
        <button
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cloud"
          onClick={handleCheckout}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const isPlan = props.checkoutMode === "plan";

  return (
    <div className="w-full">
      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-base font-semibold text-cloud disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading}
        onClick={handleCheckout}
        type="button"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            {isPlan ? "Abrindo pagamento..." : "Gerando PIX..."}
          </>
        ) : isPlan ? (
          <>
            <CreditCard size={18} aria-hidden="true" />
            Pagar com cartão
          </>
        ) : (
          <>
            <QrCode size={18} aria-hidden="true" />
            Pagar com PIX
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-ink/50">
        {isPlan
          ? "O pagamento será aberto em uma nova aba no ambiente seguro do AbacatePay."
          : "O QR code PIX será gerado aqui mesmo, sem sair do site."}
      </p>
    </div>
  );
}

function SubscriptionWaiting({
  pending,
  nextPath
}: {
  pending: SubscriptionPending;
  nextPath?: string;
}) {
  const [status, setStatus] = useState<string>("pending");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successHref = nextPath ?? "/dashboard?checkout=success";

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch(
          `/api/billing/subscription-status?id=${encodeURIComponent(pending.subscriptionId)}`
        );
        const data = await response.json().catch(() => null);

        if (data?.status) {
          setStatus(data.status);

          if (data.status === "active" || data.status === "trialing") {
            stopPolling();
          }
        }
      } catch {}
    }

    pollRef.current = setInterval(checkStatus, 4000);
    checkStatus();

    return stopPolling;
  }, [pending.subscriptionId, stopPolling]);

  const isActive = status === "active" || status === "trialing";

  if (isActive) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="text-emerald-600" size={32} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink">Assinatura ativada!</h3>
          <p className="mt-1 text-sm text-ink/60">
            Seu plano já está ativo. Aproveite todos os recursos.
          </p>
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cloud"
          href={successHref}
        >
          Continuar
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cobalt/10">
        <CreditCard className="text-cobalt" size={28} />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-ink">Aguardando pagamento</h3>
        <p className="mt-1 text-sm text-ink/60">
          {pending.simulated
            ? "Período de testes: confirmando o pagamento automaticamente."
            : "Complete o pagamento na aba que foi aberta. Esta página será atualizada automaticamente."}
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-cobalt">
        <Loader2 className="animate-spin" size={14} aria-hidden="true" />
        Verificando status...
      </div>

      {pending.simulated ? null : (
        <>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/10"
            href={pending.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} aria-hidden="true" />
            Reabrir página de pagamento
          </a>

          <p className="text-center text-xs leading-5 text-ink/40">
            Se o popup foi bloqueado, clique no botão acima para abrir o pagamento.
          </p>
        </>
      )}
    </div>
  );
}

function PixInlineCheckout({ pixData, newPixHref }: { pixData: PixData; newPixHref: string }) {
  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch(
          `/api/billing/pix/status?id=${encodeURIComponent(pixData.transparentId)}`
        );
        const data = await response.json().catch(() => null);

        if (data?.status) {
          setPaymentStatus(data.status);

          if (data.status === "PAID" || data.status === "APPROVED" || data.status === "REDEEMED") {
            stopPolling();
          }

          if (data.status === "EXPIRED" || data.status === "CANCELLED" || data.status === "FAILED") {
            stopPolling();
          }
        }
      } catch {}
    }

    pollRef.current = setInterval(checkStatus, 4000);
    checkStatus();

    return stopPolling;
  }, [pixData.transparentId, stopPolling]);

  useEffect(() => {
    function updateTimer() {
      const expires = new Date(pixData.expiresAt).getTime();
      const now = Date.now();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expirado");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pixData.expiresAt]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixData.brCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  }

  const isPaid =
    paymentStatus === "PAID" || paymentStatus === "APPROVED" || paymentStatus === "REDEEMED";
  const isExpired = paymentStatus === "EXPIRED" || timeLeft === "Expirado";
  const isFailed = paymentStatus === "CANCELLED" || paymentStatus === "FAILED";

  if (isPaid) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="text-emerald-600" size={32} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink">Pagamento confirmado!</h3>
          <p className="mt-1 text-sm text-ink/60">
            Os créditos já foram adicionados ao seu saldo pessoal.
          </p>
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cloud"
          href="/dashboard/perfil/creditos?purchase=confirmed"
        >
          Ver meus créditos
        </a>
      </div>
    );
  }

  if (isExpired || isFailed) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {isExpired
            ? "O QR code PIX expirou. Gere um novo para continuar."
            : "O pagamento foi cancelado ou falhou."}
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cloud"
          href={newPixHref}
        >
          Gerar novo PIX
        </a>
      </div>
    );
  }

  const formattedAmount = (pixData.amount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-2 rounded-full bg-cobalt/10 px-4 py-2 text-sm font-semibold text-cobalt">
        <Timer size={16} aria-hidden="true" />
        Expira em {timeLeft}
      </div>

      <div className="rounded-2xl border border-ink/10 bg-surface-elevated p-4">
        {pixData.brCodeBase64 ? (
          <img
            src={pixData.brCodeBase64.startsWith("data:") ? pixData.brCodeBase64 : `data:image/png;base64,${pixData.brCodeBase64}`}
            alt="QR Code PIX"
            width={220}
            height={220}
            className="mx-auto"
          />
        ) : (
          <div className="flex h-[220px] w-[220px] items-center justify-center">
            <QrCode size={80} className="text-ink/20" />
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-ink">{formattedAmount}</p>

      <button
        className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/10"
        onClick={handleCopy}
        type="button"
      >
        {copied ? (
          <>
            <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
            Código copiado!
          </>
        ) : (
          <>
            <Copy size={16} aria-hidden="true" />
            Copiar código PIX
          </>
        )}
      </button>

      <div className="flex items-center gap-2 text-sm text-ink/50">
        <Loader2 className="animate-spin" size={14} aria-hidden="true" />
        Aguardando pagamento...
      </div>

      <p className="text-center text-xs leading-5 text-ink/40">
        Abra o app do seu banco, escaneie o QR code ou cole o código PIX.
        A confirmação é automática.
      </p>
    </div>
  );
}

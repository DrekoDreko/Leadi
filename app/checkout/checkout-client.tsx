"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useRouter } from "next/navigation";

type CheckoutClientProps =
  | {
      checkoutMode: "plan";
      planSlug: string;
      billingCycle: "monthly" | "annual";
      amount: number;
      publicKey: string;
      creditPackageSlug?: never;
    }
  | {
      checkoutMode: "ai_credits";
      creditPackageSlug: string;
      amount: number;
      publicKey: string;
      billingCycle?: never;
      planSlug?: never;
    };

export function CheckoutClient(props: CheckoutClientProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aiCreditsReturnPath = "/dashboard/perfil/creditos";

  useEffect(() => {
    if (props.publicKey) {
      initMercadoPago(props.publicKey, { locale: "pt-BR" });
      setIsReady(true);
    } else {
      setError("Chave pública do Mercado Pago não configurada no cliente.");
    }
  }, [props.publicKey]);

  if (error) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!isReady) {
    return <div className="animate-pulse p-4 text-ink/60">Carregando formulário seguro...</div>;
  }

  return (
    <div className="w-full">
      <Payment
        initialization={{ amount: props.amount }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            ticket: [],
            bankTransfer: []
          }
        }}
        onSubmit={async (formData) => {
          try {
            if (props.checkoutMode === "plan") {
              const response = await fetch("/api/billing/create-subscription", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  planSlug: props.planSlug,
                  cycle: props.billingCycle,
                  ...formData
                })
              });

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erro ao processar assinatura");
              }

              router.push("/dashboard?checkout=success");
              return;
            }

            const response = await fetch("/api/billing/ai-credits/checkout", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                packageSlug: props.creditPackageSlug,
                ...formData
              })
            });

            const data = (await response.json().catch(() => null)) as
              | {
                  success?: boolean;
                  status?: string;
                  error?: string;
                }
              | null;

            if (!response.ok || !data?.success) {
              throw new Error(data?.error || "Erro ao processar compra de créditos");
            }

            if (data.status === "paid") {
              router.push(`${aiCreditsReturnPath}?purchase=confirmed`);
              return;
            }

            if (data.status === "pending") {
              router.push(`${aiCreditsReturnPath}?purchase=pending`);
              return;
            }

            if (data.status === "cancelled") {
              router.push(`${aiCreditsReturnPath}?purchase=cancelled`);
              return;
            }

            router.push(`${aiCreditsReturnPath}?purchase=failed`);
          } catch (err: unknown) {
            console.error(err);
            return Promise.reject(err);
          }
        }}
        onError={(paymentError) => {
          console.error("Payment Brick Error:", paymentError);
        }}
      />
    </div>
  );
}

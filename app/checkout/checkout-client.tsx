"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useRouter } from "next/navigation";

export function CheckoutClient({
  planSlug,
  amount,
}: {
  planSlug: string;
  amount: number;
}) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (publicKey) {
      initMercadoPago(publicKey, { locale: "pt-BR" });
      setIsReady(true);
    } else {
      setError("Chave pública do Mercado Pago não configurada no cliente.");
    }
  }, []);

  if (error) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!isReady) {
    return <div className="animate-pulse p-4 text-ink/60">Carregando formulário seguro...</div>;
  }

  return (
    <div className="w-full">
      <Payment
        initialization={{ amount }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            ticket: "all",
            bankTransfer: "all",
          },
        }}
        onSubmit={async (formData) => {
          try {
            const response = await fetch("/api/billing/create-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                planSlug,
                ...formData,
              }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || "Erro ao processar assinatura");
            }

            // Sucesso
            router.push("/dashboard?checkout=success");
          } catch (err: unknown) {
            console.error(err);
            // Em vez de throw, idealmente mostrar um toast ou alert, 
            // mas o SDK pode capturar exceptions retornadas nesta promise
            return Promise.reject(err);
          }
        }}
        onError={(error) => {
          console.error("Payment Brick Error:", error);
        }}
      />
    </div>
  );
}

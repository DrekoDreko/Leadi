import "server-only";

import crypto from "node:crypto";
import { requireIntegrationEnv } from "@/lib/env/server";
import {
  getMercadoPagoAccessToken,
  getMercadoPagoBackUrl,
  getMercadoPagoNotificationUrl,
  getMercadoPagoWebhookSecret
} from "./config";

export type MercadoPagoCheckoutInput = {
  title: string;
  unitPrice: number;
  quantity: number;
  externalReference: string;
  purchaseId: string;
  description: string;
  payerEmail?: string;
};

type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  external_reference?: string;
};

type MercadoPagoPaymentResponse = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  currency_id?: string;
  date_approved?: string | null;
  date_created?: string | null;
  date_last_updated?: string | null;
  payer?: {
    email?: string | null;
  };
  additional_info?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  raw?: Record<string, unknown>;
};

export async function createMercadoPagoCheckout(input: MercadoPagoCheckoutInput) {
  requireIntegrationEnv("billing");

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.purchaseId
    },
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          description: input.description,
          quantity: input.quantity,
          unit_price: input.unitPrice,
          currency_id: "BRL"
        }
      ],
      external_reference: input.externalReference,
      notification_url: getMercadoPagoNotificationUrl(),
      back_urls: {
        success: getMercadoPagoBackUrl("/dashboard/perfil/creditos?status=success"),
        pending: getMercadoPagoBackUrl("/dashboard/perfil/creditos?status=pending"),
        failure: getMercadoPagoBackUrl("/dashboard/perfil/creditos?status=failure")
      },
      auto_return: "approved",
      binary_mode: false,
      payer: input.payerEmail ? { email: input.payerEmail } : undefined
    })
  });

  const payload = (await response.json().catch(() => null)) as MercadoPagoPreferenceResponse | null;

  if (!response.ok || !payload?.id) {
    throw new Error(
      (payload as { message?: string } | null)?.message ??
        "Nao foi possivel criar o checkout no Mercado Pago."
    );
  }

  const checkoutUrl = payload.init_point ?? payload.sandbox_init_point ?? "";

  if (!checkoutUrl) {
    throw new Error("Mercado Pago nao retornou a URL de checkout.");
  }

  return {
    preferenceId: payload.id,
    checkoutUrl
  };
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  requireIntegrationEnv("billing");

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`
    }
  });

  const payload = (await response.json().catch(() => null)) as MercadoPagoPaymentResponse | null;

  if (!response.ok || !payload?.id) {
    throw new Error("Nao foi possivel consultar o pagamento no Mercado Pago.");
  }

  return payload;
}

export function validateMercadoPagoWebhookSignature(input: {
  signatureHeader: string | null;
  requestIdHeader: string | null;
  dataId: string;
}) {
  requireIntegrationEnv("mercadopago_webhook");

  const secret = getMercadoPagoWebhookSecret();

  if (!secret) {
    return false;
  }

  if (!input.signatureHeader || !input.requestIdHeader || !input.dataId) {
    return false;
  }

  const parts = Object.fromEntries(
    input.signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key.trim(), value?.trim() ?? ""];
    })
  );
  const ts = parts.ts;
  const hash = parts.v1;

  if (!ts || !hash) {
    return false;
  }

  const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.requestIdHeader};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  return expected === hash;
}

export function getMercadoPagoPaymentIdFromWebhook(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("data_id") ?? "";

  return dataId.toLowerCase().trim();
}

export async function getMercadoPagoPaymentPayload(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { data?: { id?: string }; id?: string }
    | null;

  return {
    dataId:
      body?.data?.id?.toLowerCase().trim() ||
      body?.id?.toString().toLowerCase().trim() ||
      ""
  };
}

export function getMercadoPagoWebhookRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? request.headers.get("x-requestid") ?? "";
}

export function getMercadoPagoWebhookSignature(request: Request) {
  return request.headers.get("x-signature");
}

export function getMercadoPagoReturnUrlStatus(status: "success" | "pending" | "failure") {
  return getMercadoPagoBackUrl(`/dashboard/perfil/creditos?status=${status}`);
}

export async function createMercadoPagoPreapproval(input: {
  reason: string;
  externalReference: string;
  payerEmail: string;
  cardTokenId: string;
  amount: number;
}) {
  requireIntegrationEnv("billing");

  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      card_token_id: input.cardTokenId,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: input.amount,
        currency_id: "BRL",
      },
      back_url: getMercadoPagoBackUrl("/dashboard"),
      status: "authorized",
    }),
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; status?: string; message?: string } | null;

  if (!response.ok || !payload?.id) {
    throw new Error(payload?.message ?? "Não foi possível criar a assinatura no Mercado Pago.");
  }

  return payload;
}

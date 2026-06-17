import "server-only";

import crypto from "node:crypto";

import { requireIntegrationEnv } from "@/lib/env/server";
import {
  getAbacatePayApiKey,
  getAbacatePayReturnUrl,
  getAbacatePayWebhookSecret,
} from "./config";

const ABACATEPAY_API_BASE = "https://api.abacatepay.com/v2";

export type AbacatePayCheckoutInput = {
  title: string;
  amount: number;
  externalReference: string;
  description: string;
  customerEmail?: string;
};

export type AbacatePaySubscriptionInput = {
  reason: string;
  externalReference: string;
  customerEmail: string;
  amount: number;
  billingCycle: "monthly" | "annual";
};

type AbacatePayApiResponse<T> = {
  data: T;
  error: string | null;
  success?: { message?: string };
};

type AbacatePayProduct = {
  id: string;
  externalId: string;
  name: string;
  price: number;
  [key: string]: unknown;
};

type AbacatePayBilling = {
  id: string;
  url: string;
  status: string;
  amount?: number;
  externalId?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

type AbacatePayCustomer = {
  id: string;
  email: string;
  [key: string]: unknown;
};

async function abacatePayRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<AbacatePayApiResponse<T>> {
  requireIntegrationEnv("billing");

  const response = await fetch(`${ABACATEPAY_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAbacatePayApiKey()}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const payload = (await response.json().catch(() => null)) as AbacatePayApiResponse<T> | null;

  if (!response.ok || !payload) {
    const errorMessage =
      payload?.error ?? `AbacatePay request failed: ${response.status}`;
    throw new Error(errorMessage);
  }

  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload;
}

async function createProduct(input: {
  externalId: string;
  name: string;
  description: string;
  price: number;
  cycle?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "ANNUALLY";
}): Promise<AbacatePayProduct> {
  const result = await abacatePayRequest<AbacatePayProduct>(
    "/products/create",
    {
      method: "POST",
      body: JSON.stringify({
        externalId: input.externalId,
        name: input.name,
        description: input.description,
        price: input.price,
        currency: "BRL",
        ...(input.cycle ? { cycle: input.cycle } : {})
      })
    }
  );

  return result.data;
}

async function createOrGetCustomer(email: string): Promise<AbacatePayCustomer> {
  const result = await abacatePayRequest<AbacatePayCustomer>(
    "/customers/create",
    {
      method: "POST",
      body: JSON.stringify({ email })
    }
  );

  return result.data;
}

export async function createAbacatePayCheckout(input: AbacatePayCheckoutInput) {
  const product = await createProduct({
    externalId: input.externalReference,
    name: input.title,
    description: input.description,
    price: input.amount
  });

  const customer = input.customerEmail
    ? await createOrGetCustomer(input.customerEmail)
    : undefined;

  const result = await abacatePayRequest<AbacatePayBilling>(
    "/checkouts/create",
    {
      method: "POST",
      body: JSON.stringify({
        items: [{ id: product.id, quantity: 1 }],
        methods: ["PIX"],
        returnUrl: getAbacatePayReturnUrl("/dashboard/perfil/creditos?status=success"),
        completionUrl: getAbacatePayReturnUrl("/dashboard/perfil/creditos?status=success"),
        externalId: input.externalReference,
        customerId: customer?.id,
        metadata: {
          externalReference: input.externalReference
        }
      })
    }
  );

  const checkoutUrl = result.data.url ?? "";

  if (!checkoutUrl) {
    throw new Error("AbacatePay nao retornou a URL de checkout.");
  }

  return {
    billingId: result.data.id,
    checkoutUrl
  };
}

export async function createAbacatePaySubscription(input: AbacatePaySubscriptionInput) {
  const cycle = input.billingCycle === "annual" ? "ANNUALLY" : "MONTHLY";

  const product = await createProduct({
    externalId: input.externalReference,
    name: input.reason,
    description: `Assinatura ${input.reason}`,
    price: input.amount,
    cycle
  });

  const customer = await createOrGetCustomer(input.customerEmail);

  const result = await abacatePayRequest<AbacatePayBilling>(
    "/subscriptions/create",
    {
      method: "POST",
      body: JSON.stringify({
        items: [{ id: product.id, quantity: 1 }],
        methods: ["CARD"],
        returnUrl: getAbacatePayReturnUrl("/dashboard?checkout=success"),
        completionUrl: getAbacatePayReturnUrl("/dashboard?checkout=success"),
        externalId: input.externalReference,
        customerId: customer.id,
        metadata: {
          externalReference: input.externalReference,
          customerEmail: input.customerEmail
        }
      })
    }
  );

  const checkoutUrl = result.data.url ?? "";

  if (!checkoutUrl) {
    throw new Error("AbacatePay nao retornou a URL de checkout para assinatura.");
  }

  return {
    billingId: result.data.id,
    checkoutUrl,
    status: result.data.status ?? "PENDING"
  };
}

export async function fetchAbacatePayCheckout(checkoutId: string) {
  const result = await abacatePayRequest<AbacatePayBilling>(
    `/checkouts/get?id=${encodeURIComponent(checkoutId)}`
  );

  return result.data;
}

export async function listAbacatePayCheckouts() {
  const result = await abacatePayRequest<AbacatePayBilling[]>(
    "/checkouts/list"
  );

  return result.data;
}

// --- Transparent (PIX inline) ---

export type AbacatePayTransparentCharge = {
  id: string;
  amount: number;
  status: string;
  brCode: string;
  brCodeBase64: string;
  url: string;
  expiresAt: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export async function createAbacatePayTransparent(input: {
  amount: number;
  description: string;
  externalId: string;
  customerEmail?: string;
  expiresInSeconds?: number;
  metadata?: Record<string, unknown>;
}) {
  const result = await abacatePayRequest<AbacatePayTransparentCharge>(
    "/transparents/create",
    {
      method: "POST",
      body: JSON.stringify({
        method: "PIX",
        data: {
          amount: input.amount,
          description: input.description,
          externalId: input.externalId,
          expiresIn: input.expiresInSeconds ?? 1800,
          metadata: {
            ...input.metadata,
            externalReference: input.externalId,
            ...(input.customerEmail ? { customerEmail: input.customerEmail } : {})
          }
        }
      })
    }
  );

  return result.data;
}

export async function checkAbacatePayTransparent(id: string) {
  const result = await abacatePayRequest<{
    id: string;
    status: string;
    expiresAt: string;
  }>(`/transparents/check?id=${encodeURIComponent(id)}`);

  return result.data;
}

// --- Webhook ---

export type AbacatePayWebhookEvent =
  | "checkout.completed"
  | "checkout.refunded"
  | "checkout.disputed"
  | "subscription.completed"
  | "subscription.cancelled"
  | "subscription.renewed"
  | (string & {});

type AbacatePayWebhookEnvelope = {
  id: string;
  event: AbacatePayWebhookEvent;
  apiVersion: number;
  devMode: boolean;
  data: Record<string, unknown>;
};

export function verifyAbacatePayWebhookSignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  if (!signatureHeader) return false;

  const secret = getAbacatePayWebhookSecret();
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function parseAbacatePayWebhookPayload(body: unknown): {
  webhookId: string;
  event: AbacatePayWebhookEvent;
  billingId: string;
  status: string;
  metadata: Record<string, unknown>;
  data: Record<string, unknown>;
} {
  const envelope = body as Partial<AbacatePayWebhookEnvelope> | null;

  const webhookId = (envelope?.id ?? "").toString().trim();
  const event = (envelope?.event ?? "") as AbacatePayWebhookEvent;
  const data =
    envelope?.data && typeof envelope.data === "object" && !Array.isArray(envelope.data)
      ? (envelope.data as Record<string, unknown>)
      : {};

  const billingId = ((data.id as string) ?? "").toString().trim();
  const status = ((data.status as string) ?? "").toString().trim();
  const metadata =
    data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>)
      : {};

  return { webhookId, event, billingId, status, metadata, data };
}

export function mapAbacatePayEventToStatus(event: AbacatePayWebhookEvent) {
  if (event.endsWith(".completed") || event.endsWith(".renewed")) {
    return "paid" as const;
  }

  if (event.endsWith(".cancelled")) {
    return "cancelled" as const;
  }

  if (event.endsWith(".refunded")) {
    return "refunded" as const;
  }

  if (event.endsWith(".disputed")) {
    return "disputed" as const;
  }

  return "pending" as const;
}

export function mapAbacatePayStatus(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === "PAID" || normalized === "CONFIRMED" || normalized === "COMPLETED") {
    return "paid" as const;
  }

  if (normalized === "CANCELLED" || normalized === "CANCELED") {
    return "cancelled" as const;
  }

  if (normalized === "EXPIRED" || normalized === "FAILED" || normalized === "REJECTED") {
    return "failed" as const;
  }

  if (normalized === "REFUNDED") {
    return "refunded" as const;
  }

  return "pending" as const;
}

export function mapAbacatePayEventStatus(event: AbacatePayWebhookEvent) {
  const mapped = mapAbacatePayEventToStatus(event);

  if (mapped === "paid") return "processed";
  if (mapped === "cancelled") return "cancelled";
  if (mapped === "refunded" || mapped === "disputed") return "failed";
  return "pending";
}

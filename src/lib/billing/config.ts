import { getServerEnv, isIntegrationConfigured } from "@/lib/env/server";
import { getSiteUrl } from "@/lib/site/config";

export function getBillingAppUrl() {
  return getSiteUrl();
}

export function getMercadoPagoAccessToken() {
  return getServerEnv("MERCADO_PAGO_ACCESS_TOKEN");
}

export function getMercadoPagoWebhookSecret() {
  return getServerEnv("MERCADO_PAGO_WEBHOOK_SECRET");
}

export function isBillingConfigured() {
  return isIntegrationConfigured("billing");
}

export function isMercadoPagoConfigured() {
  return Boolean(getMercadoPagoAccessToken());
}

export function getMercadoPagoNotificationUrl() {
  return `${getBillingAppUrl()}/api/billing/webhooks/mercadopago`;
}

export function getMercadoPagoBackUrl(pathname: string) {
  const baseUrl = new URL(getBillingAppUrl());
  baseUrl.pathname = pathname;
  return baseUrl.toString();
}

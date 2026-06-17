import { getServerEnv, isIntegrationConfigured } from "@/lib/env/server";
import { getSiteUrl } from "@/lib/site/config";

export function getBillingAppUrl() {
  return getSiteUrl();
}

export function getAbacatePayApiKey() {
  return getServerEnv("ABACATE_PAY_API_KEY");
}

export function getAbacatePayWebhookSecret() {
  return getServerEnv("ABACATE_PAY_WEBHOOK_SECRET");
}

export function isAbacatePayWebhookSecretConfigured() {
  return Boolean(getAbacatePayWebhookSecret());
}

export function isBillingConfigured() {
  return isIntegrationConfigured("billing");
}

export function isAbacatePayConfigured() {
  return Boolean(getAbacatePayApiKey());
}

export function getAbacatePayWebhookUrl() {
  return `${getBillingAppUrl()}/api/billing/webhooks/abacatepay`;
}

export function getAbacatePayReturnUrl(pathname: string) {
  const baseUrl = new URL(getBillingAppUrl());
  baseUrl.pathname = pathname.split("?")[0];
  const queryString = pathname.includes("?") ? pathname.split("?")[1] : "";
  if (queryString) {
    for (const param of queryString.split("&")) {
      const [key, value] = param.split("=");
      if (key) baseUrl.searchParams.set(key, value ?? "");
    }
  }
  return baseUrl.toString();
}

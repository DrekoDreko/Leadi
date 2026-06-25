import { getServerEnv, isIntegrationConfigured } from "@/lib/env/server";
import { getSiteUrl } from "@/lib/site/config";
import { logger } from "@/lib/logger";

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

let billingDisabledProdNoticeEmitted = false;

/**
 * Flag TEMPORARIA de testes. Quando BILLING_DISABLED === "true", todas as
 * cobrancas (convites de equipe, creditos de IA e gate de plano) ficam
 * desativadas. Reativar em producao = remover a env var (ou deixar "false")
 * e redeployar.
 *
 * Guard de visibilidade: se a flag estiver ativa num deploy de PRODUCAO
 * publica (VERCEL_ENV === "production"), registra um aviso uma unica vez por
 * cold start para que o estado "cobrancas simuladas" nunca passe silencioso
 * no lancamento comercial. O comportamento NAO muda (a fase de testes ainda
 * roda com a flag ligada de proposito).
 */
export function isBillingDisabledForTests() {
  const disabled = getServerEnv("BILLING_DISABLED") === "true";

  if (
    disabled &&
    !billingDisabledProdNoticeEmitted &&
    process.env.VERCEL_ENV === "production"
  ) {
    billingDisabledProdNoticeEmitted = true;
    logger.info({
      route: "lib/billing/config",
      operation: "BILLING_DISABLED_ACTIVE_IN_PRODUCTION",
      message:
        "BILLING_DISABLED=true em producao publica: cobrancas estao SIMULADAS. Remova a flag antes do lancamento comercial."
    });
  }

  return disabled;
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

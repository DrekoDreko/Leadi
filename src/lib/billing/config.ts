export function getBillingAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

export function getMercadoPagoAccessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() || "";
}

export function getMercadoPagoWebhookSecret() {
  return process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() || "";
}

export function isBillingConfigured() {
  return Boolean(
    getMercadoPagoAccessToken() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  );
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

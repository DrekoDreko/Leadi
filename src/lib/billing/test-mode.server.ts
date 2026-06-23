import "server-only";

import { isBillingDisabledForTests } from "@/lib/billing/config";
import { processAbacatePayWebhook } from "@/lib/billing/webhook-handler.server";
import type { AbacatePayWebhookEvent } from "@/lib/billing/abacatepay";
import { logger } from "@/lib/logger";

/**
 * Modo de simulacao de pagamento para o periodo de testes.
 *
 * Quando BILLING_DISABLED === "true", o app NAO cobra de verdade: as telas de
 * pagamento continuam aparecendo normalmente, mas o botao "passa" como se o
 * pagamento ja tivesse sido aprovado. Em vez de chamar o AbacatePay e esperar
 * o webhook real, a gente sintetiza um evento de pagamento aprovado e roda o
 * MESMO nucleo do webhook ({@link processAbacatePayWebhook}) — assim a
 * assinatura ativa, os creditos sao concedidos e a compra e marcada como paga
 * exatamente como em producao.
 *
 * Reativar cobranca real = remover BILLING_DISABLED do ambiente e redeployar.
 */
export function isBillingSimulationEnabled() {
  return isBillingDisabledForTests();
}

/**
 * Sintetiza um pagamento aprovado e aplica os efeitos colaterais reais
 * (ativar assinatura / creditar IA / marcar compra como paga) reusando o
 * nucleo do webhook. O `externalReference` deve ser o id do registro ja criado
 * (subscription.id, order.id ou purchase.id).
 */
export async function simulateAbacatePayPaidEvent(input: {
  event: AbacatePayWebhookEvent;
  externalReference: string;
}) {
  const billingId = `sim_${input.externalReference}`;

  const payload = {
    id: `sim_webhook_${Date.now()}`,
    event: input.event,
    devMode: true,
    data: {
      id: billingId,
      status: "PAID",
      externalId: input.externalReference,
      metadata: {
        externalReference: input.externalReference,
        simulated: true
      }
    }
  };

  const result = await processAbacatePayWebhook(payload);

  logger.info({
    route: "billing/test-mode",
    operation: "SIMULATE_PAID_EVENT",
    message: "Pagamento simulado (BILLING_DISABLED) aplicado.",
    data: { event: input.event, externalReference: input.externalReference, result }
  });

  return result;
}

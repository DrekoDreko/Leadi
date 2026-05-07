import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { EnvValidationError, requireIntegrationEnv } from "@/lib/env/server";
import {
  generateWhatsAppMessage,
  LeadHealthOpenAIError,
  type WhatsAppMessageInput
} from "@/lib/openai";
import { resolveOpenAIKeyForOrganization } from "@/lib/integrations/repository.server";
import {
  BillingResourceAccessError,
  assertOrganizationResourceAccess
} from "@/lib/billing/subscription-limits.server";
import { BILLING_FEATURE_COSTS } from "@/lib/billing/catalog";
import { chargeCreditsForFeature } from "@/lib/billing/usage.server";
import { isBillingConfigured } from "@/lib/billing/config";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { saveWhatsAppMessageForCurrentUser } from "@/lib/whatsapp/repository.server";
import type { WhatsAppGenerationForm } from "@/lib/whatsapp/types";

type WhatsAppRequestBody = Partial<WhatsAppMessageInput> & {
  leadId?: unknown;
};

type ParsedWhatsAppInput = Omit<WhatsAppMessageInput, "brokerageName"> & {
  leadName: string;
};

export async function POST(request: Request) {
  try {
    if (!isBillingConfigured()) {
      requireIntegrationEnv("billing");
    }

    const body = (await request.json().catch(() => null)) as WhatsAppRequestBody | null;
    const input = parseWhatsAppRequest(body);
    const billingContext = await getBillingAuthContext();

    if (!billingContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const openAIKey = await resolveOpenAIKeyForOrganization(billingContext.organizationId);

    await assertOrganizationResourceAccess(
      billingContext.organizationId,
      "whatsapp_generation"
    );
    const usageReferenceId = request.headers.get("x-idempotency-key") ?? randomUUID();

    await chargeCreditsForFeature({
      organizationId: billingContext.organizationId,
      amount: BILLING_FEATURE_COSTS.whatsapp_message,
      featureKey: "whatsapp_message",
      source: "system",
      referenceType: "whatsapp_message_generation",
      referenceId: usageReferenceId,
      profileId: billingContext.profileId,
      metadata: {
        brokerageName: billingContext.brokerageName,
        product: input.product,
        stage: input.stage,
        objective: input.objective
      }
    });

    const message = await generateWhatsAppMessage({
      ...input,
      brokerageName: billingContext.brokerageName
    }, openAIKey ? { apiKey: openAIKey } : undefined);
    const savedForm: WhatsAppGenerationForm = {
      leadId: getOptionalString(body?.leadId),
      leadName: input.leadName,
      brokerageName: billingContext.brokerageName,
      leadContext: input.leadContext || "",
      stage: input.stage ?? "new",
      objective: input.objective ?? "iniciar conversa e confirmar interesse",
      tone: input.tone ?? "proximo, educado e objetivo",
      product: input.product
    };
    const savedMessage = await saveWhatsAppMessageForCurrentUser({
      form: savedForm,
      message
    });

    return NextResponse.json({ message, savedMessage });
  } catch (error) {
    const { message, status } = getWhatsAppError(error);

    return NextResponse.json({ error: message }, { status });
  }
}

function parseWhatsAppRequest(
  body: WhatsAppRequestBody | null
): ParsedWhatsAppInput {
  const product = getRequiredString(body?.product, "Informe o produto ou servico.");

  return {
    product,
    leadName: getRequiredString(body?.leadName, "Selecione um lead para gerar a mensagem."),
    leadContext: getOptionalString(body?.leadContext),
    stage: getStage(body?.stage),
    objective: getOptionalString(body?.objective) || "iniciar conversa e confirmar interesse",
    tone: getOptionalString(body?.tone) || "proximo, educado e objetivo"
  };
}

function getRequiredString(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim().slice(0, 280);
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 280) : "";
}

function getStage(value: unknown): WhatsAppMessageInput["stage"] {
  if (
    value === "new" ||
    value === "qualification" ||
    value === "proposal" ||
    value === "negotiation" ||
    value === "won" ||
    value === "lost"
  ) {
    return value;
  }

  return "new";
}

function getWhatsAppError(error: unknown) {
  if (error instanceof EnvValidationError) {
    return {
      message: error.message,
      status: 503
    };
  }

  if (error instanceof LeadHealthOpenAIError) {
    return {
      message: error.message,
      status: error.code === "missing_api_key" ? 400 : 502
    };
  }

  if (error instanceof BillingResourceAccessError) {
    return {
      message: error.access.message,
      status: error.status
    };
  }

  if (error instanceof Error && error.message) {
    const message = error.message.toLowerCase();

    if (message.includes("credito") || message.includes("crédito") || message.includes("insuf")) {
      return {
        message:
          "Créditos insuficientes para gerar a mensagem do WhatsApp. Adquira mais créditos no plano ou em um pacote avulso.",
        status: 402
      };
    }

    return {
      message: error.message,
      status: 400
    };
  }

  return {
    message: "Nao foi possivel gerar a mensagem.",
    status: 400
  };
}

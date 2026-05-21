import { NextResponse } from "next/server";
import { z } from "zod";
import { AiCreditsError, runAiActionWithCredits } from "@/lib/ai/credits";
import {
  generateWhatsAppMessage,
  LeadHealthOpenAIError,
  type WhatsAppMessageInput
} from "@/lib/openai";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { saveWhatsAppMessageForCurrentUser } from "@/lib/whatsapp/repository.server";
import type { WhatsAppGenerationForm, WhatsAppHistoryItem } from "@/lib/whatsapp/types";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

type ParsedWhatsAppInput = Omit<WhatsAppMessageInput, "brokerageName"> & {
  leadName: string;
};

const whatsappGenerateSchema = z.object({
  leadId: z.string().trim().max(120).optional(),
  product: requiredTrimmedString("Informe o produto ou servico.").max(280),
  leadName: requiredTrimmedString("Selecione um lead para gerar a mensagem.").max(280),
  leadContext: z.string().trim().max(280).optional(),
  stage: z
    .enum([
      "new",
      "qualification",
      "proposal",
      "negotiation",
      "won",
      "lost",
      "new_lead",
      "first_contact",
      "awaiting_response",
      "closing",
      "post_service"
    ])
    .optional(),
  objective: z.string().trim().max(280).optional(),
  tone: z.string().trim().max(280).optional()
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-whatsapp-generate",
      limit: 20,
      windowMs: 60 * 1000
    });
    const body = await parseJsonBody(request, whatsappGenerateSchema);
    const input = parseWhatsAppRequest(body);
    const billingContext = await getBillingAuthContext();

    if (!billingContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const { result: message, remainingCredits } = await runAiActionWithCredits({
      orgId: billingContext.organizationId,
      userId: billingContext.profileId,
      feature: "generate_whatsapp_message",
      description: "Geracao de mensagem de WhatsApp com IA",
      metadata: {
        route: "whatsapp/generate",
        stage: input.stage ?? "new"
      },
      generate: (apiKey) =>
        generateWhatsAppMessage(
          {
            ...input,
            brokerageName: billingContext.brokerageName
          },
          { apiKey }
        )
    });
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
    let savedMessage: WhatsAppHistoryItem | null = null;

    try {
      savedMessage = await saveWhatsAppMessageForCurrentUser({
        form: savedForm,
        message
      });
    } catch (saveError) {
      console.error("Nao foi possivel salvar a mensagem de WhatsApp gerada.", saveError);
    }

    return NextResponse.json({ message, savedMessage, aiBalance: remainingCredits });
  } catch (error) {
    const { message, status } = getWhatsAppError(error);

    logApiError({
      route: "/api/whatsapp/generate",
      operation: "GENERATE_WHATSAPP_MESSAGE",
      message,
      status,
      error
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function parseWhatsAppRequest(
  body: z.infer<typeof whatsappGenerateSchema>
): ParsedWhatsAppInput {
  return {
    product: body.product,
    leadName: body.leadName,
    leadContext: getOptionalString(body.leadContext),
    stage: getStage(body?.stage),
    objective: getOptionalString(body.objective) || "iniciar conversa e confirmar interesse",
    tone: getOptionalString(body.tone) || "proximo, educado e objetivo"
  };
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
    value === "lost" ||
    value === "new_lead" ||
    value === "first_contact" ||
    value === "awaiting_response" ||
    value === "closing" ||
    value === "post_service"
  ) {
    return value;
  }

  return "new";
}

function getWhatsAppError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return {
      message: error.message,
      status: getErrorStatus(error)
    };
  }

  if (error instanceof AiCreditsError) {
    return {
      message: error.message,
      status: 400
    };
  }

  if (error instanceof LeadHealthOpenAIError) {
    return {
      message: error.message,
      status: error.code === "missing_api_key" ? 503 : 502
    };
  }

  if (error instanceof Error && error.message) {
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

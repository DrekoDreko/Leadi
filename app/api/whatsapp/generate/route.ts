import { NextResponse } from "next/server";
import { AiCreditsError, runAiActionWithCredits } from "@/lib/ai/credits";
import {
  generateWhatsAppMessage,
  LeadHealthOpenAIError,
  type WhatsAppMessageInput
} from "@/lib/openai";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { saveWhatsAppMessageForCurrentUser } from "@/lib/whatsapp/repository.server";
import type { WhatsAppGenerationForm, WhatsAppHistoryItem } from "@/lib/whatsapp/types";

type WhatsAppRequestBody = Partial<WhatsAppMessageInput> & {
  leadId?: unknown;
};

type ParsedWhatsAppInput = Omit<WhatsAppMessageInput, "brokerageName"> & {
  leadName: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as WhatsAppRequestBody | null;
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

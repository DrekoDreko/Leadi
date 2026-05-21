import { NextResponse } from "next/server";
import { z } from "zod";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { sendWhatsAppMessageForCurrentUser } from "@/lib/whatsapp/send.repository.server";
import type { WhatsAppSendRequest } from "@/lib/whatsapp/types";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

const whatsappSendSchema = z.object({
  messageId: requiredTrimmedString("Informe a mensagem que deseja enviar.").max(120),
  leadId: z.string().trim().max(120).optional(),
  recipientPhone: z.string().trim().max(40).optional()
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-whatsapp-send",
      limit: 20,
      windowMs: 60 * 1000
    });
    const body = await parseJsonBody(request, whatsappSendSchema);
    const input = parseRequest(body);
    const authContext = await getBillingAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const result = await sendWhatsAppMessageForCurrentUser(input);

    return NextResponse.json({
      ...result,
      message: "Fluxo de envio processado com sucesso."
    });
  } catch (error) {
    const { message, status } = getSendError(error);
    logApiError({
      route: "/api/whatsapp/send",
      operation: "SEND_WHATSAPP_MESSAGE",
      message,
      status,
      error
    });
    return NextResponse.json({ error: message }, { status });
  }
}

function parseRequest(body: z.infer<typeof whatsappSendSchema>): WhatsAppSendRequest {
  return {
    messageId: body.messageId,
    leadId: getOptionalString(body.leadId),
    recipientPhone: getOptionalString(body.recipientPhone)
  };
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getSendError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return {
      message: error.message,
      status: getErrorStatus(error)
    };
  }

  if (error instanceof Error && error.message) {
    return {
      message: error.message,
      status: 400
    };
  }

  return {
    message: "Nao foi possivel enviar a mensagem.",
    status: 400
  };
}

import { NextResponse } from "next/server";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { sendWhatsAppMessageForCurrentUser } from "@/lib/whatsapp/send.repository.server";
import type { WhatsAppSendRequest } from "@/lib/whatsapp/types";

type WhatsAppSendBody = Partial<WhatsAppSendRequest> & {
  messageId?: unknown;
  leadId?: unknown;
  recipientPhone?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as WhatsAppSendBody | null;
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
    return NextResponse.json({ error: message }, { status });
  }
}

function parseRequest(body: WhatsAppSendBody | null): WhatsAppSendRequest {
  return {
    messageId: getRequiredString(body?.messageId, "Informe a mensagem que deseja enviar."),
    leadId: getOptionalString(body?.leadId),
    recipientPhone: getOptionalString(body?.recipientPhone)
  };
}

function getRequiredString(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim();
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getSendError(error: unknown) {
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

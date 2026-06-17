import { NextResponse } from "next/server";
import {
  getCreativeRequestSetupErrorMessage,
  isCreativeRequestSetupErrorMessage
} from "@/lib/creative-requests/errors";
import { addCreativeRequestAttachmentForCurrentUser } from "@/lib/creative-requests/repository.server";
import { PayloadTooLargeError, validateFilePayloadSize } from "@/lib/payload-limits";
import { assertRouteRateLimit, assertSameOrigin } from "@/lib/api/route-security";
import { assertAllowedUploadType, InvalidUploadTypeError } from "@/lib/uploads/validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-creative-request-attachments-post",
      suffix: id,
      limit: 20,
      windowMs: 60 * 1000
    });
    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      throw new Error("Selecione um arquivo para anexar.");
    }

    assertAllowedUploadType(uploadedFile, "ATTACHMENT");
    validateFilePayloadSize(uploadedFile, "ATTACHMENT");

    const creativeRequest = await addCreativeRequestAttachmentForCurrentUser(id, uploadedFile);

    return NextResponse.json({ request: creativeRequest }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: getCreativeRequestAttachmentErrorMessage(error)
      },
      { status: getCreativeRequestAttachmentErrorStatus(error) }
    );
  }
}

function getCreativeRequestAttachmentErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para anexar arquivos.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina antes de anexar arquivos.";
  }

  if (message.includes("Pedido nao encontrado")) {
    return "Pedido nao encontrado ou sem permissao para anexos.";
  }

  if (isCreativeRequestSetupErrorMessage(message)) {
    return getCreativeRequestSetupErrorMessage();
  }

  if (message.includes("Supabase nao configurado")) {
    return "Configure o Supabase para habilitar anexos reais nos pedidos.";
  }

  if (
    message.includes("Selecione um arquivo") ||
    message.includes("arquivo") ||
    message.includes("anexo")
  ) {
    return message;
  }

  return "Nao foi possivel anexar o arquivo. Tente novamente em instantes.";
}

function getCreativeRequestAttachmentErrorStatus(error: unknown) {
  if (error instanceof PayloadTooLargeError || error instanceof InvalidUploadTypeError) {
    return error.status;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Pedido nao encontrado")) {
    return 404;
  }

  return 400;
}

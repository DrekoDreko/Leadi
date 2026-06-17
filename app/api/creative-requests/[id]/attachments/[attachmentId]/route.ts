import { NextResponse } from "next/server";
import {
  getCreativeRequestSetupErrorMessage,
  isCreativeRequestSetupErrorMessage
} from "@/lib/creative-requests/errors";
import { getCreativeRequestAttachmentDownloadUrlForCurrentUser } from "@/lib/creative-requests/repository.server";
import { RateLimitError } from "@/lib/rate-limit";
import { assertRouteRateLimit } from "@/lib/api/route-security";

type RouteContext = {
  params: Promise<{
    id: string;
    attachmentId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-creative-request-attachment-download",
      limit: 30,
      windowMs: 60 * 1000
    });

    const { id, attachmentId } = await context.params;
    const signedUrl = await getCreativeRequestAttachmentDownloadUrlForCurrentUser(id, attachmentId);

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);

    return NextResponse.json(
      {
        error: getCreativeRequestAttachmentDownloadErrorMessage(error)
      },
      { status: getCreativeRequestAttachmentDownloadErrorStatus(error) }
    );
  }
}

function getCreativeRequestAttachmentDownloadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para baixar anexos.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina antes de baixar anexos.";
  }

  if (message.includes("Pedido nao encontrado") || message.includes("Anexo nao encontrado")) {
    return "Anexo nao encontrado ou sem permissao para download.";
  }

  if (isCreativeRequestSetupErrorMessage(message)) {
    return getCreativeRequestSetupErrorMessage();
  }

  if (message.includes("Supabase nao configurado")) {
    return "Configure o Supabase para habilitar downloads reais de anexos.";
  }

  return "Nao foi possivel preparar o download do anexo.";
}

function getCreativeRequestAttachmentDownloadErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Pedido nao encontrado") || message.includes("Anexo nao encontrado")) {
    return 404;
  }

  return 400;
}

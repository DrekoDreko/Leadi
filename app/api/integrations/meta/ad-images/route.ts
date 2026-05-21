import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { PayloadTooLargeError, validateFilePayloadSize } from "@/lib/payload-limits";
import {
  MetaAdImageUploadError,
  uploadMetaAdImageForCurrentUser
} from "@/lib/meta/ad-image-upload.server";
import {
  assertRouteRateLimit,
  assertSameOrigin
} from "@/lib/api/route-security";

export async function POST(request: Request) {
  let formData: FormData | null = null;
  let file: File | null = null;

  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-meta-ad-images",
      limit: 15,
      windowMs: 60 * 1000
    });
    formData = await request.formData();
    file = parseFile(formData);
    validateFilePayloadSize(file, "META_AD_IMAGE");

    const result = await uploadMetaAdImageForCurrentUser({
      file,
      metaAdAccountId: parseRequiredText(formData.get("metaAdAccountId"), "Informe a conta de anuncios da Meta."),
      creativeRequestId: parseOptionalText(formData.get("creativeRequestId")),
      campaignId: parseOptionalText(formData.get("campaignId"))
    });

    return NextResponse.json(
      {
        upload: result.upload,
        metaResponse: result.metaResponse
      },
      { status: 201 }
    );
  } catch (error) {
    const status = getMetaAdImageUploadStatus(error);
    const message = getMetaAdImageUploadMessage(error);

    logger.error(
      {
        route: "/api/integrations/meta/ad-images",
        operation: "UPLOAD_META_AD_IMAGE",
        status,
        message,
        data: {
          fileName: file?.name ?? null,
          fileSize: file?.size ?? null,
          metaAdAccountId: parseLoggedText(formData?.get("metaAdAccountId") ?? null),
          creativeRequestId: parseLoggedText(formData?.get("creativeRequestId") ?? null),
          campaignId: parseLoggedText(formData?.get("campaignId") ?? null)
        }
      },
      error
    );

    return NextResponse.json({ error: message }, { status });
  }
}

function parseFile(formData: FormData) {
  const uploadedFile = formData.get("file");

  if (!(uploadedFile instanceof File)) {
    throw new MetaAdImageUploadError("Selecione uma imagem para enviar.");
  }

  return uploadedFile;
}

function parseRequiredText(value: FormDataEntryValue | null, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new MetaAdImageUploadError(message);
  }

  return value.trim();
}

function parseOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseLoggedText(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getMetaAdImageUploadMessage(error: unknown) {
  if (error instanceof MetaAdImageUploadError) {
    return error.message;
  }

  if (error instanceof PayloadTooLargeError) {
    return "A imagem enviada excede o limite permitido. Envie um arquivo menor.";
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para enviar a imagem.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina e tente novamente.";
  }

  if (message.includes("Conta de anuncio")) {
    return message;
  }

  return "Nao foi possivel enviar a imagem para a Meta. Tente novamente em instantes.";
}

function getMetaAdImageUploadStatus(error: unknown) {
  if (error instanceof PayloadTooLargeError) {
    return error.status;
  }

  if (error instanceof MetaAdImageUploadError) {
    return error.status;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (
    message.includes("permissao") ||
    message.includes("conexao Meta") ||
    message.includes("Conta de anuncio")
  ) {
    return 403;
  }

  if (message.includes("nao encontrada")) {
    return 404;
  }

  return 400;
}

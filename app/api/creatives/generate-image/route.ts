import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { EnvValidationError } from "@/lib/env/server";
import { AiCreditsError, runAiActionWithCredits } from "@/lib/ai/credits";
import { generateAdImage, LeadHealthOpenAIError, type AdImageSize } from "@/lib/openai";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import {
  CREATIVE_REQUEST_ATTACHMENT_MAX_SIZE_BYTES,
  validateCreativeRequestAttachment
} from "@/lib/creative-requests/attachments";
import { getAdImageStylePreset } from "@/lib/creatives/ad-image-presets";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  requiredTrimmedString
} from "@/lib/api/route-security";

const MAX_REFERENCE_IMAGES = 4;
const FORMAT_TO_SIZE: Record<string, AdImageSize> = {
  story: "1024x1536",
  portrait: "1024x1536",
  feed: "1024x1024",
  square: "1024x1024",
  landscape: "1536x1024"
};

const generateImageSchema = z.object({
  title: requiredTrimmedString("Informe o titulo da arte.").max(160),
  objective: z.string().trim().max(500).optional(),
  briefing: requiredTrimmedString("Descreva o briefing da arte.").max(4000),
  carrier: z.string().trim().max(120).optional(),
  contractType: z.string().trim().max(120).optional(),
  discount: z.string().trim().max(80).optional(),
  offer: z.string().trim().max(280).optional(),
  phone: z.string().trim().max(60).optional(),
  brandName: z.string().trim().max(120).optional(),
  format: z.string().trim().max(40).optional(),
  style: z.string().trim().max(280).optional(),
  stylePreset: z.string().trim().max(60).optional()
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-creatives-generate-image",
      limit: 10,
      windowMs: 60 * 1000
    });

    const billingContext = await getBillingAuthContext();

    if (!billingContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const formData = await request.formData();
    const fields = generateImageSchema.parse({
      title: formData.get("title"),
      objective: optionalString(formData.get("objective")),
      briefing: formData.get("briefing"),
      carrier: optionalString(formData.get("carrier")),
      contractType: optionalString(formData.get("contractType")),
      discount: optionalString(formData.get("discount")),
      offer: optionalString(formData.get("offer")),
      phone: optionalString(formData.get("phone")),
      brandName: optionalString(formData.get("brandName")),
      format: optionalString(formData.get("format")),
      style: optionalString(formData.get("style")),
      stylePreset: optionalString(formData.get("stylePreset"))
    });

    const preset = getAdImageStylePreset(fields.stylePreset);
    const useStyleReference =
      Boolean(preset) && parseBoolean(formData.get("useStyleReference"));

    const referenceImages = extractReferenceImages(formData);

    if (useStyleReference && preset) {
      const presetReference = await loadPresetReferenceImage(preset.previewImage);
      if (presetReference) {
        referenceImages.unshift(presetReference);
      }
    }

    const size = resolveSize(fields.format);

    const { result, remainingCredits } = await runAiActionWithCredits({
      orgId: billingContext.organizationId,
      userId: billingContext.profileId,
      feature: "generate_ad_image",
      description: "Geracao de arte com IA",
      metadata: {
        route: "creatives/generate-image",
        format: fields.format ?? null,
        stylePreset: preset?.id ?? null,
        useStyleReference,
        hasReferences: referenceImages.length > 0,
        referenceCount: referenceImages.length
      },
      generate: (apiKey) =>
        generateAdImage(
          {
            ...fields,
            brandName: fields.brandName ?? billingContext.brokerageName,
            size,
            referenceImages
          },
          { apiKey }
        )
    });

    return NextResponse.json({ image: result, remainingCredits }, { status: 201 });
  } catch (error) {
    const { message, status } = getGenerateImageError(error);

    logApiError({
      route: "/api/creatives/generate-image",
      operation: "GENERATE_AD_IMAGE",
      message,
      status,
      error
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "1" || value === "on";
}

async function loadPresetReferenceImage(previewImage: string): Promise<File | null> {
  // previewImage e um caminho publico tipo "/creatives/presets/<id>.png".
  const relativePath = previewImage.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  try {
    const buffer = await readFile(absolutePath);
    const fileName = path.basename(absolutePath);
    return new File([new Uint8Array(buffer)], fileName, { type: "image/png" });
  } catch {
    // Preview ainda nao gerada: segue apenas com o padrao textual.
    return null;
  }
}

function extractReferenceImages(formData: FormData) {
  const files = formData
    .getAll("references")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_REFERENCE_IMAGES);

  for (const file of files) {
    const validationError = validateCreativeRequestAttachment({
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (validationError) {
      throw new ApiRouteError(400, validationError);
    }

    if (!file.type.startsWith("image/")) {
      throw new ApiRouteError(
        400,
        "As referencias para a IA devem ser imagens (PNG, JPG ou WebP)."
      );
    }

    if (file.size > CREATIVE_REQUEST_ATTACHMENT_MAX_SIZE_BYTES) {
      const limitMb = CREATIVE_REQUEST_ATTACHMENT_MAX_SIZE_BYTES / (1024 * 1024);
      throw new ApiRouteError(400, `Cada referencia pode ter no maximo ${limitMb} MB.`);
    }
  }

  return files;
}

function resolveSize(format?: string): AdImageSize {
  if (!format) {
    return "1024x1024";
  }

  return FORMAT_TO_SIZE[format.trim().toLowerCase()] ?? "1024x1024";
}

function getGenerateImageError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return { message: error.message, status: getErrorStatus(error) };
  }

  if (error instanceof z.ZodError) {
    return {
      message: error.issues[0]?.message ?? "Revise os dados informados.",
      status: 400
    };
  }

  if (error instanceof EnvValidationError) {
    return { message: error.message, status: 503 };
  }

  if (error instanceof LeadHealthOpenAIError) {
    return {
      message: error.message,
      status: error.code === "missing_api_key" ? 503 : 502
    };
  }

  if (error instanceof AiCreditsError) {
    return { message: error.message, status: 400 };
  }

  if (error instanceof Error && error.message) {
    return { message: error.message, status: 400 };
  }

  return {
    message: "Nao foi possivel gerar a arte. Revise os dados e tente novamente.",
    status: 400
  };
}

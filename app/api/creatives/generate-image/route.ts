import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { EnvValidationError } from "@/lib/env/server";
import { AiCreditsError, runAiActionWithCredits } from "@/lib/ai/credits";
import { LeadHealthOpenAIError } from "@/lib/openai";
import { generateAdImageSet } from "@/lib/creatives/ad-image-set.server";
import type { AdBenefit, AdLayoutContent } from "@/lib/creatives/compositor";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { getAdImageStylePreset } from "@/lib/creatives/ad-image-presets";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  requiredTrimmedString
} from "@/lib/api/route-security";
import { getOperator } from "@/lib/creatives/operator-config";

const generateImageSchema = z.object({
  title: requiredTrimmedString("Informe o titulo da arte.").max(160),
  subtitle: z.string().trim().max(200).optional(),
  briefing: requiredTrimmedString("Descreva o briefing da arte.").max(4000),
  carrier: z.string().trim().max(120).optional(),
  contractType: z.string().trim().max(120).optional(),
  discount: z.string().trim().max(80).optional(),
  offer: z.string().trim().max(280).optional(),
  benefits: z.string().trim().max(1200).optional(),
  cta: z.string().trim().max(80).optional(),
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
      subtitle: optionalString(formData.get("subtitle")),
      briefing: formData.get("briefing"),
      carrier: optionalString(formData.get("carrier")),
      contractType: optionalString(formData.get("contractType")),
      discount: optionalString(formData.get("discount")),
      offer: optionalString(formData.get("offer")),
      benefits: optionalString(formData.get("benefits")),
      cta: optionalString(formData.get("cta")),
      phone: optionalString(formData.get("phone")),
      brandName: optionalString(formData.get("brandName")),
      format: optionalString(formData.get("format")),
      style: optionalString(formData.get("style")),
      stylePreset: optionalString(formData.get("stylePreset"))
    });

    const preset = getAdImageStylePreset(fields.stylePreset);
    const operator = fields.carrier ? getOperator(fields.carrier) : undefined;
    const carrierColor = operator?.primaryColor ?? "#1F4ED8";
    const logo = operator ? await loadImageBuffer(operator.logoPath) : null;

    // Estilo/template: preset escolhido, ou inferido (tem desconto => oferta).
    const styleId = preset?.id ?? (fields.discount ? "oferta-desconto" : "medico-hospital");

    // Oferta usa fundo em gradiente (sem foto). Demais usam foto da IA.
    const backgroundPrompt =
      styleId === "oferta-desconto"
        ? null
        : preset?.backgroundPrompt ?? buildGenericBackgroundPrompt(fields.briefing);

    const benefits = parseBenefits(fields.benefits);
    const content: AdLayoutContent = {
      title: fields.title,
      subtitle: fields.subtitle,
      contractType: fields.contractType,
      discount: fields.discount,
      offer: fields.offer,
      benefits: benefits.length > 0 ? benefits : undefined,
      cta: fields.cta ?? defaultCta(),
      phone: fields.phone,
      brandName: fields.brandName ?? billingContext.brokerageName ?? undefined
    };

    const { result, remainingCredits } = await runAiActionWithCredits({
      orgId: billingContext.organizationId,
      userId: billingContext.profileId,
      feature: "generate_ad_image_set",
      description: "Geracao de par de artes com IA (Feed + Vertical)",
      metadata: {
        route: "creatives/generate-image",
        styleId,
        stylePreset: preset?.id ?? null,
        operator: operator?.slug ?? null,
        hasOperatorLogo: Boolean(logo),
        usesBackgroundPhoto: Boolean(backgroundPrompt),
        assets: ["feed", "vertical"]
      },
      generate: (apiKey) =>
        generateAdImageSet(
          { styleId, content, carrierColor, logo, backgroundPrompt },
          { apiKey }
        )
    });

    return NextResponse.json(
      { assets: result, remainingCredits, photoSkipped: result.photoSkipped },
      { status: 201 }
    );
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

/** Le um asset publico (ex: "/creatives/logos/operadoras/amil.png") como Buffer. */
async function loadImageBuffer(publicPath: string): Promise<Buffer | null> {
  const absolutePath = path.join(process.cwd(), "public", publicPath.replace(/^\/+/, ""));
  try {
    return await readFile(absolutePath);
  } catch {
    return null;
  }
}

/** Converte o textarea de beneficios (um por linha) em itens estruturados. */
function parseBenefits(raw?: string): AdBenefit[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*]+/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 6)
    .map((line) => {
      const [title, detail] = line.split(/\s*[—|]\s*/, 2);
      return detail ? { title: title.trim(), detail: detail.trim() } : { title: title.trim() };
    });
}

function defaultCta(): string {
  return "Solicite sua cotação";
}

function buildGenericBackgroundPrompt(briefing: string): string {
  return `Foto realista e profissional de banco de imagens relacionada a plano de saude no Brasil (${briefing}). Pessoas reais, ambiente acolhedor, luz natural suave. SEM nenhum texto, SEM letras, SEM logotipo, SEM numeros, SEM marca d'agua, SEM bordas. Pessoas centralizadas, com area mais limpa no topo e na base.`;
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

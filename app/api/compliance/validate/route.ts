import { NextResponse } from "next/server";
import { z } from "zod";
import { AiCreditsError, runAiActionWithCredits } from "@/lib/ai/credits";
import {
  DEFAULT_COMPLIANCE_DISCLAIMER,
  reviewTextLocally as reviewTextLocallyWithRules
} from "@/lib/openai/compliance-guardrails";
import {
  LeadHealthOpenAIError,
  reviewComplianceText,
  type ComplianceReviewInput,
  type ComplianceReviewOutput
} from "@/lib/openai";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import {
  assertOrganizationAiFeatureEnabled,
  BillingResourceAccessError
} from "@/lib/billing/subscription-limits.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

type ReviewReason = ComplianceReviewOutput["reasons"][number];
type RiskLevel = ComplianceReviewOutput["riskLevel"];

type ComplianceReviewResponse = ComplianceReviewOutput & {
  analysisSource: "local" | "local_ai";
  score: number;
  aiWarning: string;
  aiBalance?: number;
};

const MAX_TEXT_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 280;
const complianceRequestSchema = z.object({
  text: requiredTrimmedString("Cole o texto da campanha para validar.").max(MAX_TEXT_LENGTH),
  channel: z.enum(["meta_ads", "lead_form", "landing_page", "whatsapp", "other"]).optional(),
  audience: z.string().trim().max(MAX_CONTEXT_LENGTH).optional(),
  objective: z.string().trim().max(MAX_CONTEXT_LENGTH).optional()
});

const RISK_ORDER: Record<RiskLevel, number> = {
  high: 3,
  medium: 2,
  low: 1
};

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-compliance-validate",
      limit: 20,
      windowMs: 60 * 1000
    });
    const body = await parseJsonBody(request, complianceRequestSchema);
    const input = parseComplianceRequest(body);
    const localReview = reviewTextLocally(input.text);
    const billingContext = await getBillingAuthContext();

    if (!billingContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    await assertOrganizationAiFeatureEnabled(billingContext.organizationId);

    const { result: aiReview, remainingCredits } = await runAiActionWithCredits({
      orgId: billingContext.organizationId,
      userId: billingContext.profileId,
      feature: "generate_compliance_review",
      description: "Revisao de compliance com IA",
      metadata: {
        route: "compliance/validate",
        channel: input.channel
      },
      generate: (apiKey) => reviewComplianceText(input, { apiKey })
    });

    return NextResponse.json({
      review: mergeReviews(localReview, aiReview, ""),
      aiBalance: remainingCredits
    });
  } catch (error) {
    const { message, status } = getComplianceError(error);

    logApiError({
      route: "/api/compliance/validate",
      operation: "VALIDATE_COMPLIANCE_TEXT",
      message,
      status,
      error
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function parseComplianceRequest(body: z.infer<typeof complianceRequestSchema>): ComplianceReviewInput {
  return {
    text: body.text,
    channel: getChannel(body.channel),
    audience: getOptionalString(body.audience),
    objective: getOptionalString(body.objective)
  };
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, MAX_CONTEXT_LENGTH)
    : "";
}

function getChannel(value: unknown): NonNullable<ComplianceReviewInput["channel"]> {
  if (
    value === "meta_ads" ||
    value === "lead_form" ||
    value === "landing_page" ||
    value === "whatsapp" ||
    value === "other"
  ) {
    return value;
  }

  return "meta_ads";
}

function reviewTextLocally(text: string): ComplianceReviewResponse {
  return reviewTextLocallyWithRules(text) as ComplianceReviewResponse;
}

function mergeReviews(
  localReview: ComplianceReviewResponse,
  aiReview: ComplianceReviewOutput,
  aiWarning: string
): ComplianceReviewResponse {
  const riskLevel =
    RISK_ORDER[aiReview.riskLevel] > RISK_ORDER[localReview.riskLevel]
      ? aiReview.riskLevel
      : localReview.riskLevel;
  const reasons = mergeReasons(localReview.reasons, aiReview.reasons);
  const suggestions = dedupeStrings([...localReview.suggestions, ...aiReview.suggestions]);

  return {
    riskLevel,
    score: getScore(riskLevel, reasons.length),
    reasons,
    suggestions,
    rewrittenText: aiReview.rewrittenText || localReview.rewrittenText,
    disclaimer: aiReview.disclaimer || DEFAULT_COMPLIANCE_DISCLAIMER,
    analysisSource: "local_ai",
    aiWarning
  };
}

function mergeReasons(localReasons: ReviewReason[], aiReasons: ReviewReason[]) {
  const seen = new Set<string>();

  return [...localReasons, ...aiReasons].filter((reason) => {
    const key = `${reason.title}-${reason.detail}`.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getScore(riskLevel: RiskLevel, reasonCount: number) {
  const baseScore = {
    high: 42,
    medium: 70,
    low: 94
  }[riskLevel];

  return Math.max(18, baseScore - Math.max(0, reasonCount - 1) * 5);
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getComplianceError(error: unknown) {
  if (error instanceof BillingResourceAccessError) {
    return {
      message: error.message,
      status: error.status
    };
  }

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
    message: "Nao foi possivel validar o texto. Revise os dados e tente novamente.",
    status: 400
  };
}

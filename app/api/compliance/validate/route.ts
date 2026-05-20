import { NextResponse } from "next/server";
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

type ComplianceRequestBody = {
  text?: unknown;
  channel?: unknown;
  audience?: unknown;
  objective?: unknown;
};

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

const RISK_ORDER: Record<RiskLevel, number> = {
  high: 3,
  medium: 2,
  low: 1
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ComplianceRequestBody;
    const input = parseComplianceRequest(body);
    const localReview = reviewTextLocally(input.text);
    const billingContext = await getBillingAuthContext();

    if (!billingContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

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
    if (error instanceof AiCreditsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof LeadHealthOpenAIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "missing_api_key" ? 503 : 502 }
      );
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Nao foi possivel validar o texto. Revise os dados e tente novamente.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function parseComplianceRequest(body: ComplianceRequestBody): ComplianceReviewInput {
  const text = getRequiredString(body.text, "Cole o texto da campanha para validar.").slice(
    0,
    MAX_TEXT_LENGTH
  );

  return {
    text,
    channel: getChannel(body.channel),
    audience: getOptionalString(body.audience),
    objective: getOptionalString(body.objective)
  };
}

function getRequiredString(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim();
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

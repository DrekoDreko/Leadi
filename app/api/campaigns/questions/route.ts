import { NextResponse } from "next/server";
import { z } from "zod";
import { AiCreditsError, runAiActionWithCredits } from "@/lib/ai/credits";
import {
  generateComplianceQuestions,
  LeadHealthOpenAIError,
  type ComplianceQuestionsInput,
  type ComplianceQuestionsOutput
} from "@/lib/openai";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

type ComplianceQuestion = ComplianceQuestionsOutput["questions"][number];

const MAX_FIELD_LENGTH = 280;
const DEFAULT_PRODUCT = "Plano de saude empresarial";
const questionsRequestSchema = z.object({
  audience: requiredTrimmedString("Informe o publico do formulario.").max(MAX_FIELD_LENGTH),
  offer: requiredTrimmedString("Informe a oferta do formulario.").max(MAX_FIELD_LENGTH),
  region: requiredTrimmedString("Informe a regiao do formulario.").max(MAX_FIELD_LENGTH),
  differentiator: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  objections: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  contractType: z.string().trim().max(MAX_FIELD_LENGTH).optional()
});
const REQUIRED_TOPICS = [
  "empresa",
  "quantidade de vidas",
  "regiao",
  "prazo para cotacao ou implantacao",
  "melhor contato"
];
const PROHIBITED_QUESTION_PATTERNS = [
  /doenc/i,
  /diagn[oó]stic/i,
  /hist[oó]rico m[eé]dico/i,
  /tratamento/i,
  /medica(?:mento|cao|ção)/i,
  /gestante/i,
  /gravidez/i,
  /idade/i,
  /idos[ao]s?/i,
  /defici[eê]ncia/i,
  /religiao|religião/i,
  /etnia/i,
  /genero|g[eê]nero/i,
  /renda pessoal/i
];

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-campaigns-questions",
      limit: 25,
      windowMs: 60 * 1000
    });
    const billingContext = await getBillingAuthContext();

    if (!billingContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const body = await parseJsonBody(request, questionsRequestSchema);
    const hasDifferentiator = Boolean(getOptionalString(body.differentiator));
    const input = parseQuestionsRequest(body);

    const { result, remainingCredits } = await runAiActionWithCredits({
      orgId: billingContext.organizationId,
      userId: billingContext.profileId,
      feature: "generate_campaign_questions",
      description: "Geracao de perguntas de campanha com IA",
      metadata: {
        route: "campaigns/questions",
        hasDifferentiator
      },
      generate: (apiKey) =>
        generateComplianceQuestions(
          {
            ...input,
            objective: `${input.objective ?? ""}; Corretora responsavel: ${billingContext.brokerageName}`
          },
          { apiKey }
        )
    });

    return NextResponse.json({
      questions: {
        ...result,
        questions: result.questions.map(reviewQuestionLocally)
      },
      aiBalance: remainingCredits
    });
  } catch (error) {
    const { message, status } = getQuestionsError(error);

    logApiError({
      route: "/api/campaigns/questions",
      operation: "GENERATE_CAMPAIGN_QUESTIONS",
      message,
      status,
      error
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function parseQuestionsRequest(body: z.infer<typeof questionsRequestSchema>): ComplianceQuestionsInput {
  const audience = body.audience;
  const offer = body.offer;
  const region = body.region;
  const differentiator = getOptionalString(body.differentiator);
  const objections = getOptionalString(body.objections);
  const contractType = getOptionalString(body.contractType);

  return {
    audience,
    product: DEFAULT_PRODUCT,
    objective: [
      "sugerir perguntas seguras para formulario Meta Lead Ads",
      `Oferta: ${offer}`,
      `Regiao: ${region}`,
      differentiator ? `Diferencial: ${differentiator}` : "",
      objections ? `Objecoes: ${objections}` : "",
      contractType ? `Tipo de contrato: ${contractType}` : ""
    ]
      .filter(Boolean)
      .join("; "),
    maxQuestions: 6,
    requiredTopics: REQUIRED_TOPICS
  };
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, MAX_FIELD_LENGTH)
    : "";
}

function reviewQuestionLocally(question: ComplianceQuestion): ComplianceQuestion {
  if (!PROHIBITED_QUESTION_PATTERNS.some((pattern) => pattern.test(question.question))) {
    return question;
  }

  return {
    ...question,
    reviewRequired: true,
    reviewReason:
      question.reviewReason ||
      "Revisao local: a pergunta contem termo sensivel e deve ser reescrita antes de publicar."
  };
}

function getQuestionsError(error: unknown) {
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
    message: "Nao foi possivel gerar perguntas. Revise os dados e tente novamente.",
    status: 400
  };
}

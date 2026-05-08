import { NextResponse } from "next/server";
import {
  generateComplianceQuestions,
  LeadHealthOpenAIError,
  type ComplianceQuestionsInput,
  type ComplianceQuestionsOutput
} from "@/lib/openai";
import { resolveOpenAIKeyForOrganization } from "@/lib/integrations/repository.server";
import { getBillingAuthContext } from "@/lib/billing/auth.server";

type QuestionsRequestBody = {
  audience?: unknown;
  offer?: unknown;
  region?: unknown;
  differentiator?: unknown;
};

type ComplianceQuestion = ComplianceQuestionsOutput["questions"][number];

const MAX_FIELD_LENGTH = 280;
const DEFAULT_PRODUCT = "Plano de saude empresarial";
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
    const body = (await request.json()) as QuestionsRequestBody;
    const input = parseQuestionsRequest(body);
    const billingContext = await getBillingAuthContext();

    if (!billingContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const openAIKey = await resolveOpenAIKeyForOrganization(billingContext.organizationId);

    if (!openAIKey) {
      return NextResponse.json(
        {
          error:
            "Conecte sua chave OpenAI no Perfil para gerar perguntas com IA usando a conta da sua organizacao."
        },
        { status: 400 }
      );
    }

    const result = await generateComplianceQuestions({
      ...input,
      objective: `${input.objective ?? ""}; Corretora responsavel: ${billingContext.brokerageName}`
    }, { apiKey: openAIKey });

    return NextResponse.json({
      questions: {
        ...result,
        questions: result.questions.map(reviewQuestionLocally)
      }
    });
  } catch (error) {
    const { message, status } = getQuestionsError(error);

    return NextResponse.json({ error: message }, { status });
  }
}

function parseQuestionsRequest(body: QuestionsRequestBody): ComplianceQuestionsInput {
  const audience = getRequiredString(body.audience, "Informe o publico do formulario.");
  const offer = getRequiredString(body.offer, "Informe a oferta do formulario.");
  const region = getRequiredString(body.region, "Informe a regiao do formulario.");
  const differentiator = getOptionalString(body.differentiator);

  return {
    audience,
    product: DEFAULT_PRODUCT,
    objective: [
      "sugerir perguntas seguras para formulario Meta Lead Ads",
      `Oferta: ${offer}`,
      `Regiao: ${region}`,
      differentiator ? `Diferencial: ${differentiator}` : ""
    ]
      .filter(Boolean)
      .join("; "),
    maxQuestions: 6,
    requiredTopics: REQUIRED_TOPICS
  };
}

function getRequiredString(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim().slice(0, MAX_FIELD_LENGTH);
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
  if (error instanceof LeadHealthOpenAIError) {
    return {
      message: error.message,
      status: error.code === "missing_api_key" ? 400 : 502
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

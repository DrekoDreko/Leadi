import "server-only";

import { getServerEnv } from "@/lib/env/server";
import {
  buildCampaignTextPrompt,
  buildComplianceQuestionsPrompt,
  buildComplianceReviewPrompt,
  buildWhatsAppMessagePrompt,
  leadHealthBaseInstructions
} from "@/lib/openai/prompt-playbooks";

type JsonSchema = Record<string, unknown>;

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      refusal?: string;
      text?: string;
      type?: string;
    }>;
    type?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

export class LeadHealthOpenAIError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "missing_api_key"
      | "request_failed"
      | "empty_response"
      | "invalid_response"
  ) {
    super(message);
    this.name = "LeadHealthOpenAIError";
  }
}

export type CampaignTextInput = {
  audience: string;
  product: string;
  brokerageName?: string;
  objective?: string;
  offer?: string;
  region?: string;
  channel?: "meta_ads" | "landing_page" | "email" | "other";
  tone?: string;
  constraints?: string[];
};

export type OpenAIRequestOptions = {
  apiKey?: string | null;
};

export type CampaignTextOutput = {
  campaignName: string;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
  suggestedAudience: string;
  variants: string[];
  complianceNotes: string[];
};

export type ComplianceQuestionsInput = {
  audience: string;
  product: string;
  objective?: string;
  maxQuestions?: number;
  requiredTopics?: string[];
};

export type ComplianceQuestionsOutput = {
  questions: Array<{
    question: string;
    reason: string;
    answerType: "short_text" | "single_choice" | "multiple_choice" | "number";
    reviewRequired: boolean;
    reviewReason: string;
  }>;
  complianceNotes: string[];
};

export type WhatsAppMessageInput = {
  product: string;
  brokerageName?: string;
  leadName?: string;
  leadContext?: string;
  stage?:
    | "new"
    | "qualification"
    | "proposal"
    | "negotiation"
    | "won"
    | "lost"
    | "new_lead"
    | "first_contact"
    | "awaiting_response"
    | "closing"
    | "post_service";
  objective?: string;
  tone?: string;
};

export type WhatsAppMessageOutput = {
  openingMessage: string;
  followUpMessage: string;
  objectionReply: string;
  complianceNotes: string[];
};

export type ComplianceReviewInput = {
  text: string;
  channel?: "meta_ads" | "lead_form" | "landing_page" | "whatsapp" | "other";
  audience?: string;
  objective?: string;
};

export type ComplianceReviewOutput = {
  riskLevel: "low" | "medium" | "high";
  reasons: Array<{
    title: string;
    detail: string;
    severity: "low" | "medium" | "high";
  }>;
  suggestions: string[];
  rewrittenText: string;
  disclaimer: string;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4o-mini";

export async function generateCampaignText(
  input: CampaignTextInput,
  options?: OpenAIRequestOptions
): Promise<CampaignTextOutput> {
  return generateStructuredOutput<CampaignTextOutput>({
    schemaName: "leadhealth_campaign_text",
    schema: campaignTextSchema,
    maxOutputTokens: 900,
    userPrompt: buildCampaignTextPrompt(input),
    apiKey: options?.apiKey
  });
}

export async function generateComplianceQuestions(
  input: ComplianceQuestionsInput,
  options?: OpenAIRequestOptions
): Promise<ComplianceQuestionsOutput> {
  const maxQuestions = clampInteger(input.maxQuestions ?? 6, 3, 10);

  return generateStructuredOutput<ComplianceQuestionsOutput>({
    schemaName: "leadhealth_compliance_questions",
    schema: complianceQuestionsSchema,
    maxOutputTokens: 900,
    userPrompt: buildComplianceQuestionsPrompt({
      ...input,
      maxQuestions
    }),
    apiKey: options?.apiKey
  });
}

export async function generateWhatsAppMessage(
  input: WhatsAppMessageInput,
  options?: OpenAIRequestOptions
): Promise<WhatsAppMessageOutput> {
  const stage = input.stage ?? "new";

  return generateStructuredOutput<WhatsAppMessageOutput>({
    schemaName: "leadhealth_whatsapp_message",
    schema: whatsAppMessageSchema,
    maxOutputTokens: 700,
    userPrompt: buildWhatsAppMessagePrompt({
      ...input,
      stage
    }),
    apiKey: options?.apiKey
  });
}

export async function reviewComplianceText(
  input: ComplianceReviewInput,
  options?: OpenAIRequestOptions
): Promise<ComplianceReviewOutput> {
  return generateStructuredOutput<ComplianceReviewOutput>({
    schemaName: "leadhealth_compliance_review",
    schema: complianceReviewSchema,
    maxOutputTokens: 900,
    userPrompt: buildComplianceReviewPrompt(input),
    apiKey: options?.apiKey
  });
}

async function generateStructuredOutput<T>({
  apiKey,
  maxOutputTokens,
  schema,
  schemaName,
  userPrompt
}: {
  apiKey?: string | null;
  maxOutputTokens: number;
  schema: JsonSchema;
  schemaName: string;
  userPrompt: string;
}): Promise<T> {
  const resolvedApiKey = getOpenAIApiKey(apiKey);
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resolvedApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      instructions: leadHealthBaseInstructions,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userPrompt
            }
          ]
        }
      ],
      max_output_tokens: maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema,
          strict: true
        },
        verbosity: "medium"
      }
    })
  });

  const payload = (await response.json().catch(() => null)) as OpenAIResponsePayload | null;

  if (!response.ok) {
    throw new LeadHealthOpenAIError(
      getRequestErrorMessage(response.status, payload),
      "request_failed"
    );
  }

  const outputText = extractOutputText(payload);

  try {
    return JSON.parse(outputText) as T;
  } catch {
    throw new LeadHealthOpenAIError(
      "A IA respondeu em um formato inesperado. Tente novamente em instantes.",
      "invalid_response"
    );
  }
}

function getOpenAIApiKey(override?: string | null) {
  const normalizedOverride = override?.trim();

  if (normalizedOverride) {
    return normalizedOverride;
  }

  throw new LeadHealthOpenAIError(
    "Nenhuma chave OpenAI conectada foi encontrada. Cadastre sua chave OpenAI na area Empresa para usar este recurso.",
    "missing_api_key"
  );
}

function getOpenAIModel() {
  return getServerEnv("OPENAI_MODEL") || DEFAULT_MODEL;
}

function extractOutputText(payload: OpenAIResponsePayload | null) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const text = payload?.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => {
      if (content.refusal) {
        throw new LeadHealthOpenAIError(
          "A IA recusou a solicitacao. Ajuste o contexto e tente novamente.",
          "empty_response"
        );
      }

      return content.text ?? "";
    })
    .join("")
    .trim();

  if (!text) {
    throw new LeadHealthOpenAIError(
      "A IA nao retornou conteudo. Tente novamente em instantes.",
      "empty_response"
    );
  }

  return text;
}

function getRequestErrorMessage(status: number, payload: OpenAIResponsePayload | null) {
  if (status === 401) {
    return "A chave da OpenAI parece invalida ou sem permissao. Verifique a chave conectada na area Empresa ou no servidor.";
  }

  if (status === 429) {
    const errorMessage = payload?.error?.message?.toLowerCase() ?? "";

    if (errorMessage.includes("quota") || errorMessage.includes("billing") || errorMessage.includes("credit")) {
      return "A conta atingiu a cota mensal ou ficou sem credito. Verifique Billing e Usage Limits na OpenAI.";
    }

    return "A OpenAI limitou temporariamente as chamadas. Aguarde alguns instantes e tente novamente.";
  }

  if (status >= 500) {
    return "A OpenAI esta temporariamente indisponivel. Tente novamente em instantes.";
  }

  return payload?.error?.message
    ? `Nao foi possivel gerar o texto com IA: ${payload.error.message}`
    : "Nao foi possivel gerar o texto com IA. Revise os dados e tente novamente.";
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.trunc(value), min), max);
}

const campaignTextSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    campaignName: { type: "string" },
    primaryText: { type: "string" },
    headline: { type: "string" },
    description: { type: "string" },
    callToAction: { type: "string" },
    suggestedAudience: { type: "string" },
    variants: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" }
    },
    complianceNotes: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" }
    }
  },
  required: [
    "campaignName",
    "primaryText",
    "headline",
    "description",
    "callToAction",
    "suggestedAudience",
    "variants",
    "complianceNotes"
  ]
} satisfies JsonSchema;

const complianceQuestionsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      minItems: 3,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          reason: { type: "string" },
          answerType: {
            type: "string",
            enum: ["short_text", "single_choice", "multiple_choice", "number"]
          },
          reviewRequired: { type: "boolean" },
          reviewReason: { type: "string" }
        },
        required: ["question", "reason", "answerType", "reviewRequired", "reviewReason"]
      }
    },
    complianceNotes: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" }
    }
  },
  required: ["questions", "complianceNotes"]
} satisfies JsonSchema;

const whatsAppMessageSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    openingMessage: { type: "string" },
    followUpMessage: { type: "string" },
    objectionReply: { type: "string" },
    complianceNotes: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" }
    }
  },
  required: ["openingMessage", "followUpMessage", "objectionReply", "complianceNotes"]
} satisfies JsonSchema;

const complianceReviewSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    riskLevel: {
      type: "string",
      enum: ["low", "medium", "high"]
    },
    reasons: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"]
          }
        },
        required: ["title", "detail", "severity"]
      }
    },
    suggestions: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" }
    },
    rewrittenText: { type: "string" },
    disclaimer: { type: "string" }
  },
  required: ["riskLevel", "reasons", "suggestions", "rewrittenText", "disclaimer"]
} satisfies JsonSchema;

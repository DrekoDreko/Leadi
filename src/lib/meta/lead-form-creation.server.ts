import "server-only";

import { getMetaGraphApiVersion } from "@/lib/meta/config";
import {
  getMetaConnectionForOrganization,
  resolveMetaAccessTokenForOrganization,
  saveMetaFormsForPages
} from "@/lib/integrations/repository.server";

// Campos pré-definidos do builder simples. Cada um mapeia direto para um tipo de
// pergunta padrão da Meta (prefill), alinhado ao mapeamento de leads em
// lead-retrieval.server.ts (nome, telefone, email, cidade).
export const LEAD_FORM_FIELDS = ["full_name", "email", "phone", "city"] as const;
export type LeadFormField = (typeof LEAD_FORM_FIELDS)[number];

const FIELD_TO_META_QUESTION: Record<LeadFormField, string> = {
  full_name: "FULL_NAME",
  email: "EMAIL",
  phone: "PHONE",
  city: "CITY"
};

export type CreateLeadFormResult = {
  formId: string;
  name: string;
};

type MetaPageTokenResponse = {
  id?: string;
  name?: string;
  access_token?: string;
  error?: { message?: string };
};

type MetaLeadFormCreateResponse = {
  id?: string;
  error?: { message?: string; error_user_msg?: string; error_subcode?: number };
};

function metaErrorMessage(
  context: string,
  payload: { error?: { message?: string; error_user_msg?: string; error_subcode?: number } } | null,
  statusCode: number
): string {
  const metaError = payload?.error;
  const detail = metaError?.error_user_msg || metaError?.message;
  const suffix = metaError?.error_subcode ? ` (subcode: ${metaError.error_subcode})` : "";
  return detail ? `${context}: ${detail}${suffix}` : `${context}: status ${statusCode}.`;
}

// Resolve o page access token (necessário para criar formulários de lead). Não é
// persistido no banco, então buscamos fresco a partir do token do usuário.
async function fetchPageAccessToken(
  userAccessToken: string,
  metaPageId: string
): Promise<{ token: string; name: string }> {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/${metaPageId}`
  );
  url.searchParams.set("fields", "id,name,access_token");
  url.searchParams.set("access_token", userAccessToken);

  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as MetaPageTokenResponse | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      metaErrorMessage("Falha ao obter o token da página na Meta", payload, response.status)
    );
  }

  return { token: payload.access_token, name: payload.name?.trim() || "Página Meta" };
}

export async function createMetaLeadForm(input: {
  organizationId: string;
  metaPageId: string;
  name: string;
  fields: LeadFormField[];
  privacyPolicyUrl: string;
  followUpUrl?: string | null;
  thankYouMessage?: string | null;
}): Promise<CreateLeadFormResult> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error("Informe um nome para o formulário.");
  }

  const fields = input.fields.filter((field) => LEAD_FORM_FIELDS.includes(field));
  if (fields.length === 0) {
    throw new Error("Selecione ao menos um campo para o formulário.");
  }

  const userAccessToken = await resolveMetaAccessTokenForOrganization(input.organizationId);
  if (!userAccessToken) {
    throw new Error("A conexão Meta não possui um access token válido.");
  }

  const connection = await getMetaConnectionForOrganization(input.organizationId);
  if (!connection) {
    throw new Error("Conexão Meta não encontrada para esta organização.");
  }

  const page = await fetchPageAccessToken(userAccessToken, input.metaPageId);

  const questions = fields.map((field) => ({ type: FIELD_TO_META_QUESTION[field] }));

  const body = new URLSearchParams();
  body.set("name", trimmedName);
  body.set("locale", "PT_BR");
  body.set("questions", JSON.stringify(questions));
  body.set(
    "privacy_policy",
    JSON.stringify({ url: input.privacyPolicyUrl, link_text: "Política de Privacidade" })
  );

  if (input.followUpUrl) {
    body.set("follow_up_action_url", input.followUpUrl);
  }

  const thankYou = input.thankYouMessage?.trim();
  if (thankYou) {
    body.set(
      "thank_you_page",
      JSON.stringify({ title: "Obrigado!", body: thankYou, button_type: "NONE" })
    );
  }

  body.set("access_token", page.token);

  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/${input.metaPageId}/leadgen_forms`
  );

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as MetaLeadFormCreateResponse | null;

  if (!response.ok || !payload?.id) {
    throw new Error(
      metaErrorMessage("Falha ao criar o formulário na Meta", payload, response.status)
    );
  }

  // Persiste o formulário localmente para aparecer no seletor do gerador de
  // campanhas. Best-effort: se falhar o registro, o formulário já existe na Meta.
  try {
    await saveMetaFormsForPages({
      organizationId: input.organizationId,
      connectedAccountId: connection.id,
      forms: [
        {
          pageConnectionId: input.metaPageId,
          pageId: input.metaPageId,
          pageName: page.name,
          metaFormId: payload.id,
          name: trimmedName,
          status: "connected"
        }
      ]
    });
  } catch (error) {
    console.error("Formulário criado na Meta, mas falhou ao registrar localmente.", error);
  }

  return { formId: payload.id, name: trimmedName };
}

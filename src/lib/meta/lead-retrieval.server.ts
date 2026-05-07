import { getMetaGraphApiVersion } from "@/lib/meta/config";

const META_LEAD_FIELDS = [
  "id",
  "created_time",
  "ad_id",
  "ad_name",
  "adset_id",
  "adset_name",
  "campaign_id",
  "campaign_name",
  "form_id",
  "is_organic",
  "platform",
  "field_data"
] as const;

const META_RATE_LIMIT_ERROR_CODES = new Set([4, 17, 32, 613, 80004, 130429]);

type MetaGraphErrorPayload = {
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
  is_transient?: boolean;
  message?: string;
  type?: string;
};

export type MetaLeadFieldDataEntry = {
  name: string;
  values: string[];
};

export type MetaLeadRecord = {
  id: string;
  created_time: string | null;
  ad_id: string | null;
  ad_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  form_id: string | null;
  is_organic: boolean | null;
  platform: string | null;
  field_data: MetaLeadFieldDataEntry[];
};

export type MetaLeadMappedPayload = {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  company_name?: string;
  lives_count?: number;
  budget?: string;
  interest?: string;
  notes?: string;
  source_campaign?: string;
  source_adset?: string;
  source_ad?: string;
  meta_lead_id: string;
  meta_form_id?: string;
  meta_page_id?: string;
  meta_campaign_id?: string;
  meta_adset_id?: string;
  meta_ad_id?: string;
  raw_payload: {
    meta_lead: MetaLeadRecord;
    normalized_field_data: Record<string, string[]>;
    unmapped_field_data: MetaLeadFieldDataEntry[];
  };
};

export class MetaLeadRetrievalError extends Error {
  readonly status: number | null;
  readonly code: number | null;
  readonly subcode: number | null;
  readonly fbTraceId: string | null;
  readonly isTransient: boolean;
  readonly isRateLimit: boolean;

  constructor(
    message: string,
    options?: {
      status?: number | null;
      code?: number | null;
      subcode?: number | null;
      fbTraceId?: string | null;
      isTransient?: boolean;
      isRateLimit?: boolean;
    }
  ) {
    super(message);
    this.name = "MetaLeadRetrievalError";
    this.status = options?.status ?? null;
    this.code = options?.code ?? null;
    this.subcode = options?.subcode ?? null;
    this.fbTraceId = options?.fbTraceId ?? null;
    this.isTransient = options?.isTransient ?? false;
    this.isRateLimit = options?.isRateLimit ?? false;
  }
}

export async function fetchMetaLeadById(input: {
  leadgenId: string;
  accessToken?: string;
  graphApiVersion?: string;
  signal?: AbortSignal;
}): Promise<MetaLeadRecord> {
  const leadgenId = input.leadgenId.trim();
  if (!leadgenId) {
    throw new MetaLeadRetrievalError("Informe um leadgen_id valido.");
  }

  const accessToken = input.accessToken?.trim();
  if (!accessToken) {
    throw new MetaLeadRetrievalError(
      "Token da conta Meta conectada nao informado. Sincronize a conta da organizacao na area Empresa."
    );
  }

  const graphApiVersion = input.graphApiVersion?.trim() || getMetaGraphApiVersion();
  const requestUrl = new URL(`https://graph.facebook.com/${graphApiVersion}/${leadgenId}`);
  requestUrl.searchParams.set("fields", META_LEAD_FIELDS.join(","));
  requestUrl.searchParams.set("access_token", accessToken);

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      method: "GET",
      cache: "no-store",
      signal: input.signal
    });
  } catch (error) {
    throw new MetaLeadRetrievalError(
      error instanceof Error && error.message
        ? `Falha ao conectar na Meta Graph API: ${error.message}`
        : "Falha ao conectar na Meta Graph API."
    );
  }

  const body = (await parseJsonResponse(response)) as
    | { error?: MetaGraphErrorPayload }
    | Record<string, unknown>;

  if (!response.ok || isGraphApiError(body)) {
    throw buildMetaGraphApiError(response.status, body);
  }

  return parseMetaLeadRecord(body);
}

export async function fetchAndMapMetaLeadById(input: {
  leadgenId: string;
  accessToken?: string;
  graphApiVersion?: string;
  signal?: AbortSignal;
}): Promise<MetaLeadMappedPayload> {
  const metaLead = await fetchMetaLeadById(input);
  return mapMetaLeadToLeadPayload(metaLead);
}

export function mapMetaLeadToLeadPayload(metaLead: MetaLeadRecord): MetaLeadMappedPayload {
  const normalizedFieldData = normalizeMetaFieldData(metaLead.field_data);

  const name =
    getFirstFieldValue(normalizedFieldData, [
      "full_name",
      "full_name_first_last",
      "nome_completo",
      "nome"
    ]) ??
    joinTruthyValues([
      getFirstFieldValue(normalizedFieldData, ["first_name", "primeiro_nome"]),
      getFirstFieldValue(normalizedFieldData, ["last_name", "sobrenome"])
    ]);

  if (!name) {
    throw new MetaLeadRetrievalError(
      "O lead da Meta nao trouxe um campo de nome reconhecivel em field_data."
    );
  }

  const mappedNames = new Set(
    [
      "full_name",
      "full_name_first_last",
      "nome_completo",
      "nome",
      "first_name",
      "primeiro_nome",
      "last_name",
      "sobrenome",
      "phone_number",
      "phone",
      "telefone",
      "celular",
      "whatsapp",
      "email",
      "email_address",
      "city",
      "cidade",
      "municipio",
      "company_name",
      "company",
      "empresa",
      "lives_count",
      "lives",
      "quantidade_vidas",
      "beneficiarios",
      "employees",
      "number_of_employees",
      "orcamento",
      "budget",
      "interesse",
      "interest",
      "mensagem",
      "message",
      "observacoes",
      "notes"
    ].map(normalizeMetaFieldName)
  );

  const unmappedFieldData = metaLead.field_data.filter(
    (field) => !mappedNames.has(normalizeMetaFieldName(field.name))
  );

  const notesParts = [
    getFirstFieldValue(normalizedFieldData, ["mensagem", "message", "observacoes", "notes"]),
    unmappedFieldData.length > 0
      ? `Campos extras Meta: ${unmappedFieldData
          .map((field) => `${field.name}: ${field.values.join(", ")}`)
          .join(" | ")}`
      : null
  ];

  return removeUndefinedValues({
    name,
    phone: getFirstFieldValue(normalizedFieldData, [
      "phone_number",
      "phone",
      "telefone",
      "celular",
      "whatsapp"
    ]),
    email: getFirstFieldValue(normalizedFieldData, ["email", "email_address"]),
    city: getFirstFieldValue(normalizedFieldData, ["city", "cidade", "municipio"]),
    company_name: getFirstFieldValue(normalizedFieldData, ["company_name", "company", "empresa"]),
    lives_count: parseLeadCount(
      getFirstFieldValue(normalizedFieldData, [
        "lives_count",
        "lives",
        "quantidade_vidas",
        "beneficiarios",
        "employees",
        "number_of_employees"
      ])
    ),
    budget: getFirstFieldValue(normalizedFieldData, ["orcamento", "budget"]),
    interest: getFirstFieldValue(normalizedFieldData, ["interesse", "interest"]),
    notes: joinTruthyValues(notesParts, "\n"),
    source_campaign: metaLead.campaign_name ?? metaLead.campaign_id ?? undefined,
    source_adset: metaLead.adset_name ?? metaLead.adset_id ?? undefined,
    source_ad: metaLead.ad_name ?? metaLead.ad_id ?? undefined,
    meta_lead_id: metaLead.id,
    meta_form_id: metaLead.form_id ?? undefined,
    meta_campaign_id: metaLead.campaign_id ?? undefined,
    meta_adset_id: metaLead.adset_id ?? undefined,
    meta_ad_id: metaLead.ad_id ?? undefined,
    raw_payload: {
      meta_lead: metaLead,
      normalized_field_data: normalizedFieldData,
      unmapped_field_data: unmappedFieldData
    }
  });
}

function parseMetaLeadRecord(value: unknown): MetaLeadRecord {
  if (!isRecord(value)) {
    throw new MetaLeadRetrievalError("Resposta invalida da Meta Graph API para o lead.");
  }

  const leadId = getRequiredString(value.id, "id");
  const fieldData = Array.isArray(value.field_data) ? value.field_data : [];

  return {
    id: leadId,
    created_time: getOptionalString(value.created_time),
    ad_id: getOptionalString(value.ad_id),
    ad_name: getOptionalString(value.ad_name),
    adset_id: getOptionalString(value.adset_id),
    adset_name: getOptionalString(value.adset_name),
    campaign_id: getOptionalString(value.campaign_id),
    campaign_name: getOptionalString(value.campaign_name),
    form_id: getOptionalString(value.form_id),
    is_organic: typeof value.is_organic === "boolean" ? value.is_organic : null,
    platform: getOptionalString(value.platform),
    field_data: fieldData.flatMap((field, index) => {
      try {
        return [parseMetaLeadFieldData(field, index)];
      } catch {
        return [];
      }
    })
  };
}

function parseMetaLeadFieldData(value: unknown, index: number): MetaLeadFieldDataEntry {
  if (!isRecord(value)) {
    throw new MetaLeadRetrievalError(
      `Resposta invalida da Meta Graph API. field_data[${index}] deve ser objeto.`
    );
  }

  const name = getRequiredString(value.name, `field_data[${index}].name`);
  const rawValues = Array.isArray(value.values) ? value.values : [];
  const values = rawValues
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (typeof item === "number" || typeof item === "bigint") {
        return String(item);
      }

      return "";
    })
    .filter(Boolean);

  return { name, values };
}

function normalizeMetaFieldData(fieldData: MetaLeadFieldDataEntry[]) {
  return Object.fromEntries(
    fieldData.map((field) => [normalizeMetaFieldName(field.name), field.values])
  );
}

function getFirstFieldValue(
  normalizedFieldData: Record<string, string[]>,
  fieldNames: string[]
) {
  for (const fieldName of fieldNames) {
    const value = normalizedFieldData[normalizeMetaFieldName(fieldName)]?.[0]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function parseLeadCount(value?: string) {
  if (!value) {
    return undefined;
  }

  const matchedDigits = value.match(/\d+/g);
  if (!matchedDigits) {
    return undefined;
  }

  const normalizedValue = Number(matchedDigits.join(""));
  return Number.isFinite(normalizedValue) ? normalizedValue : undefined;
}

function normalizeMetaFieldName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function joinTruthyValues(values: Array<string | null | undefined>, separator = " ") {
  const filteredValues = values.map((value) => value?.trim()).filter(Boolean);
  return filteredValues.length > 0 ? filteredValues.join(separator) : undefined;
}

function removeUndefinedValues<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  ) as T;
}

function buildMetaGraphApiError(status: number, body: unknown) {
  const graphError = isGraphApiError(body) ? body.error : undefined;
  const code = graphError?.code ?? null;
  const subcode = graphError?.error_subcode ?? null;
  const fbTraceId = graphError?.fbtrace_id ?? null;
  const isRateLimit = status === 429 || (code !== null && META_RATE_LIMIT_ERROR_CODES.has(code));

  if (isRateLimit) {
    return new MetaLeadRetrievalError(
      "A Meta Graph API atingiu limite de requisicoes para buscar leads. Tente novamente em instantes.",
      {
        status,
        code,
        subcode,
        fbTraceId,
        isTransient: graphError?.is_transient ?? true,
        isRateLimit: true
      }
    );
  }

  if (status === 401 || status === 403 || code === 190 || code === 10 || code === 200) {
    return new MetaLeadRetrievalError(
      `Token da Meta invalido ou sem permissao para recuperar leads. ${formatGraphErrorContext(graphError)}`,
      {
        status,
        code,
        subcode,
        fbTraceId,
        isTransient: graphError?.is_transient ?? false,
        isRateLimit: false
      }
    );
  }

  if (status === 404 || code === 803 || code === 100) {
    return new MetaLeadRetrievalError(
      `Lead ${getGraphLeadReference(body)} nao encontrado na Meta Graph API. ${formatGraphErrorContext(graphError)}`,
      {
        status,
        code,
        subcode,
        fbTraceId,
        isTransient: graphError?.is_transient ?? false,
        isRateLimit: false
      }
    );
  }

  return new MetaLeadRetrievalError(
    `Falha ao buscar lead na Meta Graph API. ${formatGraphErrorContext(graphError)}`,
    {
      status,
      code,
      subcode,
      fbTraceId,
      isTransient: graphError?.is_transient ?? false,
      isRateLimit
    }
  );
}

function getGraphLeadReference(body: unknown) {
  if (isRecord(body) && typeof body.id === "string" && body.id.trim()) {
    return body.id.trim();
  }

  return "informado";
}

function formatGraphErrorContext(error?: MetaGraphErrorPayload) {
  if (!error) {
    return "Sem detalhes adicionais retornados pela Meta.";
  }

  const parts = [
    error.message?.trim(),
    error.code ? `code ${error.code}` : null,
    error.error_subcode ? `subcode ${error.error_subcode}` : null,
    error.fbtrace_id ? `trace ${error.fbtrace_id}` : null
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "Sem detalhes adicionais retornados pela Meta.";
}

async function parseJsonResponse(response: Response) {
  const rawBody = await response.text();
  if (!rawBody.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new MetaLeadRetrievalError(
      `Meta Graph API retornou JSON invalido com status ${response.status}.`
    );
  }
}

function isGraphApiError(value: unknown): value is { error: MetaGraphErrorPayload } {
  return isRecord(value) && isRecord(value.error);
}

function getRequiredString(value: unknown, fieldName: string) {
  const normalizedValue = getOptionalString(value);
  if (!normalizedValue) {
    throw new MetaLeadRetrievalError(`Resposta da Meta sem ${fieldName}.`);
  }

  return normalizedValue;
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

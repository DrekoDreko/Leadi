export type LeadImportFieldKey =
  | "name"
  | "email"
  | "phone"
  | "city"
  | "estado"
  | "source"
  | "interest"
  | "notes";

export type LeadImportMapping = Record<LeadImportFieldKey, string>;

export type ParsedCsvFile = {
  delimiter: string;
  headers: string[];
  rows: string[][];
};

export type LeadImportFieldMeta = {
  key: LeadImportFieldKey;
  label: string;
  required?: boolean;
  helpText: string;
};

export const FIXED_CSV_SOURCE_VALUE = "__fixed_csv_import__";
export const FIXED_META_SOURCE_VALUE = "__fixed_meta_lead_ads__";

export const leadImportFieldMeta: LeadImportFieldMeta[] = [
  { key: "name", label: "Nome", required: true, helpText: "Nome do lead ou contato principal." },
  { key: "email", label: "Email", helpText: "Email do contato, se existir." },
  { key: "phone", label: "Telefone", helpText: "Telefone ou WhatsApp com DDD." },
  { key: "city", label: "Cidade", helpText: "Cidade do lead." },
  { key: "estado", label: "Estado", helpText: "Estado (UF) do lead." },
  {
    key: "source",
    label: "Origem",
    helpText: "Origem comercial do lead. CSV comum vira CSV importado; exportacoes do Meta sao sugeridas automaticamente."
  },
  { key: "interest", label: "Interesse", helpText: "Produto, plano ou necessidade principal." },
  { key: "notes", label: "Observações", helpText: "Contexto adicional ou observações." }
];

const delimiterCandidates = [",", ";", "\t", "|"] as const;

export function parseCsvText(input: string): ParsedCsvFile {
  const normalizedInput = input.replace(/^\uFEFF/, "");
  const delimiter = detectCsvDelimiter(normalizedInput);
  const rows = parseDelimitedRows(normalizedInput, delimiter).filter((row) =>
    row.some((value) => value.trim().length > 0)
  );

  const [headerRow = [] as string[], ...bodyRows] = rows;

  return {
    delimiter,
    headers: headerRow.map((header) => header.trim()),
    rows: bodyRows.map((row) => alignRowToHeaders(row, headerRow.length))
  };
}

export function buildSuggestedLeadImportMapping(headers: string[]): LeadImportMapping {
  const looksLikeMetaLeadAdsExport = isLikelyMetaLeadAdsExport(headers);

  return {
    name: findBestMatchingHeader(headers, [
      "nome completo",
      "full name",
      "nome",
      "name",
      "lead",
      "contato",
      "cliente",
      "first name",
      "last name"
    ]),
    email: findBestMatchingHeader(headers, [
      "email",
      "e mail",
      "e-mail",
      "email address",
      "mail address"
    ]),
    phone: findBestMatchingHeader(
      headers,
      [
        "telefone celular",
        "phone number",
        "mobile phone",
        "telefone",
        "celular",
        "whatsapp",
        "phone",
        "mobile",
        "tel",
        "contato"
      ]
    ),
    city: findBestMatchingHeader(headers, [
      "cidade",
      "city",
      "municipio",
      "localidade",
      "location"
    ]),
    estado: findBestMatchingHeader(headers, [
      "estado",
      "state",
      "uf"
    ]),
    source: looksLikeMetaLeadAdsExport
      ? FIXED_META_SOURCE_VALUE
      : FIXED_CSV_SOURCE_VALUE,
    interest: findBestMatchingHeader(headers, [
      "interesse",
      "interest",
      "produto",
      "plano",
      "necessidade",
      "objetivo",
      "o que procura",
      "what are you looking for",
      "quantidade de vidas",
      "numero de vidas",
      "número de vidas",
      "vidas"
    ]),
    notes: findBestMatchingHeader(
      headers,
      [
        "observacoes",
        "observação",
        "notes",
        "comentario",
        "comentário",
        "remarks",
        "message",
        "mensagem",
        "response",
        "resposta"
      ]
    )
  };
}

export function normalizeCsvHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isLikelyMetaLeadAdsExport(headers: string[]) {
  const normalizedHeaders = headers.map((header) => normalizeCsvHeader(header));

  const hasMetaMetadata = normalizedHeaders.some((header) =>
    metaLeadAdsMetadataKeywords.some((keyword) => headerMatchesKeyword(header, keyword))
  );

  const hasLeadContactFields = normalizedHeaders.some((header) =>
    metaLeadAdsContactKeywords.some((keyword) => headerMatchesKeyword(header, keyword))
  );

  return hasMetaMetadata && hasLeadContactFields;
}

const metaLeadAdsMetadataKeywords = [
  "created time",
  "creation time",
  "submission time",
  "lead id",
  "form name",
  "lead form",
  "ad name",
  "ad set name",
  "campaign name",
  "page name",
  "facebook",
  "meta"
];

const metaLeadAdsContactKeywords = [
  "nome completo",
  "full name",
  "first name",
  "last name",
  "email",
  "email address",
  "phone number",
  "mobile phone",
  "telefone",
  "celular",
  "whatsapp",
  "city",
  "cidade"
];

function detectCsvDelimiter(input: string) {
  const counts = new Map<string, number>(delimiterCandidates.map((candidate) => [candidate, 0]));
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      break;
    }

    if (!inQuotes && counts.has(char)) {
      counts.set(char, (counts.get(char) ?? 0) + 1);
    }
  }

  return (
    [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? ","
  );
}

function parseDelimitedRows(input: string, delimiter: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (inQuotes) {
      if (char === "\"") {
        if (nextChar === "\"") {
          currentField += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }

      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (char === "\r") {
      if (nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  currentRow.push(currentField);
  rows.push(currentRow);

  return rows;
}

function alignRowToHeaders(row: string[], headerLength: number) {
  if (row.length === headerLength) {
    return row;
  }

  if (row.length > headerLength) {
    return row.slice(0, headerLength);
  }

  return [...row, ...Array.from({ length: headerLength - row.length }, () => "")];
}

function findBestMatchingHeader(headers: string[], keywords: string[]) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeCsvHeader(header)
  }));

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeCsvHeader(keyword);
    const match = normalizedHeaders.find(
      ({ normalized }) =>
        normalized === normalizedKeyword ||
        normalized.includes(normalizedKeyword) ||
        normalizedKeyword.includes(normalized)
    );

    if (match) {
      return match.original;
    }
  }

  return "";
}

function headerMatchesKeyword(header: string, keyword: string) {
  const normalizedKeyword = normalizeCsvHeader(keyword);

  return (
    header === normalizedKeyword ||
    header.includes(normalizedKeyword) ||
    normalizedKeyword.includes(header)
  );
}

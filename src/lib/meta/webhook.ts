import { createHmac, timingSafeEqual } from "node:crypto";

export type MetaLeadgenChangeValue = Record<string, unknown> & {
  ad_id?: string;
  adgroup_id?: string;
  created_time?: number;
  form_id?: string;
  leadgen_id?: string;
  page_id?: string;
};

export type MetaLeadgenChange = {
  field: string;
  value: MetaLeadgenChangeValue;
};

export type MetaWebhookEntry = {
  changes: MetaLeadgenChange[];
  id: string | null;
  time: number | null;
};

export type MetaLeadgenEvent = {
  adId: string | null;
  adgroupId: string | null;
  createdTime: number | null;
  entryId: string | null;
  entryIndex: number;
  formId: string | null;
  leadgenId: string;
  pageId: string | null;
  rawChange: MetaLeadgenChange;
};

export type ParsedMetaWebhookPayload = {
  entry: MetaWebhookEntry[];
  leadgenEvents: MetaLeadgenEvent[];
  object: string;
};

export function parseMetaWebhookPayload(payload: unknown): ParsedMetaWebhookPayload {
  if (!isRecord(payload)) {
    throw new Error("Payload invalido. Envie um objeto JSON.");
  }

  if (typeof payload.object !== "string" || !payload.object.trim()) {
    throw new Error("Payload Meta invalido. Campo object ausente.");
  }

  if (!Array.isArray(payload.entry) || payload.entry.length === 0) {
    throw new Error("Payload Meta invalido. entry deve ser uma lista com itens.");
  }

  const entry = payload.entry.map((entryItem, entryIndex) =>
    parseMetaWebhookEntry(entryItem, entryIndex)
  );

  return {
    object: payload.object,
    entry,
    leadgenEvents: entry.flatMap((item, entryIndex) =>
      item.changes.flatMap((change) => {
        if (change.field !== "leadgen") {
          return [];
        }

        const leadgenId = getOptionalString(change.value.leadgen_id);
        if (!leadgenId) {
          return [];
        }

        return [
          {
            leadgenId,
            formId: getOptionalString(change.value.form_id),
            pageId: getOptionalString(change.value.page_id) ?? item.id,
            adId: getOptionalString(change.value.ad_id),
            adgroupId: getOptionalString(change.value.adgroup_id),
            createdTime:
              typeof change.value.created_time === "number" ? change.value.created_time : item.time,
            entryId: item.id,
            entryIndex,
            rawChange: change
          }
        ];
      })
    )
  };
}

export function getMetaWebhookSafeHeaders(request: Request) {
  const safeHeaderNames = [
    "accept",
    "content-type",
    "user-agent",
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
    "x-hub-signature-256"
  ];

  return Object.fromEntries(
    safeHeaderNames.flatMap((headerName) => {
      const value = request.headers.get(headerName);
      return value ? [[headerName, value]] : [];
    })
  );
}

export function validateMetaWebhookSignature(input: {
  appSecret: string;
  rawBody: string;
  signatureHeader: string | null;
}) {
  const signatureHeader = input.signatureHeader?.trim() ?? "";
  const appSecret = input.appSecret.trim();

  if (!appSecret) {
    throw new Error("META_APP_SECRET nao configurado.");
  }

  if (!signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const receivedSignature = signatureHeader.slice("sha256=".length).trim();
  if (!receivedSignature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", appSecret)
    .update(input.rawBody, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = toSignatureBuffer(receivedSignature);

  if (!receivedBuffer || receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function parseMetaWebhookEntry(value: unknown, entryIndex: number): MetaWebhookEntry {
  if (!isRecord(value)) {
    throw new Error(`Payload Meta invalido. entry[${entryIndex}] deve ser um objeto.`);
  }

  if (!Array.isArray(value.changes) || value.changes.length === 0) {
    throw new Error(`Payload Meta invalido. entry[${entryIndex}].changes deve ter itens.`);
  }

  return {
    id: getOptionalString(value.id),
    time: typeof value.time === "number" ? value.time : null,
    changes: value.changes.map((change, changeIndex) =>
      parseMetaWebhookChange(change, entryIndex, changeIndex)
    )
  };
}

function parseMetaWebhookChange(
  value: unknown,
  entryIndex: number,
  changeIndex: number
): MetaLeadgenChange {
  if (!isRecord(value)) {
    throw new Error(
      `Payload Meta invalido. entry[${entryIndex}].changes[${changeIndex}] deve ser um objeto.`
    );
  }

  if (typeof value.field !== "string" || !value.field.trim()) {
    throw new Error(
      `Payload Meta invalido. entry[${entryIndex}].changes[${changeIndex}].field ausente.`
    );
  }

  if (!isRecord(value.value)) {
    throw new Error(
      `Payload Meta invalido. entry[${entryIndex}].changes[${changeIndex}].value deve ser um objeto.`
    );
  }

  return {
    field: value.field,
    value: value.value
  };
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function toSignatureBuffer(value: string) {
  if (!/^[a-f0-9]+$/i.test(value) || value.length % 2 !== 0) {
    return null;
  }

  return Buffer.from(value, "hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

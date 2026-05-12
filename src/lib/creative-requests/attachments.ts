import type { Json } from "@/lib/supabase/database.types";
import type { CreativeRequestAttachmentItem } from "./types";
import { PAYLOAD_LIMITS } from "@/lib/payload-limits";

export const CREATIVE_REQUEST_ATTACHMENT_BUCKET = "creative-request-files";
export const CREATIVE_REQUEST_ATTACHMENT_MAX_SIZE_BYTES = PAYLOAD_LIMITS.ATTACHMENT;
export const CREATIVE_REQUEST_ATTACHMENT_ACCEPT =
  "image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,video/mp4,video/quicktime,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,.png,.jpg,.jpeg,.webp,.svg,.pdf,.mp4,.mov,.zip,.doc,.docx,.ppt,.pptx";

const ALLOWED_MIME_TYPES = new Set([
  "application/msword",
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "video/mp4",
  "video/quicktime"
]);

const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  mov: "video/quicktime",
  mp4: "video/mp4",
  pdf: "application/pdf",
  png: "image/png",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  svg: "image/svg+xml",
  webp: "image/webp",
  zip: "application/zip"
};

export function validateCreativeRequestAttachment(file: {
  name: string;
  size: number;
  type: string;
}) {
  if (!file.name.trim()) {
    return "Selecione um arquivo para anexar.";
  }

  if (file.size <= 0) {
    return "O arquivo selecionado esta vazio.";
  }

  if (file.size > CREATIVE_REQUEST_ATTACHMENT_MAX_SIZE_BYTES) {
    const limitMb = CREATIVE_REQUEST_ATTACHMENT_MAX_SIZE_BYTES / (1024 * 1024);
    return `Cada anexo pode ter no maximo ${limitMb} MB.`;
  }

  if (!resolveCreativeRequestAttachmentMimeType(file)) {
    return "Tipo de arquivo nao suportado. Use imagem, PDF, video curto, ZIP, DOCX ou PPTX.";
  }

  return "";
}

export function resolveCreativeRequestAttachmentMimeType(file: {
  name: string;
  type: string;
}) {
  const normalizedType = file.type.trim().toLowerCase();

  if (ALLOWED_MIME_TYPES.has(normalizedType)) {
    return normalizedType;
  }

  const extension = getFileExtension(file.name);

  if (!extension) {
    return "";
  }

  return EXTENSION_TO_MIME_TYPE[extension] ?? "";
}

export function sanitizeCreativeRequestAttachmentName(fileName: string) {
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "anexo";
}

export function normalizeCreativeRequestAttachments(value: Json): CreativeRequestAttachmentItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const attachment = entry as Record<string, unknown>;

    if (
      typeof attachment.id !== "string" ||
      typeof attachment.name !== "string" ||
      typeof attachment.path !== "string" ||
      typeof attachment.mimeType !== "string" ||
      typeof attachment.sizeBytes !== "number" ||
      typeof attachment.uploadedAt !== "string"
    ) {
      return [];
    }

    return [
      {
        id: attachment.id,
        name: attachment.name,
        path: attachment.path,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        uploadedAt: attachment.uploadedAt
      }
    ];
  });
}

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

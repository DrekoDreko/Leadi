/**
 * Validacao centralizada de uploads: tipo MIME (allowlist) e extensao segura.
 * Reaproveita validateFilePayloadSize de payload-limits para o tamanho.
 */

export class InvalidUploadTypeError extends Error {
  status = 415;

  constructor(message = "Tipo de arquivo nao permitido.") {
    super(message);
    this.name = "InvalidUploadTypeError";
  }
}

/**
 * Mapa explicito MIME -> extensao. Evita derivar a extensao a partir de
 * strings arbitrarias enviadas pelo cliente (que iriam parar no path do storage).
 */
const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "application/zip": "zip"
};

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Allowlists por contexto de upload.
 */
export const UPLOAD_ALLOWED_TYPES = {
  IMAGE: IMAGE_TYPES,
  // Anexos de pedidos de criacao: imagens, pdf, video e zip (briefings/referencias).
  ATTACHMENT: [
    ...IMAGE_TYPES,
    "image/gif",
    "application/pdf",
    "video/mp4",
    "application/zip"
  ]
} as const;

export type UploadKind = keyof typeof UPLOAD_ALLOWED_TYPES;

/**
 * Garante que o arquivo tem um MIME permitido para o contexto informado.
 * Lanca InvalidUploadTypeError (415) caso contrario.
 */
export function assertAllowedUploadType(file: { type: string }, kind: UploadKind) {
  const allowed = UPLOAD_ALLOWED_TYPES[kind] as readonly string[];

  if (!file.type || !allowed.includes(file.type)) {
    throw new InvalidUploadTypeError(
      `Tipo de arquivo nao permitido. Formatos aceitos: ${allowed.join(", ")}.`
    );
  }
}

/**
 * Retorna a extensao segura mapeada a partir do MIME type validado.
 * Use sempre apos assertAllowedUploadType.
 */
export function getSafeExtensionForMime(mimeType: string): string {
  const ext = MIME_EXTENSION[mimeType];

  if (!ext) {
    throw new InvalidUploadTypeError();
  }

  return ext;
}

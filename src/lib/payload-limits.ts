export const PAYLOAD_LIMITS = {
  WEBHOOK_JSON: 1 * 1024 * 1024, // 1MB
  CSV_IMPORT: 10 * 1024 * 1024,  // 10MB (Aumentado para suportar listas maiores)
  ATTACHMENT: 20 * 1024 * 1024,  // 20MB
  META_AD_IMAGE: 30 * 1024 * 1024, // 30MB para upload de imagem na biblioteca de anuncios da Meta
};

export type PayloadType = keyof typeof PAYLOAD_LIMITS;

export class PayloadTooLargeError extends Error {
  status = 413;
  limit: number;
  actual: number;

  constructor(type: PayloadType, actual: number) {
    const limit = PAYLOAD_LIMITS[type];
    const limitMb = (limit / (1024 * 1024)).toFixed(0);
    const actualMb = (actual / (1024 * 1024)).toFixed(2);
    super(
      `O tamanho do arquivo ou payload (${actualMb}MB) excede o limite de ${limitMb}MB permitido para ${type.toLowerCase().replace("_", " ")}.`
    );
    this.name = "PayloadTooLargeError";
    this.limit = limit;
    this.actual = actual;
  }
}

/**
 * Valida o tamanho do payload baseado no header Content-Length.
 * Deve ser chamado antes de ler o body (request.json(), request.text(), etc).
 */
export function assertPayloadSize(request: Request, type: PayloadType) {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > PAYLOAD_LIMITS[type]) {
      throw new PayloadTooLargeError(type, size);
    }
  }
}

/**
 * Valida o tamanho de um objeto File (comum em client-side ou FormData).
 */
export function validateFilePayloadSize(file: { size: number }, type: PayloadType) {
  if (file.size > PAYLOAD_LIMITS[type]) {
    throw new PayloadTooLargeError(type, file.size);
  }
}

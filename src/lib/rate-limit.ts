import { logger } from "./logger";

/**
 * Erro lançado quando o limite de requisições é excedido.
 */
export class RateLimitError extends Error {
  public readonly status = 429;
  constructor(message = "Muitas requisições. Tente novamente mais tarde.") {
    super(message);
    this.name = "RateLimitError";
  }
}

type RateLimitOptions = {
  /** Identificador único (IP, ID de Organização, Token, etc) */
  key: string;
  /** Limite de requisições no intervalo */
  limit: number;
  /** Janela de tempo em milissegundos */
  windowMs: number;
};

/**
 * Implementação simples de Rate Limit em memória.
 * 
 * ATENÇÃO (Limitações):
 * 1. Esta abordagem é LOCAL ao processo (lambda/instância).
 * 2. Em ambientes Serverless (Vercel), o limite é aplicado por instância.
 *    Se o tráfego for distribuído entre várias instâncias, o limite real será maior.
 * 3. Se a instância sofrer "Cold Start" ou for reciclada, o contador reseta.
 * 
 * Para um Rate Limit global e preciso em Vercel, utilize Vercel KV (Redis)
 * com @upstash/ratelimit.
 */
const hitMap = new Map<string, { count: number; expiresAt: number }>();

export function assertRateLimit(options: RateLimitOptions) {
  const { key, limit, windowMs } = options;
  const now = Date.now();
  
  const record = hitMap.get(key);

  // Limpeza periódica (caso o mapa cresça demais)
  if (hitMap.size > 1000) {
    cleanupExpiredRecords();
  }

  if (!record || now > record.expiresAt) {
    // Primeiro hit ou janela expirada
    hitMap.set(key, {
      count: 1,
      expiresAt: now + windowMs
    });
    return;
  }

  if (record.count >= limit) {
    logger.info({
      route: "system/rate-limit",
      operation: "RATE_LIMIT_EXCEEDED",
      message: `Limite de requisições excedido para a chave: ${key}`,
      data: {
        key,
        limit,
        windowMs,
        currentCount: record.count
      }
    });
    throw new RateLimitError();
  }

  // Incrementa contador
  record.count += 1;
}

function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of hitMap.entries()) {
    if (now > record.expiresAt) {
      hitMap.delete(key);
    }
  }
}

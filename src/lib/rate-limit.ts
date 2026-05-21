import { logger } from "./logger";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "./supabase/admin";

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

type DistributedRateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
};

export async function assertDistributedRateLimit(options: RateLimitOptions) {
  if (!hasSupabaseServiceRole()) {
    assertRateLimit(options);
    return;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("consume_rate_limit" as never, {
      p_key: options.key,
      p_limit: options.limit,
      p_window_ms: options.windowMs
    } as never);

    if (error) {
      throw error;
    }

    const result = Array.isArray(data)
      ? (data[0] as DistributedRateLimitResult | null | undefined)
      : (data as DistributedRateLimitResult | null | undefined);

    if (!result?.allowed) {
      logger.info({
        route: "system/rate-limit",
        operation: "RATE_LIMIT_EXCEEDED",
        message: `Limite distribuido de requisicoes excedido para a chave: ${options.key}`,
        data: {
          key: options.key,
          limit: options.limit,
          windowMs: options.windowMs,
          remaining: result?.remaining ?? 0,
          resetAt: result?.reset_at ?? null
        }
      });
      throw new RateLimitError();
    }
  } catch (error) {
    logger.error(
      {
        route: "system/rate-limit",
        operation: "DISTRIBUTED_RATE_LIMIT_FALLBACK",
        message: "Falha ao consultar o rate limit distribuido. Aplicando fallback local.",
        data: {
          key: options.key,
          limit: options.limit,
          windowMs: options.windowMs
        }
      },
      error
    );

    assertRateLimit(options);
  }
}

function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of hitMap.entries()) {
    if (now > record.expiresAt) {
      hitMap.delete(key);
    }
  }
}

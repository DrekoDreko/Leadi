import "server-only";

import { headers } from "next/headers";
import { assertDistributedRateLimit } from "@/lib/rate-limit";

/**
 * Extrai o IP do cliente a partir dos headers da requisicao (Server Actions
 * nao recebem o objeto Request, entao lemos via next/headers).
 */
export async function getActionClientIp() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return headerStore.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Rate limit para Server Actions. Reaproveita o rate limit distribuido
 * (Supabase RPC) usado nas rotas de API, mas chaveia pelo IP do cliente
 * obtido via headers(). Use `suffix` para reforcar a chave (ex.: email).
 *
 * Lanca RateLimitError quando o limite e excedido.
 */
export async function assertActionRateLimit(input: {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  suffix?: string | null;
}) {
  const ip = await getActionClientIp();
  const suffix = input.suffix ? `:${input.suffix}` : "";

  await assertDistributedRateLimit({
    key: `${input.keyPrefix}:${ip}${suffix}`,
    limit: input.limit,
    windowMs: input.windowMs
  });
}

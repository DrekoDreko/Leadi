import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  getErrorStatus
} from "@/lib/api/route-security";

type BoardRouteOptions = {
  keyPrefix: string;
  suffix?: string;
  limit?: number;
  /** Rotas somente-leitura (GET) não checam origem nem autenticação estrita. */
  readOnly?: boolean;
};

/**
 * Envelope padrão das rotas do board: valida origem, rate-limit e sessão,
 * executa `fn` e serializa a resposta/erro no formato { error } com status.
 */
export async function handleBoardRoute<T>(
  request: Request,
  options: BoardRouteOptions,
  fn: () => Promise<T>
): Promise<NextResponse> {
  try {
    if (!options.readOnly) {
      assertSameOrigin(request);
    }
    await assertRouteRateLimit({
      request,
      keyPrefix: options.keyPrefix,
      suffix: options.suffix,
      limit: options.limit ?? 80,
      windowMs: 60 * 1000
    });
    await assertServerAuth();

    const result = await fn();
    return NextResponse.json(result ?? { ok: true });
  } catch (error) {
    const status = getErrorStatus(error);
    const message =
      error instanceof ApiRouteError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Não foi possível concluir a operação.";

    logger.error(
      { route: options.keyPrefix, operation: "BOARD_MUTATION", status, message },
      error
    );

    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getNotificationsForCurrentUser,
  markAllNotificationsReadForCurrentUser,
  markNotificationReadForCurrentUser
} from "@/lib/notifications/repository.server";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  parseJsonBody
} from "@/lib/api/route-security";

const markReadSchema = z.union([
  z.object({ id: z.string().uuid() }),
  z.object({ all: z.literal(true) })
]);

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-notifications-get",
      limit: 60,
      windowMs: 60 * 1000
    });

    const state = await getNotificationsForCurrentUser();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel carregar as notificacoes." },
      { status: 400 }
    );
  }
}

// Marca uma notificacao (por id) ou todas (all: true) como lidas.
export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-notifications-patch",
      limit: 60,
      windowMs: 60 * 1000
    });

    const body = await parseJsonBody(request, markReadSchema);

    if ("all" in body) {
      await markAllNotificationsReadForCurrentUser();
    } else {
      await markNotificationReadForCurrentUser(body.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel atualizar a notificacao." },
      { status: 400 }
    );
  }
}

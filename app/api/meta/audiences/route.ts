import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  resolveCurrentIdentity,
  resolveMetaAccessTokenForOrganization
} from "@/lib/integrations/repository.server";
import { createWalletAudiences } from "@/lib/meta/custom-audience.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

export const runtime = "nodejs";

// Mudanca 6: recebe a carteira ja parseada em identificadores (email/telefone), faz
// o hashing no servidor (nunca persiste a base crua) e cria Custom Audience +
// Lookalike na conta de anuncio. So owner/admin.
const createAudienceSchema = z.object({
  adAccountId: requiredTrimmedString("Selecione uma conta de anúncio.").max(120),
  audienceName: z.string().max(200).optional(),
  identifiers: z
    .array(
      z.object({
        email: z.string().max(320).optional(),
        phone: z.string().max(40).optional()
      })
    )
    .min(1, "Envie ao menos um contato da carteira.")
    .max(50000, "Limite de 50 mil contatos por envio.")
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase indisponivel. Configure o backend antes de criar publicos." },
      { status: 503 }
    );
  }

  assertSameOrigin(request);
  await assertRouteRateLimit({
    request,
    keyPrefix: "api-meta-audiences-create",
    limit: 5,
    windowMs: 60 * 1000
  });

  const identity = await resolveCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
  }

  if (!identity.canManageConnections) {
    return NextResponse.json(
      { error: "Apenas owner ou admin podem criar publicos personalizados." },
      { status: 403 }
    );
  }

  const body = await parseJsonBody(request, createAudienceSchema);

  try {
    const accessToken = await resolveMetaAccessTokenForOrganization(identity.organization.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Conexao Meta nao encontrada para esta organizacao." },
        { status: 400 }
      );
    }

    const result = await createWalletAudiences({
      organizationId: identity.organization.id,
      createdByProfileId: identity.profile.id,
      adAccountId: body.adAccountId,
      accessToken,
      identifiers: body.identifiers,
      audienceName: body.audienceName
    });

    return NextResponse.json({ audience: result });
  } catch (error) {
    const { message, status } = resolveError(error);

    logApiError({
      route: "/api/meta/audiences",
      operation: "CREATE_META_CUSTOM_AUDIENCE",
      message,
      status,
      error,
      data: { adAccountId: body.adAccountId, organizationId: identity.organization.id }
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function resolveError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return { message: error.message, status: getErrorStatus(error) };
  }
  if (error instanceof Error && error.message) {
    return { message: error.message, status: 400 };
  }
  return { message: "Nao foi possivel criar o publico agora.", status: 400 };
}

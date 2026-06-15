import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";
import { createMetaLeadForm, LEAD_FORM_FIELDS } from "@/lib/meta/lead-form-creation.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

const createFormSchema = z.object({
  pageId: requiredTrimmedString("Selecione uma página.").max(120),
  name: requiredTrimmedString("Informe o nome do formulário.").max(200),
  fields: z.array(z.enum(LEAD_FORM_FIELDS)).min(1, "Selecione ao menos um campo."),
  privacyPolicyUrl: z.string().url("Informe uma URL de política de privacidade válida."),
  followUpUrl: z.string().url().optional(),
  thankYouMessage: z.string().max(500).optional()
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase indisponivel. Configure o backend antes de criar formularios." },
      { status: 503 }
    );
  }

  assertSameOrigin(request);
  await assertRouteRateLimit({
    request,
    keyPrefix: "api-meta-forms-create",
    limit: 15,
    windowMs: 60 * 1000
  });

  const identity = await resolveCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
  }

  if (!identity.canManageConnections) {
    return NextResponse.json(
      { error: "Apenas owner ou admin podem criar formularios." },
      { status: 403 }
    );
  }

  const body = await parseJsonBody(request, createFormSchema);

  try {
    const result = await createMetaLeadForm({
      organizationId: identity.organization.id,
      metaPageId: body.pageId,
      name: body.name,
      fields: body.fields,
      privacyPolicyUrl: body.privacyPolicyUrl,
      followUpUrl: body.followUpUrl,
      thankYouMessage: body.thankYouMessage
    });

    return NextResponse.json({ form: result });
  } catch (error) {
    const { message, status } = resolveError(error);

    logApiError({
      route: "/api/meta/forms",
      operation: "CREATE_META_LEAD_FORM",
      message,
      status,
      error,
      data: { pageId: body.pageId, organizationId: identity.organization.id }
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
  return { message: "Nao foi possivel criar o formulario agora.", status: 400 };
}

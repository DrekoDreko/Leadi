import { NextResponse } from "next/server";
import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCreditRequest, listCreditRequests } from "@/lib/ai/credit-requests.server";
import { logger } from "@/lib/logger";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  parseJsonBody
} from "@/lib/api/route-security";

const createCreditRequestSchema = z.object({
  requestType: z.enum(["team", "user", "campaign", "image"]),
  amountRequested: z.number().int().positive(),
  creditsPerConsultant: z.number().int().positive().nullable().optional(),
  consultantCount: z.number().int().positive().nullable().optional(),
  reason: z.string().min(1, "A razão é obrigatória."),
  teamId: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
}).strict();

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Plataforma não configurada." }, { status: 503 });
  }

  await assertRouteRateLimit({
    request,
    keyPrefix: "api-credit-requests-get",
    limit: 60,
    windowMs: 60 * 1000
  });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  try {
    const requests = await listCreditRequests(profile.organization_id, teamId);
    return NextResponse.json(requests);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    const status = message.toLowerCase().includes("permiss") || message.toLowerCase().includes("acesso") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Plataforma não configurada." }, { status: 503 });
    }

    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-credit-requests-post",
      limit: 20,
      windowMs: 60 * 1000
    });
    
    await assertServerAuth();

    body = await parseJsonBody(request, createCreditRequestSchema);
    const input = body as z.infer<typeof createCreditRequestSchema>;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 403 });
    }

    const result = await createCreditRequest({
      orgId: profile.organization_id,
      requestedByProfileId: profile.id,
      requestType: input.requestType,
      amountRequested: input.amountRequested,
      creditsPerConsultant: input.creditsPerConsultant,
      consultantCount: input.consultantCount,
      reason: input.reason,
      teamId: input.teamId,
      metadata: input.metadata as Json
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    const status = message.toLowerCase().includes("permiss") || message.toLowerCase().includes("acesso") ? 403 : 400;

    logger.error({
      route: "/api/credits/requests",
      operation: "CREATE_CREDIT_REQUEST",
      message,
      data: { body }
    }, error);

    return NextResponse.json({ error: message }, { status });
  }
}

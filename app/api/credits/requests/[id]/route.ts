import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { approveCreditRequest, rejectCreditRequest } from "@/lib/ai/credit-requests.server";
import { logger } from "@/lib/logger";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  parseJsonBody
} from "@/lib/api/route-security";

const updateCreditRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
  amountApproved: z.number().int().positive().optional(),
  reviewNotes: z.string().optional()
}).strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: unknown;
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Plataforma não configurada." }, { status: 503 });
    }

    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-credit-requests-id-post",
      limit: 20,
      windowMs: 60 * 1000
    });
    
    await assertServerAuth();

    body = await parseJsonBody(request, updateCreditRequestSchema);
    const input = body as z.infer<typeof updateCreditRequestSchema>;
    const { id } = await params;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, organization_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 403 });
    }

    // Apenas owner pode aprovar ou rejeitar
    if (profile.role !== "owner") {
      return NextResponse.json({ error: "Apenas o gestor pode aprovar ou rejeitar solicitações." }, { status: 403 });
    }

    if (input.action === "approve") {
      if (!input.amountApproved) {
        return NextResponse.json({ error: "O valor aprovado é obrigatório para aprovação." }, { status: 400 });
      }

      const result = await approveCreditRequest({
        requestId: id,
        orgId: profile.organization_id,
        approvedByProfileId: profile.id,
        amountApproved: input.amountApproved,
        reviewNotes: input.reviewNotes
      });
      return NextResponse.json(result);
    } else {
      const result = await rejectCreditRequest({
        requestId: id,
        orgId: profile.organization_id,
        rejectedByProfileId: profile.id,
        reviewNotes: input.reviewNotes
      });
      return NextResponse.json(result);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    logger.error({
      route: "/api/credits/requests/[id]",
      operation: "UPDATE_CREDIT_REQUEST",
      message,
      data: { body }
    }, error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

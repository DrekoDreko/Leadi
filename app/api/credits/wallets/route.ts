import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getAccessibleWallets,
  allocateCreditWalletBalance,
  allocateFromOrgPool,
  getCreditWalletById,
  getOrgPoolBalance,
  ensureSubWallet
} from "@/lib/ai/wallets.server";
import { getCurrentWorkspaceContext } from "@/lib/workspaces/context";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  ApiRouteError,
  getErrorStatus
} from "@/lib/api/route-security";

const allocateSchema = z.object({
  fromWalletId: z.string().uuid(),
  toWalletId: z.string().uuid().optional(),
  amount: z.number().int().positive().max(100_000_000),
  reason: z.string().min(1).max(500),
  walletType: z.enum(["team", "user"]).optional(),
  teamId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional()
});

type AllocateInput = z.infer<typeof allocateSchema>;

/**
 * Resolve (criando se necessário) a carteira destino. Retorna o id ou uma
 * NextResponse de erro de validação.
 */
async function resolveTargetWalletId(
  orgId: string,
  data: AllocateInput
): Promise<string | NextResponse> {
  let targetWalletId = data.toWalletId;

  if (!targetWalletId && data.walletType) {
    if (data.walletType === "team" && !data.teamId) {
      return NextResponse.json(
        { error: "teamId é obrigatório para walletType 'team'" },
        { status: 400 }
      );
    }
    if (data.walletType === "user" && !data.targetUserId) {
      return NextResponse.json(
        { error: "targetUserId é obrigatório para walletType 'user'" },
        { status: 400 }
      );
    }

    const newWallet = await ensureSubWallet({
      orgId,
      walletType: data.walletType,
      teamId: data.teamId,
      profileId: data.targetUserId
    });
    targetWalletId = newWallet.id;
  }

  if (!targetWalletId) {
    return NextResponse.json(
      { error: "toWalletId ou walletType com detalhes da carteira são obrigatórios." },
      { status: 400 }
    );
  }

  return targetWalletId;
}

/**
 * Resolve o perfil destino de uma distribuição para carteira de usuário.
 */
async function resolveTargetProfileId(
  data: AllocateInput,
  targetWalletId: string
): Promise<string | null> {
  if (data.targetUserId) {
    return data.targetUserId;
  }
  const wallet = await getCreditWalletById(targetWalletId);
  return wallet?.walletType === "user" ? wallet.profileId : null;
}

export async function GET(request: Request) {
  try {
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-credits-wallets-get",
      limit: 60,
      windowMs: 60 * 1000
    });

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const wallets = await getAccessibleWallets();

    // A carteira-org é só um handle; exibe o saldo real do pool da organização.
    const orgWallet = wallets.find((w) => w.walletType === "organization");
    if (orgWallet) {
      orgWallet.availableCredits = await getOrgPoolBalance(orgWallet.organizationId);
    }

    return NextResponse.json({ wallets });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro ao buscar wallets:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-credits-wallets-allocate",
      limit: 10,
      windowMs: 60 * 1000
    });
    assertSameOrigin(request);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const context = await getCurrentWorkspaceContext();
    const role = context.role;
    if (!context.workspace?.id || (role !== "owner" && role !== "admin")) {
      return NextResponse.json(
        { error: "Apenas gestores podem distribuir créditos." },
        { status: 403 }
      );
    }
    const orgId = context.workspace.id;

    const body = await request.json().catch(() => {
      throw new ApiRouteError(400, "Payload JSON invalido.");
    });
    const result = allocateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.issues },
        { status: 400 }
      );
    }

    const data = result.data;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    }

    // Resolve a carteira de origem para decidir a regra de autorização.
    const fromWallet = await getCreditWalletById(data.fromWalletId);
    if (!fromWallet || fromWallet.organizationId !== orgId) {
      return NextResponse.json({ error: "Carteira de origem inválida." }, { status: 400 });
    }

    // Carteira pessoal nunca pode ser fonte de redistribuição.
    if (fromWallet.walletType === "user") {
      return NextResponse.json(
        { error: "Não é possível distribuir a partir de uma carteira pessoal." },
        { status: 403 }
      );
    }

    const admin = createSupabaseAdminClient();

    // Origem = pool da organização: somente owner, debita org_ai_balances.
    if (fromWallet.walletType === "organization") {
      if (role !== "owner") {
        return NextResponse.json(
          { error: "Apenas o gestor pode distribuir do saldo da organização." },
          { status: 403 }
        );
      }

      const targetWalletId = await resolveTargetWalletId(orgId, data);
      if (typeof targetWalletId !== "string") {
        return targetWalletId; // NextResponse de erro
      }

      const allocation = await allocateFromOrgPool({
        orgId,
        toWalletId: targetWalletId,
        amount: data.amount,
        reason: data.reason,
        actorId: profile.id,
        targetUserId: data.targetUserId
      });

      return NextResponse.json({ success: true, allocation });
    }

    // Origem = carteira de equipe (credit_wallets). Owner pode sempre;
    // supervisor (admin) só na própria equipe ativa e para consultor dela.
    if (fromWallet.walletType === "team") {
      const sourceTeamId = fromWallet.teamId;
      if (!sourceTeamId) {
        return NextResponse.json({ error: "Equipe de origem inválida." }, { status: 400 });
      }

      if (role === "admin") {
        const { data: supervisorRow } = await admin
          .from("team_members")
          .select("id")
          .eq("organization_id", orgId)
          .eq("team_id", sourceTeamId)
          .eq("profile_id", profile.id)
          .eq("role", "supervisor")
          .eq("status", "active")
          .maybeSingle();

        if (!supervisorRow) {
          return NextResponse.json(
            { error: "Você não supervisiona esta equipe." },
            { status: 403 }
          );
        }

        // Supervisor só distribui para consultor (carteira de usuário).
        if (data.walletType && data.walletType !== "user") {
          return NextResponse.json(
            { error: "Supervisores só distribuem para consultores da própria equipe." },
            { status: 403 }
          );
        }
      }

      const targetWalletId = await resolveTargetWalletId(orgId, data);
      if (typeof targetWalletId !== "string") {
        return targetWalletId;
      }

      // Resolve o consultor destino e valida que pertence à equipe de origem.
      const targetProfileId = await resolveTargetProfileId(data, targetWalletId);
      if (!targetProfileId) {
        return NextResponse.json(
          { error: "Destino inválido para distribuição de equipe." },
          { status: 400 }
        );
      }

      const { data: consultantRow } = await admin
        .from("team_members")
        .select("id")
        .eq("organization_id", orgId)
        .eq("team_id", sourceTeamId)
        .eq("profile_id", targetProfileId)
        .eq("role", "consultant")
        .eq("status", "active")
        .maybeSingle();

      if (!consultantRow) {
        return NextResponse.json(
          { error: "O destino precisa ser um consultor ativo desta equipe." },
          { status: 403 }
        );
      }

      const allocation = await allocateCreditWalletBalance({
        orgId,
        fromWalletId: data.fromWalletId,
        toWalletId: targetWalletId,
        amount: data.amount,
        reason: data.reason,
        actorId: profile.id,
        targetUserId: targetProfileId
      });

      return NextResponse.json({ success: true, allocation });
    }

    return NextResponse.json({ error: "Origem inválida para distribuição." }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: getErrorStatus(error) });
    }

    console.error("Erro ao alocar créditos:", error);

    if (error instanceof Error && "code" in error && error.code === "insufficient_credits") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

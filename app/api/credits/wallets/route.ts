import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAccessibleWallets,
  allocateCreditWalletBalance,
  ensureSubWallet
} from "@/lib/ai/wallets.server";
import { getCurrentWorkspaceContext } from "@/lib/workspaces/context";

const allocateSchema = z.object({
  fromWalletId: z.string().uuid(),
  toWalletId: z.string().uuid().optional(),
  amount: z.number().int().positive(),
  reason: z.string().min(1),
  walletType: z.enum(["team", "user"]).optional(),
  teamId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional()
});

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const wallets = await getAccessibleWallets();
    return NextResponse.json({ wallets });
  } catch (error) {
    console.error("Erro ao buscar wallets:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const context = await getCurrentWorkspaceContext();
    if (!context.workspace?.id || context.role !== "owner") {
      return NextResponse.json(
        { error: "Apenas gestores podem alocar créditos." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = allocateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.issues },
        { status: 400 }
      );
    }

    const data = result.data;

    let targetWalletId = data.toWalletId;

    // Ensure target wallet exists if we are allocating to a team or user directly
    if (!targetWalletId && data.walletType) {
      if (data.walletType === "team" && !data.teamId) {
        return NextResponse.json({ error: "teamId é obrigatório para walletType 'team'" }, { status: 400 });
      }
      if (data.walletType === "user" && !data.targetUserId) {
        return NextResponse.json({ error: "targetUserId é obrigatório para walletType 'user'" }, { status: 400 });
      }

      const newWallet = await ensureSubWallet({
        orgId: context.workspace.id,
        walletType: data.walletType,
        teamId: data.teamId,
        profileId: data.targetUserId
      });
      targetWalletId = newWallet.id;
    }

    if (!targetWalletId) {
      return NextResponse.json({ error: "toWalletId ou walletType com detalhes da carteira são obrigatórios." }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    }

    const allocation = await allocateCreditWalletBalance({
      orgId: context.workspace!.id,
      fromWalletId: data.fromWalletId,
      toWalletId: targetWalletId,
      amount: data.amount,
      reason: data.reason,
      actorId: profile.id,
      targetUserId: data.targetUserId
    });

    return NextResponse.json({ success: true, allocation });
  } catch (error: unknown) {
    console.error("Erro ao alocar créditos:", error);
    
    if (error instanceof Error && "code" in error && error.code === "insufficient_credits") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

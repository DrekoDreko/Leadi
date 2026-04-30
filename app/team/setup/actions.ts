"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateInviteResult =
  | {
      ok: true;
      invitePath: string;
      expiresAt: string;
    }
  | {
      ok: false;
      error: string;
    };

type UpdateTeamNameResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export async function createInviteAction(): Promise<CreateInviteResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      invitePath: "/invite/demo",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_workspace_invite").single();

  if (error || !data) {
    return {
      ok: false,
      error: "Nao foi possivel gerar o convite agora."
    };
  }

  revalidatePath("/team/setup");

  return {
    ok: true,
    invitePath: data.invite_url_path,
    expiresAt: data.expires_at
  };
}

export async function updateTeamNameAction(formData: FormData): Promise<UpdateTeamNameResult> {
  const workspaceName = String(formData.get("workspaceName") ?? "").trim();

  if (!workspaceName) {
    return {
      ok: false,
      error: "Informe o nome da corretora."
    };
  }

  if (!isSupabaseConfigured()) {
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_workspace_name", {
    workspace_name: workspaceName
  });

  if (error) {
    return {
      ok: false,
      error: "Nao foi possivel atualizar o nome da corretora."
    };
  }

  revalidatePath("/team/setup");
  revalidatePath("/dashboard");

  return { ok: true };
}

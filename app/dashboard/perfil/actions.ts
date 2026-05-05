"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateLeadWebhookTokenActionState = {
  error: string | null;
  successMessage: string | null;
  token: string | null;
  label: string | null;
};

export async function updateBrokerageNameAction(formData: FormData) {
  const brokerageName = String(formData.get("brokerageName") ?? "").trim();

  if (!brokerageName) {
    redirect("/dashboard/perfil?brokerage=missing");
  }

  if (!isSupabaseConfigured()) {
    redirect("/dashboard/perfil?brokerage=updated");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_brokerage_name", {
    brokerage_name: brokerageName
  });

  if (error) {
    redirect(`/dashboard/perfil?brokerage=${getBrokerageErrorCode(error)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/whatsapp");
  revalidatePath("/dashboard/campanhas");

  redirect("/dashboard/perfil?brokerage=updated");
}

export async function createLeadWebhookTokenAction(
  _previousState: CreateLeadWebhookTokenActionState,
  formData: FormData
): Promise<CreateLeadWebhookTokenActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Configure o Supabase antes de gerar um token real.",
      successMessage: null,
      token: null,
      label: null
    };
  }

  const label = String(formData.get("label") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Sua sessao expirou. Entre novamente para gerar o token.",
      successMessage: null,
      token: null,
      label: null
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: "Nao foi possivel identificar sua organizacao agora.",
      successMessage: null,
      token: null,
      label: null
    };
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("type")
    .eq("id", profile.organization_id)
    .single();

  if (organizationError || !organization) {
    return {
      error: "Nao foi possivel validar a organizacao do token.",
      successMessage: null,
      token: null,
      label: null
    };
  }

  const canManageToken = profile.role === "supervisor" || organization.type === "solo";

  if (!canManageToken) {
    return {
      error: "Somente o supervisor pode gerar um novo token para a equipe.",
      successMessage: null,
      token: null,
      label: null
    };
  }

  const { data, error } = await supabase.rpc("create_lead_webhook_integration", {
    target_organization_id: profile.organization_id,
    integration_label: label || null
  });

  if (error) {
    return {
      error: getLeadWebhookTokenErrorMessage(error),
      successMessage: null,
      token: null,
      label: null
    };
  }

  const createdIntegration = data?.[0];

  if (!createdIntegration?.token) {
    return {
      error: "O token foi criado, mas nao voltou para a interface. Tente gerar novamente.",
      successMessage: null,
      token: null,
      label: null
    };
  }

  revalidatePath("/dashboard/perfil");

  return {
    error: null,
    successMessage: "Token gerado. Copie agora: ele nao volta a aparecer depois.",
    token: createdIntegration.token,
    label: createdIntegration.label ?? (label || null)
  };
}

function getBrokerageErrorCode(error: { code?: string; message?: string } | null) {
  if (
    error?.code === "PGRST202" ||
    error?.message?.includes("update_brokerage_name") ||
    error?.message?.includes("brokerage_name")
  ) {
    return "schema-missing";
  }

  if (error?.message?.includes("permissao") || error?.message?.includes("permissão")) {
    return "permission";
  }

  return "failed";
}

function getLeadWebhookTokenErrorMessage(error: { code?: string; message?: string } | null) {
  if (
    error?.code === "PGRST202" ||
    error?.message?.includes("create_lead_webhook_integration") ||
    error?.message?.includes("lead_webhook_integrations")
  ) {
    return "O banco conectado ainda nao recebeu a migration de integracoes de webhook.";
  }

  return "Nao foi possivel gerar o token agora. Tente novamente em instantes.";
}

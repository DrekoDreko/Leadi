"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";

type SetupResult =
  | { ok: true }
  | { ok: false; error: string };

export async function completeInviteSetupAction(formData: FormData): Promise<SetupResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const teamName = String(formData.get("teamName") ?? "").trim();
  const role = String(formData.get("role") ?? "seller");

  if (!fullName) {
    return { ok: false, error: "Informe seu nome completo." };
  }

  if (role === "admin" && !teamName) {
    return { ok: false, error: "Informe o nome da equipe que voce vai supervisionar." };
  }

  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessao expirada. Faca login novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return { ok: false, error: "Perfil nao encontrado." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", profile.id);

  if (updateError) {
    return { ok: false, error: "Nao foi possivel salvar seu nome." };
  }

  if (role === "admin" && teamName && hasSupabaseServiceRole()) {
    const admin = createSupabaseAdminClient();

    const { data: team } = await admin
      .from("teams")
      .insert({
        name: teamName,
        organization_id: profile.organization_id,
        created_by_profile_id: profile.id,
        is_active: true
      })
      .select("id")
      .single();

    if (team) {
      await admin.from("team_members").insert({
        team_id: team.id,
        profile_id: profile.id,
        organization_id: profile.organization_id,
        role: "supervisor",
        status: "active",
        added_by_profile_id: profile.id
      });
    }
  }

  await notifyOwner(profile.organization_id, profile.id, fullName, role);

  redirect("/dashboard");
}

async function notifyOwner(
  organizationId: string,
  profileId: string,
  memberName: string,
  memberRole: string
) {
  if (!hasSupabaseServiceRole()) return;

  try {
    const admin = createSupabaseAdminClient();

    const { data: org } = await admin
      .from("organizations")
      .select("owner_profile_id")
      .eq("id", organizationId)
      .maybeSingle();

    if (!org?.owner_profile_id || org.owner_profile_id === profileId) return;

    const roleLabel = memberRole === "admin" ? "Supervisor" : "Consultor";
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    await admin.from("dashboard_reminders").insert({
      organization_id: organizationId,
      created_by_profile_id: org.owner_profile_id,
      reminder_date: dateStr,
      remind_at: now.toISOString(),
      message: `Novo membro: ${memberName} (${roleLabel}) aceitou o convite e configurou o perfil.`
    });
  } catch {
    // Non-critical — don't block the setup flow
  }
}

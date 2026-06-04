import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Roles no schema real (profiles / workspace_members): owner | admin | seller.
// Na tabela teams/team_members o papel equivalente: supervisor (= admin) | consultant (= seller).
const PASSWORD = "consult123";

const usersToCreate = [
  { email: "owner@codeellow.com", role: "owner", teamRole: null, title: "Gestor" },
  { email: "adm@codeellow.com", role: "admin", teamRole: "supervisor", title: "Supervisor" },
  { email: "consult1@codeellow.com", role: "seller", teamRole: "consultant", title: "Consultor 1" },
  { email: "consult2@codeellow.com", role: "seller", teamRole: "consultant", title: "Consultor 2" },
] as const;

async function main() {
  // 1. Limpar usuarios existentes (idempotente)
  console.log("Deletando usuarios existentes (se houver)...");
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  for (const u of usersToCreate) {
    const existing = listData?.users.find((user) => user.email === u.email);
    if (existing) {
      console.log(`  - deletando ${u.email}...`);
      await supabase.auth.admin.deleteUser(existing.id);
    }
  }

  // 2. Criar usuarios (o trigger handle_new_user cria org 'solo' + profile owner + workspace_member)
  const createdUsers: Record<string, { id: string }> = {};
  for (const u of usersToCreate) {
    console.log(`Criando ${u.email}...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.title },
    });
    if (error || !data.user) {
      console.error(`Erro ao criar ${u.email}:`, error);
      continue;
    }
    createdUsers[u.email] = data.user;
    await new Promise((r) => setTimeout(r, 800)); // deixa o trigger rodar
  }

  // 3. Owner: transformar a org dele em 'team'
  const ownerUser = createdUsers["owner@codeellow.com"];
  if (!ownerUser) throw new Error("Owner nao foi criado.");

  const { data: ownerProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", ownerUser.id)
    .single();
  if (profileErr || !ownerProfile) throw new Error(`Erro ao buscar profile do owner: ${profileErr?.message}`);

  const ownerOrgId = ownerProfile.organization_id as string;
  console.log(`Owner Org ID: ${ownerOrgId}`);

  await supabase
    .from("organizations")
    .update({ type: "team", owner_profile_id: ownerProfile.id, name: "Equipe Codeellow" })
    .eq("id", ownerOrgId);

  await supabase
    .from("workspace_members")
    .upsert(
      { workspace_id: ownerOrgId, user_id: ownerProfile.id, role: "owner", status: "active" },
      { onConflict: "workspace_id,user_id" }
    );

  // 4. Mover os demais usuarios para a org do owner com o papel correto
  const memberProfiles: Record<string, { id: string }> = {};
  for (const u of usersToCreate) {
    if (u.role === "owner") continue;
    const authUser = createdUsers[u.email];
    if (!authUser) continue;

    const { data: uProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .single();
    if (!uProfile) continue;

    const oldOrgId = uProfile.organization_id as string;
    memberProfiles[u.email] = uProfile;

    console.log(`Vinculando ${u.email} (role: ${u.role}) a org do owner...`);
    await supabase
      .from("profiles")
      .update({ organization_id: ownerOrgId, role: u.role, profile_setup_completed: true })
      .eq("id", uProfile.id);

    await supabase
      .from("workspace_members")
      .upsert(
        { workspace_id: ownerOrgId, user_id: uProfile.id, role: u.role, status: "active" },
        { onConflict: "workspace_id,user_id" }
      );

    // Remove a org 'solo' orfa (cascade limpa o workspace_member antigo)
    if (oldOrgId && oldOrgId !== ownerOrgId) {
      await supabase.from("organizations").delete().eq("id", oldOrgId);
    }
  }

  // 5. Criar equipe e vincular supervisor + consultores (tabela teams / team_members)
  console.log("Criando equipe comercial...");
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .insert({
      organization_id: ownerOrgId,
      name: "Equipe Comercial",
      created_by_profile_id: ownerProfile.id,
      is_active: true,
    })
    .select("*")
    .single();
  if (teamErr || !team) throw new Error(`Erro ao criar equipe: ${teamErr?.message}`);

  for (const u of usersToCreate) {
    if (!u.teamRole) continue;
    const prof = memberProfiles[u.email];
    if (!prof) continue;
    console.log(`  - adicionando ${u.email} a equipe como ${u.teamRole}...`);
    await supabase.from("team_members").insert({
      team_id: team.id,
      profile_id: prof.id,
      organization_id: ownerOrgId,
      role: u.teamRole,
      status: "active",
      added_by_profile_id: ownerProfile.id,
      approved_by_profile_id: ownerProfile.id,
    });
  }

  // 6. Assinatura ativa do plano Equipe (como se o owner tivesse pago)
  console.log("Ativando plano Equipe...");
  const { data: plan, error: planErr } = await supabase
    .from("plans")
    .select("*")
    .eq("code", "equipe")
    .single();
  if (planErr || !plan) throw new Error(`Plano 'equipe' nao encontrado: ${planErr?.message}`);

  const meta = (plan.metadata ?? {}) as Record<string, unknown>;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Remove assinaturas atuais antes de inserir a nova (evita conflito com unique de assinatura corrente)
  await supabase
    .from("subscriptions")
    .delete()
    .eq("organization_id", ownerOrgId)
    .in("status", ["pending", "trialing", "active", "past_due", "paused"]);

  const { data: subscription, error: subErr } = await supabase
    .from("subscriptions")
    .insert({
      organization_id: ownerOrgId,
      plan_id: plan.id,
      status: "active",
      gateway: "manual",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      metadata: {
        seeded: true,
        included_credits: meta.included_credits ?? null,
        included_users: meta.included_users ?? null,
        extra_user_amount_cents: meta.extra_user_amount_cents ?? null,
      },
    })
    .select("*")
    .single();
  if (subErr || !subscription) throw new Error(`Erro ao criar assinatura: ${subErr?.message}`);

  // 7. Conceder os creditos de IA inclusos no plano (replica o webhook de pagamento aprovado)
  try {
    const { error: grantErr } = await (supabase as any).rpc("grant_subscription_included_ai_credits", {
      target_subscription_id: subscription.id,
      p_reference_id: `${subscription.id}:${now.toISOString()}`,
      p_metadata: { seeded: true },
    });
    if (grantErr) console.warn(`Aviso: nao foi possivel conceder creditos inclusos: ${grantErr.message}`);
    else console.log(`Creditos inclusos do plano concedidos (${meta.included_credits ?? "?"}).`);
  } catch (e) {
    console.warn("Aviso: RPC de creditos inclusos falhou:", e);
  }

  // 8. Resumo final
  const { data: finalProfiles } = await supabase
    .from("profiles")
    .select("email, role, organization_id")
    .in("email", usersToCreate.map((u) => u.email));

  console.log("\n=== Perfis finais ===");
  console.table(finalProfiles);
  console.log(`Org (team): ${ownerOrgId}`);
  console.log(`Equipe: ${team.id} (${team.name})`);
  console.log(`Assinatura: ${subscription.id} status=${subscription.status} plano=${plan.code}`);
  console.log(`\nSenha de todos os usuarios: ${PASSWORD}`);
  console.log("Concluido!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

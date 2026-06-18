import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSubWallet } from "@/lib/ai/wallets.server";
import { type SupervisorTeam } from "./supervisor-credits-workspace";

/**
 * Carrega as equipes ativas que o perfil supervisiona, com os saldos das
 * carteiras de equipe e de cada consultor ativo. Usado tanto na tela de
 * "Distribuir Créditos" das equipes quanto no card de créditos do perfil.
 */
export async function loadSupervisedTeamsWithCredits(
  orgId: string,
  profileId: string
): Promise<SupervisorTeam[]> {
  const admin = createSupabaseAdminClient();

  // Equipes ativas que este supervisor de fato supervisiona.
  const { data: supervisedRows } = await admin
    .from("team_members")
    .select("team_id")
    .eq("organization_id", orgId)
    .eq("profile_id", profileId)
    .eq("role", "supervisor")
    .eq("status", "active");

  const supervisedTeamIds = [
    ...new Set((supervisedRows ?? []).map((row) => row.team_id).filter(Boolean))
  ] as string[];

  if (supervisedTeamIds.length === 0) {
    return [];
  }

  const { data: teamRows } = await admin
    .from("teams")
    .select("id,name,is_active")
    .in("id", supervisedTeamIds)
    .eq("is_active", true);

  const activeTeams = (teamRows ?? []) as Array<{ id: string; name: string }>;
  const activeTeamIds = activeTeams.map((team) => team.id);

  // Consultores ativos dessas equipes.
  const { data: consultantRows } = activeTeamIds.length
    ? await admin
        .from("team_members")
        .select("team_id,profile_id")
        .eq("organization_id", orgId)
        .eq("role", "consultant")
        .eq("status", "active")
        .in("team_id", activeTeamIds)
    : { data: [] as Array<{ team_id: string; profile_id: string }> };

  const consultantList = (consultantRows ?? []) as Array<{
    team_id: string;
    profile_id: string;
  }>;
  const consultantIds = [...new Set(consultantList.map((row) => row.profile_id))];

  const [{ data: profileRows }, { data: userWalletRows }] = await Promise.all([
    consultantIds.length
      ? admin.from("profiles").select("id,full_name,email").in("id", consultantIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; email: string }> }),
    consultantIds.length
      ? admin
          .from("credit_wallets")
          .select("id,profile_id,available_credits")
          .eq("organization_id", orgId)
          .eq("wallet_type", "user")
          .in("profile_id", consultantIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; profile_id: string; available_credits: number }>
        })
  ]);

  const profilesById = new Map((profileRows ?? []).map((row) => [row.id as string, row]));
  const walletByProfile = new Map(
    (userWalletRows ?? []).map((row) => [row.profile_id as string, row])
  );

  // Garante a carteira de cada equipe e monta a árvore equipe -> consultores.
  return Promise.all(
    activeTeams.map(async (team) => {
      const teamWallet = await ensureSubWallet({
        orgId,
        walletType: "team",
        teamId: team.id
      });

      const consultants = consultantList
        .filter((row) => row.team_id === team.id)
        .map((row) => {
          const profile = profilesById.get(row.profile_id);
          const wallet = walletByProfile.get(row.profile_id);
          return {
            profileId: row.profile_id,
            name: profile?.full_name?.trim() || profile?.email || "Consultor",
            email: profile?.email ?? "",
            availableCredits: Number(wallet?.available_credits ?? 0)
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

      return {
        id: team.id,
        name: team.name,
        walletId: teamWallet.id,
        availableCredits: teamWallet.availableCredits,
        consultants
      } satisfies SupervisorTeam;
    })
  );
}

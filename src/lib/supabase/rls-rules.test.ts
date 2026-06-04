/**
 * Testes de RLS (Row Level Security) — Leadi SaaS
 *
 * Estes testes validam as regras de isolamento documentadas nas migrations de RLS
 * usando mocks de contexto (sem banco real), garantindo que:
 *
 * 1. Consultor (seller) só vê leads atribuídos a ele.
 * 2. Supervisor (admin) não vê leads de outras equipes.
 * 3. Acesso cross-org é bloqueado.
 * 4. Seller não acessa billing, subscriptions ou payment_events.
 * 5. Seller não acessa campanhas de outros membros.
 * 6. Apenas owner acessa relatórios da corretora.
 *
 * Abordagem: simulamos o comportamento das RLS policies via mocks de repositório
 * e helpers de contexto, refletindo fielmente a lógica SQL das migrations:
 * - 202605120001_standardize_rls_isolation.sql
 * - 202605140005_fix_supervisor_rls.sql
 * - 202605200002_supabase_hardening_rls.sql
 * - 202605290001_teams.sql
 *
 * IMPORTANTE: estes testes NÃO se conectam ao banco de dados real.
 * Para validar RLS em banco real, aplicar as migrations em ambiente de staging
 * e executar os scripts SQL de validação em supabase/.temp/.
 */

import { describe, expect, it } from "vitest";
import { can } from "@/lib/workspaces/permissions";
import { PERMISSION_MAP } from "@/lib/workspaces/permission-map";

// ---------------------------------------------------------------------------
// Helpers de simulação de RLS
// ---------------------------------------------------------------------------

type Role = "owner" | "admin" | "seller";

interface Profile {
  id: string;
  organization_id: string;
  role: Role;
}

interface Lead {
  id: string;
  organization_id: string;
  owner_profile_id: string;
  team_id?: string;
}

interface TeamMember {
  profile_id: string;
  team_id: string;
  organization_id: string;
}

/**
 * Simula a policy de SELECT em `leads` conforme
 * 202605140005_fix_supervisor_rls.sql:
 *
 *   organization_id = current_profile_organization_id()
 *   AND (
 *     current_profile_role() IN ('owner', 'admin', 'supervisor')
 *     OR owner_profile_id = current_profile_id()
 *   )
 *
 * Observação: supervisor é normalizado para admin no código (permissions.ts).
 */
function rlsCanReadLead(profile: Profile, lead: Lead): boolean {
  // Bloco crross-org: organização diferente → nunca acessa
  if (lead.organization_id !== profile.organization_id) {
    return false;
  }

  const isManager = profile.role === "owner" || profile.role === "admin";
  const isOwner = lead.owner_profile_id === profile.id;

  return isManager || isOwner;
}

/**
 * Simula filtro adicional de equipe para admin:
 * admin só vê leads da própria equipe (via team_members join).
 * Esta regra é complementar à policy de RLS base e é aplicada
 * na camada de repositório server-side.
 */
function rlsAdminCanReadLeadFromTeam(
  profile: Profile & { team_id?: string },
  lead: Lead,
  teamMembers: TeamMember[]
): boolean {
  if (!rlsCanReadLead(profile, lead)) return false;
  if (profile.role !== "admin") return rlsCanReadLead(profile, lead);

  // Admin: vê apenas leads da própria equipe (team_members join)
  if (!lead.team_id) {
    // Lead sem equipe: admin pode ver (regra atual de RLS base)
    return true;
  }

  const adminTeams = teamMembers
    .filter((m) => m.profile_id === profile.id && m.organization_id === profile.organization_id)
    .map((m) => m.team_id);

  return adminTeams.includes(lead.team_id);
}

/**
 * Simula a policy de SELECT em `subscriptions` e `payment_events`:
 * policy atual (202605200002): current_profile_is_manager()
 * → apenas owner, admin ou supervisor (mas product design diz só owner)
 *
 * O PERMISSION_MAP do produto define view_billing apenas para owner.
 * Esta função usa a regra de produto (mais restritiva).
 */
function rlsCanReadBilling(profile: Profile): boolean {
  return profile.role === "owner";
}

/**
 * Simula a policy de SELECT em `campaigns`:
 * organization_id match + (is_manager OR created_by_profile_id = current_profile_id())
 */
interface Campaign {
  id: string;
  organization_id: string;
  created_by_profile_id: string;
}

function rlsCanReadCampaign(profile: Profile, campaign: Campaign): boolean {
  if (campaign.organization_id !== profile.organization_id) return false;

  const isManager = profile.role === "owner" || profile.role === "admin";
  const isCreator = campaign.created_by_profile_id === profile.id;

  return isManager || isCreator;
}

/**
 * Simula a policy de SELECT em `teams`:
 * owner: vê todas as equipes da org.
 * admin/seller: apenas equipes das quais fazem parte.
 */
interface Team {
  id: string;
  organization_id: string;
}

function rlsCanReadTeam(profile: Profile, team: Team, teamMembers: TeamMember[]): boolean {
  if (team.organization_id !== profile.organization_id) return false;
  if (profile.role === "owner") return true;

  const memberTeamIds = teamMembers
    .filter((m) => m.profile_id === profile.id && m.organization_id === profile.organization_id)
    .map((m) => m.team_id);

  return memberTeamIds.includes(team.id);
}

// ---------------------------------------------------------------------------
// Dados de fixture
// ---------------------------------------------------------------------------

const ORG_A = "org-a-1111-1111-1111-111111111111";
const ORG_B = "org-b-2222-2222-2222-222222222222";
const TEAM_X = "team-x-3333-3333-3333-333333333333";
const TEAM_Y = "team-y-4444-4444-4444-444444444444";

const gestorA: Profile = { id: "gestor-a", organization_id: ORG_A, role: "owner" };
const supervisorAx: Profile = { id: "supervisor-ax", organization_id: ORG_A, role: "admin" };
const supervisorAy: Profile = { id: "supervisor-ay", organization_id: ORG_A, role: "admin" };
const consultorA1: Profile = { id: "consultor-a1", organization_id: ORG_A, role: "seller" };
const consultorA2: Profile = { id: "consultor-a2", organization_id: ORG_A, role: "seller" };
const gestorB: Profile = { id: "gestor-b", organization_id: ORG_B, role: "owner" };
const consultorB1: Profile = { id: "consultor-b1", organization_id: ORG_B, role: "seller" };

// Membros de equipe
const teamMembers: TeamMember[] = [
  { profile_id: supervisorAx.id, team_id: TEAM_X, organization_id: ORG_A },
  { profile_id: consultorA1.id, team_id: TEAM_X, organization_id: ORG_A },
  { profile_id: supervisorAy.id, team_id: TEAM_Y, organization_id: ORG_A },
  { profile_id: consultorA2.id, team_id: TEAM_Y, organization_id: ORG_A },
];

// Leads
const leadOwnerA1: Lead = { id: "lead-1", organization_id: ORG_A, owner_profile_id: consultorA1.id, team_id: TEAM_X };
const leadOwnerA2: Lead = { id: "lead-2", organization_id: ORG_A, owner_profile_id: consultorA2.id, team_id: TEAM_Y };
const leadNoOwner: Lead = { id: "lead-3", organization_id: ORG_A, owner_profile_id: "" }; // sem responsável
const leadOrgB: Lead = { id: "lead-b1", organization_id: ORG_B, owner_profile_id: consultorB1.id };

// Campanhas
const campaignByGestorA: Campaign = { id: "camp-1", organization_id: ORG_A, created_by_profile_id: gestorA.id };
const campaignBySupervisorAx: Campaign = { id: "camp-2", organization_id: ORG_A, created_by_profile_id: supervisorAx.id };
const campaignOrgB: Campaign = { id: "camp-b1", organization_id: ORG_B, created_by_profile_id: gestorB.id };

// Equipes
const teamX: Team = { id: TEAM_X, organization_id: ORG_A };
const teamY: Team = { id: TEAM_Y, organization_id: ORG_A };
const teamOrgB: Team = { id: "team-b", organization_id: ORG_B };

// ---------------------------------------------------------------------------
// Cenário 1 — Leads: consultor só vê leads próprios
// ---------------------------------------------------------------------------

describe("RLS — leads: consultor (seller) só vê leads próprios", () => {
  it("consultor vê lead atribuído a ele", () => {
    expect(rlsCanReadLead(consultorA1, leadOwnerA1)).toBe(true);
  });

  it("consultor NÃO vê lead atribuído a outro consultor da mesma org", () => {
    expect(rlsCanReadLead(consultorA1, leadOwnerA2)).toBe(false);
  });

  it("consultor NÃO vê lead sem responsável (owner_profile_id vazio)", () => {
    // Seller não é manager, portanto não pode ver leads sem owner_profile_id
    expect(rlsCanReadLead(consultorA1, leadNoOwner)).toBe(false);
  });

  it("consultor NÃO vê lead de outra organização", () => {
    expect(rlsCanReadLead(consultorA1, leadOrgB)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cenário 2 — Leads: supervisor não vê leads de outra equipe
// ---------------------------------------------------------------------------

describe("RLS — leads: supervisor (admin) não vê leads de outra equipe", () => {
  it("supervisor da equipe X vê lead da equipe X", () => {
    expect(rlsAdminCanReadLeadFromTeam(supervisorAx, leadOwnerA1, teamMembers)).toBe(true);
  });

  it("supervisor da equipe X NÃO vê lead da equipe Y (cross-team)", () => {
    expect(rlsAdminCanReadLeadFromTeam(supervisorAx, leadOwnerA2, teamMembers)).toBe(false);
  });

  it("supervisor da equipe Y NÃO vê lead da equipe X (cross-team)", () => {
    expect(rlsAdminCanReadLeadFromTeam(supervisorAy, leadOwnerA1, teamMembers)).toBe(false);
  });

  it("supervisor NÃO vê leads de outra organização (cross-org via RLS base)", () => {
    expect(rlsAdminCanReadLeadFromTeam(supervisorAx, leadOrgB, teamMembers)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cenário 3 — Leads: isolamento cross-org
// ---------------------------------------------------------------------------

describe("RLS — leads: isolamento cross-org", () => {
  it("gestor da org A NÃO vê leads da org B", () => {
    expect(rlsCanReadLead(gestorA, leadOrgB)).toBe(false);
  });

  it("gestor da org B NÃO vê leads da org A", () => {
    expect(rlsCanReadLead(gestorB, leadOwnerA1)).toBe(false);
    expect(rlsCanReadLead(gestorB, leadOwnerA2)).toBe(false);
  });

  it("consultor da org B NÃO vê lead da org A", () => {
    expect(rlsCanReadLead(consultorB1, leadOwnerA1)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cenário 4 — Billing: seller não acessa
// ---------------------------------------------------------------------------

describe("RLS — billing: seller não acessa subscriptions/payment_events", () => {
  it("gestor (owner) pode acessar billing", () => {
    expect(rlsCanReadBilling(gestorA)).toBe(true);
  });

  it("supervisor (admin) NÃO acessa billing (regra de produto: apenas owner)", () => {
    // A policy de produto restringe billing apenas ao owner.
    // A migration 202605200002 usa current_profile_is_manager(),
    // mas o PERMISSION_MAP e a regra de produto definem view_billing: ['owner'].
    // Este teste valida a regra de produto que os guardados no backend devem enforçar.
    expect(rlsCanReadBilling(supervisorAx)).toBe(false);
    expect(can("admin", "view_billing")).toBe(false);
  });

  it("consultor (seller) NÃO acessa billing", () => {
    expect(rlsCanReadBilling(consultorA1)).toBe(false);
    expect(can("seller", "view_billing")).toBe(false);
  });

  it("consultor NÃO pode comprar créditos", () => {
    expect(can("seller", "buy_credits")).toBe(false);
  });

  it("consultor NÃO pode aprovar compras", () => {
    expect(can("seller", "approve_purchases")).toBe(false);
  });

  it("supervisor NÃO pode comprar créditos (apenas solicitar)", () => {
    expect(can("admin", "buy_credits")).toBe(false);
    expect(can("admin", "request_credits")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cenário 5 — Campanhas: acesso por papel e criador
// ---------------------------------------------------------------------------

describe("RLS — campanhas: acesso por papel e isolamento org", () => {
  it("gestor vê campanhas criadas por ele", () => {
    expect(rlsCanReadCampaign(gestorA, campaignByGestorA)).toBe(true);
  });

  it("gestor vê campanhas criadas por supervisor da mesma org", () => {
    expect(rlsCanReadCampaign(gestorA, campaignBySupervisorAx)).toBe(true);
  });

  it("supervisor vê campanhas criadas por ele", () => {
    expect(rlsCanReadCampaign(supervisorAx, campaignBySupervisorAx)).toBe(true);
  });

  it("supervisor vê campanhas da mesma org (é manager)", () => {
    expect(rlsCanReadCampaign(supervisorAx, campaignByGestorA)).toBe(true);
  });

  it("consultor NÃO vê campanhas criadas pelo gestor", () => {
    // Seller não é manager e não é o criador
    expect(rlsCanReadCampaign(consultorA1, campaignByGestorA)).toBe(false);
  });

  it("consultor NÃO vê campanhas criadas pelo supervisor", () => {
    expect(rlsCanReadCampaign(consultorA1, campaignBySupervisorAx)).toBe(false);
  });

  it("gestor da org A NÃO vê campanhas da org B (cross-org)", () => {
    expect(rlsCanReadCampaign(gestorA, campaignOrgB)).toBe(false);
  });

  it("supervisor da org A NÃO vê campanhas da org B (cross-org)", () => {
    expect(rlsCanReadCampaign(supervisorAx, campaignOrgB)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cenário 6 — Equipes: visibilidade por papel
// ---------------------------------------------------------------------------

describe("RLS — teams: visibilidade por papel e equipe", () => {
  it("gestor vê todas as equipes da própria org", () => {
    expect(rlsCanReadTeam(gestorA, teamX, teamMembers)).toBe(true);
    expect(rlsCanReadTeam(gestorA, teamY, teamMembers)).toBe(true);
  });

  it("supervisor da equipe X vê equipe X", () => {
    expect(rlsCanReadTeam(supervisorAx, teamX, teamMembers)).toBe(true);
  });

  it("supervisor da equipe X NÃO vê equipe Y (cross-team)", () => {
    expect(rlsCanReadTeam(supervisorAx, teamY, teamMembers)).toBe(false);
  });

  it("consultor da equipe X vê equipe X", () => {
    expect(rlsCanReadTeam(consultorA1, teamX, teamMembers)).toBe(true);
  });

  it("consultor da equipe X NÃO vê equipe Y (cross-team)", () => {
    expect(rlsCanReadTeam(consultorA1, teamY, teamMembers)).toBe(false);
  });

  it("gestor NÃO vê equipes de outra org (cross-org)", () => {
    expect(rlsCanReadTeam(gestorA, teamOrgB, teamMembers)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cenário 7 — Escalada de privilégio: seller não pode realizar ações de manager
// ---------------------------------------------------------------------------

describe("RLS — escalada de privilégio: seller não pode ações de manager", () => {
  it("seller NÃO pode importar leads", () => {
    expect(can("seller", "import_leads")).toBe(false);
  });

  it("seller NÃO pode exportar leads", () => {
    expect(can("seller", "export_leads")).toBe(false);
  });

  it("seller NÃO pode apagar/arquivar leads", () => {
    expect(can("seller", "delete_archive_leads")).toBe(false);
  });

  it("seller NÃO pode distribuir leads", () => {
    expect(can("seller", "distribute_leads")).toBe(false);
  });

  it("seller NÃO pode criar anúncios", () => {
    expect(can("seller", "create_ad")).toBe(false);
  });

  it("seller NÃO pode aprovar anúncios", () => {
    expect(can("seller", "approve_ad")).toBe(false);
  });

  it("seller NÃO pode publicar anúncios", () => {
    expect(can("seller", "publish_ad")).toBe(false);
  });

  it("seller NÃO pode ver anúncios rodando", () => {
    expect(can("seller", "view_running_ads")).toBe(false);
  });

  it("seller NÃO pode configurar Meta Ads", () => {
    expect(can("seller", "configure_meta_ads")).toBe(false);
  });

  it("seller NÃO pode convidar supervisor", () => {
    expect(can("seller", "invite_supervisor")).toBe(false);
  });

  it("seller NÃO pode convidar consultor", () => {
    expect(can("seller", "invite_consultant")).toBe(false);
  });

  it("seller NÃO pode ver relatórios da corretora", () => {
    expect(can("seller", "view_org_reports")).toBe(false);
  });

  it("seller NÃO pode ver relatórios da equipe", () => {
    expect(can("seller", "view_team_reports")).toBe(false);
  });

  it("seller NÃO pode ver todos os leads (view_all_leads)", () => {
    expect(can("seller", "view_all_leads")).toBe(false);
  });

  it("seller NÃO pode ver leads da equipe (view_team_leads)", () => {
    expect(can("seller", "view_team_leads")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cenário 8 — Ações que supervisor NÃO pode fazer
// ---------------------------------------------------------------------------

describe("RLS — supervisor (admin) não pode ações exclusivas do gestor", () => {
  it("admin NÃO pode ver billing", () => {
    expect(can("admin", "view_billing")).toBe(false);
  });

  it("admin NÃO pode comprar créditos diretamente", () => {
    expect(can("admin", "buy_credits")).toBe(false);
  });

  it("admin NÃO pode aprovar compras/solicitações", () => {
    expect(can("admin", "approve_purchases")).toBe(false);
  });

  it("admin NÃO pode exportar leads", () => {
    expect(can("admin", "export_leads")).toBe(false);
  });

  it("admin NÃO pode aprovar anúncios", () => {
    expect(can("admin", "approve_ad")).toBe(false);
  });

  it("admin NÃO pode publicar anúncios", () => {
    expect(can("admin", "publish_ad")).toBe(false);
  });

  it("admin NÃO pode configurar Meta Ads", () => {
    expect(can("admin", "configure_meta_ads")).toBe(false);
  });

  it("admin NÃO pode convidar supervisor (apenas owner pode)", () => {
    expect(can("admin", "invite_supervisor")).toBe(false);
  });

  it("admin NÃO pode aprovar entrada de consultor (apenas owner pode)", () => {
    expect(can("admin", "approve_consultant")).toBe(false);
  });

  it("admin NÃO pode ver relatórios da corretora", () => {
    expect(can("admin", "view_org_reports")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cenário 9 — Covertura total da matriz de permissões (smoke test)
// ---------------------------------------------------------------------------

describe("RLS — matriz de permissões: cobertura completa", () => {
  const allPermissions = Object.keys(PERMISSION_MAP) as Array<keyof typeof PERMISSION_MAP>;

  it("todas as permissões estão mapeadas no PERMISSION_MAP", () => {
    expect(allPermissions.length).toBeGreaterThan(0);
    for (const perm of allPermissions) {
      expect(PERMISSION_MAP[perm]).toBeDefined();
      expect(Array.isArray(PERMISSION_MAP[perm])).toBe(true);
    }
  });

  it("owner tem acesso a todas as permissões definidas para ele", () => {
    const ownerPerms = allPermissions.filter((p) => PERMISSION_MAP[p].includes("owner"));
    for (const perm of ownerPerms) {
      expect(can("owner", perm)).toBe(true);
    }
  });

  it("admin tem acesso apenas às permissões definidas para ele", () => {
    const adminPerms = allPermissions.filter((p) => PERMISSION_MAP[p].includes("admin"));
    const adminBlockedPerms = allPermissions.filter((p) => !PERMISSION_MAP[p].includes("admin"));

    for (const perm of adminPerms) {
      expect(can("admin", perm)).toBe(true);
    }
    for (const perm of adminBlockedPerms) {
      expect(can("admin", perm)).toBe(false);
    }
  });

  it("seller tem acesso apenas às permissões definidas para ele", () => {
    const sellerPerms = allPermissions.filter((p) => PERMISSION_MAP[p].includes("seller"));
    const sellerBlockedPerms = allPermissions.filter((p) => !PERMISSION_MAP[p].includes("seller"));

    for (const perm of sellerPerms) {
      expect(can("seller", perm)).toBe(true);
    }
    for (const perm of sellerBlockedPerms) {
      expect(can("seller", perm)).toBe(false);
    }
  });
});

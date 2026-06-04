import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamSetupClient } from "./team-setup-client";

vi.mock("./actions", () => ({
  createInviteAction: vi.fn(),
  removeMemberAction: vi.fn(),
  updateMemberRoleAction: vi.fn(),
  updateTeamNameAction: vi.fn()
}));

vi.mock("@/components/billing/subscription-access-banner", () => ({
  SubscriptionAccessBanner: ({ notice }: { notice: { title: string } }) => <div>{notice.title}</div>
}));

const inviteAccess = {
  resource: "team_invites" as const,
  allowed: true,
  reason: "allowed" as const,
  title: "Convites liberados",
  message: "Seu plano atual permite convidar novos membros.",
  actionHref: "/dashboard/perfil/creditos",
  actionLabel: "Ver assinatura",
  limit: null,
  used: null
};

describe("TeamSetupClient", () => {
  it("permite alternar a visualizacao de membros entre equipes para o gestor", () => {
    render(
      <TeamSetupClient
        currentProfileId="owner-1"
        currentRole="owner"
        initialDeactivationRequests={[]}
        initialInvites={[]}
        initialSelectedTeamId="team-norte"
        initialWorkspaceName="Corretora Norte Sul"
        inviteAccess={inviteAccess}
        isRestrictedToSingleTeam={false}
        members={[
          {
            id: "member-1",
            profileId: "admin-1",
            name: "Ana Supervisor",
            email: "ana@leadi.test",
            role: "admin",
            status: "active",
            createdAt: "2026-05-30T12:00:00.000Z",
            teamId: "team-norte",
            teamName: "Equipe Norte"
          },
          {
            id: "member-2",
            profileId: "seller-1",
            name: "Bruno Consultor",
            email: "bruno@leadi.test",
            role: "seller",
            status: "active",
            createdAt: "2026-05-30T12:05:00.000Z",
            teamId: "team-sul",
            teamName: "Equipe Sul"
          }
        ]}
        teams={[
          {
            id: "team-norte",
            organizationId: "org-1",
            name: "Equipe Norte",
            createdByProfileId: "owner-1",
            isActive: true,
            createdAt: "2026-05-30T12:00:00.000Z",
            updatedAt: "2026-05-30T12:00:00.000Z",
            activeMembers: 1,
            pendingMembers: 0
          },
          {
            id: "team-sul",
            organizationId: "org-1",
            name: "Equipe Sul",
            createdByProfileId: "owner-1",
            isActive: true,
            createdAt: "2026-05-30T12:00:00.000Z",
            updatedAt: "2026-05-30T12:00:00.000Z",
            activeMembers: 1,
            pendingMembers: 0
          }
        ]}
        workspaceType="team"
      />
    );

    expect(screen.getByText("Ana Supervisor")).toBeInTheDocument();
    expect(screen.queryByText("Bruno Consultor")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /equipe sul/i }));

    expect(screen.getByText("Bruno Consultor")).toBeInTheDocument();
    expect(screen.queryByText("Ana Supervisor")).not.toBeInTheDocument();
  });

  it("mostra estado vazio quando a equipe selecionada ainda nao tem membros ativos", () => {
    render(
      <TeamSetupClient
        currentProfileId="owner-1"
        currentRole="owner"
        initialDeactivationRequests={[]}
        initialInvites={[]}
        initialSelectedTeamId="team-vazia"
        initialWorkspaceName="Corretora Norte Sul"
        inviteAccess={inviteAccess}
        isRestrictedToSingleTeam={false}
        members={[]}
        teams={[
          {
            id: "team-vazia",
            organizationId: "org-1",
            name: "Equipe Vazia",
            createdByProfileId: "owner-1",
            isActive: true,
            createdAt: "2026-05-30T12:00:00.000Z",
            updatedAt: "2026-05-30T12:00:00.000Z",
            activeMembers: 0,
            pendingMembers: 0
          }
        ]}
        workspaceType="team"
      />
    );

    expect(
      screen.getByText("A equipe Equipe Vazia ainda nao tem membros ativos ou aguardando aprovacao.")
    ).toBeInTheDocument();
  });
});

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Link2,
  Loader2,
  ShieldCheck,
  UserRoundPlus,
  UsersRound
} from "lucide-react";
import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import { PageHeading } from "@/components/dashboard/widgets";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import type {
  TeamInvite,
  TeamMember,
  TeamMemberDeactivationRequest,
  TeamSetupTeam
} from "@/lib/workspaces/team";
import { createInviteAction, removeMemberAction, updateMemberRoleAction, updateTeamNameAction } from "./actions";

type InviteRole = "admin" | "seller";

type TeamSetupClientProps = {
  initialDeactivationRequests: TeamMemberDeactivationRequest[];
  initialSelectedTeamId: string | null;
  initialWorkspaceName: string;
  initialInvites: TeamInvite[];
  inviteAccess: ResourceAccessSummary;
  isRestrictedToSingleTeam: boolean;
  members: TeamMember[];
  currentProfileId: string;
  currentRole: "owner" | "admin" | "seller";
  teams: TeamSetupTeam[];
  workspaceType: "solo" | "team";
};

export function TeamSetupClient({
  initialDeactivationRequests,
  initialSelectedTeamId,
  initialWorkspaceName,
  initialInvites,
  inviteAccess,
  isRestrictedToSingleTeam,
  members,
  currentProfileId,
  currentRole,
  teams,
  workspaceType
}: TeamSetupClientProps) {
  const [workspaceName, setWorkspaceName] = useState(initialWorkspaceName);
  const [invites, setInvites] = useState(initialInvites);
  const [deactivationRequests, setDeactivationRequests] = useState(initialDeactivationRequests);
  const [teamMembers, setTeamMembers] = useState(members);
  const [selectedTeamId, setSelectedTeamId] = useState(initialSelectedTeamId);
  const [latestInvitePath, setLatestInvitePath] = useState(initialInvites[0]?.invitePath ?? "");
  const [inviteRole, setInviteRole] = useState<InviteRole>(currentRole === "owner" ? "admin" : "seller");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [reviewingInviteId, setReviewingInviteId] = useState<string | null>(null);
  const [reviewingDeactivationRequestId, setReviewingDeactivationRequestId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const latestInviteUrl = useAbsoluteInviteUrl(latestInvitePath);
  const canInviteAdmins = currentRole === "owner";
  const accessBullets = getAccessBullets(workspaceType, currentRole);
  const pendingApprovalCount = invites.filter((invite) => isPendingInviteReview(invite)).length;
  const pendingDeactivationCount = deactivationRequests.filter(
    (request) => request.status === "pending"
  ).length;
  const pendingDeactivationByTarget = useMemo(
    () =>
      new Map(
        deactivationRequests
          .filter((request) => request.status === "pending")
          .map((request) => [request.targetProfileId, request])
      ),
    [deactivationRequests]
  );
  const teamSummaries = useMemo(() => {
    const countsByTeamId = new Map<string, { activeMembers: number; pendingMembers: number }>();

    for (const member of teamMembers) {
      if (!member.teamId) {
        continue;
      }

      const currentCounts = countsByTeamId.get(member.teamId) ?? {
        activeMembers: 0,
        pendingMembers: 0
      };

      if (member.status === "active") {
        currentCounts.activeMembers += 1;
      }

      if (member.status === "pending_approval") {
        currentCounts.pendingMembers += 1;
      }

      countsByTeamId.set(member.teamId, currentCounts);
    }

    return teams.map((team) => {
      const counts = countsByTeamId.get(team.id);

      return {
        ...team,
        activeMembers: counts?.activeMembers ?? team.activeMembers,
        pendingMembers: counts?.pendingMembers ?? team.pendingMembers
      };
    });
  }, [teamMembers, teams]);
  const effectiveTeamId = selectedTeamId ?? teamSummaries[0]?.id ?? null;
  const selectedTeam = useMemo(
    () => teamSummaries.find((team) => team.id === effectiveTeamId) ?? null,
    [effectiveTeamId, teamSummaries]
  );
  const visibleMembers = useMemo(() => {
    if (!effectiveTeamId) {
      return teamMembers;
    }

    return teamMembers.filter((member) => member.teamId === effectiveTeamId);
  }, [effectiveTeamId, teamMembers]);
  const canGenerateInviteInCurrentScope =
    workspaceType === "team" &&
    inviteAccess.allowed &&
    (currentRole !== "admin" || Boolean(selectedTeam));
  const visibleInvites = useMemo(() => {
    if (currentRole !== "owner") {
      return invites.slice(0, 4);
    }

    return [...invites]
      .sort((left, right) => Number(isPendingInviteReview(right)) - Number(isPendingInviteReview(left)))
      .slice(0, 8);
  }, [currentRole, invites]);
  const visibleDeactivationRequests = useMemo(() => {
    if (currentRole !== "owner") {
      return deactivationRequests.slice(0, 4);
    }

    return deactivationRequests.slice(0, 8);
  }, [currentRole, deactivationRequests]);

  async function generateInvite() {
    if (!inviteAccess.allowed) {
      setFeedback(inviteAccess.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (currentRole === "admin" && !selectedTeam) {
      setFeedback("Seu usuario ainda nao esta vinculado a uma equipe ativa.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsGenerating(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.set("roleToAssign", inviteRole);
      const result = await createInviteAction(formData);

      if (!result.ok) {
        setFeedback(result.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const token = result.invitePath.split("/").at(-1) ?? result.invitePath;
      const nextInvite: TeamInvite = {
        id: result.id,
        token,
        teamId: selectedTeam?.id ?? null,
        teamName: selectedTeam?.name ?? null,
        invitePath: result.invitePath,
        roleToAssign: result.roleToAssign,
        status: result.status,
        requiresApproval: result.requiresApproval,
        approvalStatus: result.approvalStatus,
        approvedByUserId: null,
        createdAt: new Date().toISOString(),
        expiresAt: result.expiresAt
      };

      setLatestInvitePath(result.invitePath);
      setInvites((currentInvites) => [nextInvite, ...currentInvites]);
      setFeedback(
        result.requiresApproval
          ? "Convite enviado para aprovacao do gestor."
          : "Convite gerado com sucesso."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Erro inesperado em generateInvite:", error);
      setFeedback("Ocorreu um erro inesperado ao gerar o convite. Tente novamente.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyInvite() {
    if (!latestInviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      setFeedback("Link copiado para a area de transferencia.");
    } catch {
      setFeedback("Nao foi possivel copiar automaticamente.");
    }
  }

  async function saveTeamName(formData: FormData) {
    setIsSavingName(true);
    setFeedback(null);

    try {
      const result = await updateTeamNameAction(formData);
      if (result.ok) {
        setWorkspaceName(String(formData.get("workspaceName") ?? workspaceName));
        setFeedback("Nome comercial atualizado.");
      } else {
        setFeedback(result.error);
      }
    } finally {
      setIsSavingName(false);
    }
  }

  async function promoteMember(memberProfileId: string, nextRole: InviteRole) {
    setBusyMemberId(memberProfileId);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.set("memberProfileId", memberProfileId);
      formData.set("role", nextRole);
      const result = await updateMemberRoleAction(formData);
      if (result.ok) {
        setTeamMembers((currentMembers) =>
          currentMembers.map((member) =>
            member.profileId === memberProfileId ? { ...member, role: nextRole } : member
          )
        );
        setFeedback("Papel do membro atualizado.");
      } else {
        setFeedback(result.error);
      }
    } finally {
      setBusyMemberId(null);
    }
  }

  async function removeMember(memberProfileId: string) {
    setBusyMemberId(memberProfileId);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.set("memberProfileId", memberProfileId);
      const result = await removeMemberAction(formData);
      if (result.ok) {
        if (result.result.outcome === "requested") {
          if (result.result.request) {
            setDeactivationRequests((currentRequests) => [
              result.result.request!,
              ...currentRequests.filter((request) => request.id !== result.result.request!.id)
            ]);
          }
          setFeedback("Solicitacao de desativacao enviada ao gestor.");
          return;
        }

        setTeamMembers((currentMembers) =>
          currentMembers.filter((member) => member.profileId !== memberProfileId)
        );
        setDeactivationRequests((currentRequests) =>
          currentRequests.filter(
            (request) =>
              request.targetProfileId !== memberProfileId &&
              !result.result.closedRequestIds.includes(request.id)
          )
        );
        setFeedback("Membro desativado e leads liberados para redistribuicao.");
      } else {
        setFeedback(result.error);
      }
    } finally {
      setBusyMemberId(null);
    }
  }

  async function reviewInvite(inviteId: string, decision: "approved" | "rejected") {
    setReviewingInviteId(inviteId);
    setFeedback(null);

    try {
      const response = await fetch("/api/invites/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inviteId,
          decision
        })
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        invite?: TeamInvite;
      };

      if (!response.ok || !data.invite) {
        setFeedback(data.error ?? "Nao foi possivel revisar o convite agora.");
        return;
      }

      setInvites((currentInvites) =>
        currentInvites.map((invite) => (invite.id === inviteId ? data.invite! : invite))
      );
      setFeedback(
        decision === "approved"
          ? "Convite aprovado com sucesso."
          : "Convite rejeitado com sucesso."
      );
    } catch {
      setFeedback("Nao foi possivel revisar o convite agora.");
    } finally {
      setReviewingInviteId(null);
    }
  }

  async function reviewDeactivationRequest(
    requestId: string,
    decision: "approved" | "rejected"
  ) {
    setReviewingDeactivationRequestId(requestId);
    setFeedback(null);

    try {
      const response = await fetch("/api/teams/members/deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requestId,
          decision
        })
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        result?: {
          outcome: "approved" | "rejected";
          targetProfileId: string;
          closedRequestIds: string[];
          request?: TeamMemberDeactivationRequest;
        };
      };

      if (!response.ok || !data.result) {
        setFeedback(data.error ?? "Nao foi possivel revisar a desativacao agora.");
        return;
      }

      setDeactivationRequests((currentRequests) =>
        currentRequests.filter((request) => !data.result!.closedRequestIds.includes(request.id))
      );

      if (data.result.outcome === "approved") {
        setTeamMembers((currentMembers) =>
          currentMembers.filter((member) => member.profileId !== data.result!.targetProfileId)
        );
        setFeedback("Membro desativado e leads liberados para redistribuicao.");
        return;
      }

      setFeedback("Solicitacao de desativacao rejeitada.");
    } catch {
      setFeedback("Nao foi possivel revisar a desativacao agora.");
    } finally {
      setReviewingDeactivationRequestId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Equipe"
        title={
          workspaceType === "team"
            ? currentRole === "owner"
              ? "Gestao das equipes"
              : "Minha equipe"
            : "Workspace individual"
        }
        description={
          workspaceType === "team"
            ? currentRole === "owner"
              ? "Acompanhe todas as equipes da operacao, veja membros ativos e concentre a gestao em uma tela so."
              : "Acompanhe apenas a sua equipe, convide consultores e monitore os membros ativos do seu time."
            : "Seu workspace ainda e individual. Quando virar equipe, os convites e papéis aparecem aqui."
        }
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-white/58 px-4 py-2 text-sm font-semibold text-ink">
          <ShieldCheck size={16} aria-hidden="true" />
          {currentRole === "owner" ? "Owner" : currentRole === "admin" ? "Admin" : "Consultor"}
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud transition hover:bg-ink/90"
          href="/dashboard"
        >
          Voltar
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      {!inviteAccess.allowed ? <SubscriptionAccessBanner notice={inviteAccess} /> : null}

      {feedback ? (
        <p className="rounded-[22px] bg-white/50 px-4 py-3 text-sm font-semibold text-ink">
          {feedback}
        </p>
      ) : null}

      {currentRole === "owner" && pendingApprovalCount > 0 ? (
        <p className="rounded-[22px] bg-cobalt/12 px-4 py-3 text-sm font-semibold text-ink">
          {pendingApprovalCount === 1
            ? "1 convite aguarda sua aprovacao."
            : `${pendingApprovalCount} convites aguardam sua aprovacao.`}
        </p>
      ) : null}

      {currentRole === "owner" && pendingDeactivationCount > 0 ? (
        <p className="rounded-[22px] bg-signal/24 px-4 py-3 text-sm font-semibold text-ink dark:text-cloud">
          {pendingDeactivationCount === 1
            ? "1 desativacao aguarda sua aprovacao."
            : `${pendingDeactivationCount} desativacoes aguardam sua aprovacao.`}
        </p>
      ) : null}

      {workspaceType === "team" ? (
        <section className="glass-strong rounded-[34px] p-5">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-medium text-cobalt">Equipes</p>
              <h2 className="mt-2 text-2xl font-semibold">
                {!isRestrictedToSingleTeam ? "Visao por equipe" : "Equipe vinculada"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/62">
                {!isRestrictedToSingleTeam
                  ? "Selecione uma equipe para ver os membros ativos, acompanhar pendencias e evitar misturar times diferentes."
                  : "Seu perfil fica restrito ao time em que voce atua. Consultores continuam sem acesso a esta area."}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-4 py-2 text-sm font-semibold text-ink">
              <UsersRound size={16} aria-hidden="true" />
              {teamSummaries.length === 1 ? "1 equipe visivel" : `${teamSummaries.length} equipes visiveis`}
            </span>
          </div>

          {teamSummaries.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {teamSummaries.map((team) => {
                const isSelected = team.id === effectiveTeamId;

                return (
                  <button
                    aria-pressed={isSelected}
                    className={`rounded-[26px] border p-4 text-left transition ${
                      isSelected
                        ? "border-cobalt/50 bg-cobalt/10 shadow-soft"
                        : "border-white/45 bg-white/38 hover:border-cobalt/28 hover:bg-white/52"
                    }`}
                    disabled={isRestrictedToSingleTeam}
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{team.name}</p>
                        <p className="mt-1 text-xs text-ink/54">
                          {team.isActive ? "Equipe ativa" : "Equipe desativada"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/64 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/72">
                        {team.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-2xl bg-white/58 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/48">
                          Ativos
                        </p>
                        <p className="mt-2 text-2xl font-semibold">{team.activeMembers}</p>
                      </div>
                      <div className="rounded-2xl bg-white/58 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/48">
                          Pendentes
                        </p>
                        <p className="mt-2 text-2xl font-semibold">{team.pendingMembers}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            ) : (
              <div className="rounded-[26px] bg-white/44 px-5 py-6 text-sm leading-6 text-ink/62">
                {!isRestrictedToSingleTeam
                  ? "Nenhuma equipe foi cadastrada ainda. Assim que a primeira equipe estiver pronta, os membros aparecem aqui com contadores de ativos e pendentes."
                  : "Seu usuario ainda nao esta vinculado a uma equipe ativa. Fale com o gestor para revisar o cadastro do seu time."}
              </div>
            )}
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-stretch">
        <div className="space-y-4">
          <section className="glass-strong rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cobalt">Workspace</p>
                <h2 className="mt-2 text-2xl font-semibold">Nome da corretora</h2>
              </div>
              <UsersRound size={22} aria-hidden="true" />
            </div>
            <form action={saveTeamName} className="flex flex-col gap-3 sm:flex-row">
              <input
                className="liquid-input"
                defaultValue={workspaceName}
                name="workspaceName"
                placeholder="Nome da corretora ou equipe"
                required
                type="text"
              />
              <button
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud transition hover:bg-ink/90 disabled:opacity-60"
                disabled={isSavingName}
                type="submit"
              >
                {isSavingName ? "Salvando..." : "Salvar"}
              </button>
            </form>
          </section>

          <section className="glass rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cobalt">Membros</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {selectedTeam ? selectedTeam.name : "Equipe ativa"}
                </h2>
              </div>
              <UserRoundPlus size={22} aria-hidden="true" />
            </div>
            {selectedTeam ? (
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/58 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink/72">
                  {selectedTeam.activeMembers} ativos
                </span>
                <span className="rounded-full bg-white/58 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink/72">
                  {selectedTeam.pendingMembers} pendentes
                </span>
              </div>
            ) : null}
            {visibleMembers.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {visibleMembers.map((member) => {
                  const isSelf = member.profileId === currentProfileId;
                  const pendingDeactivationRequest = pendingDeactivationByTarget.get(member.profileId);
                  const canRemoveMember =
                    !isSelf &&
                    ((currentRole === "owner" && member.role !== "owner") ||
                      (currentRole === "admin" && member.role === "seller"));
                  const canPromote = currentRole === "owner" && member.role === "seller";
                  const canDemote = currentRole === "owner" && member.role === "admin";
                  const isBusy = busyMemberId === member.profileId;

                  return (
                    <article className="rounded-[24px] bg-white/42 p-4" key={member.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{member.name}</h3>
                          <p className="mt-1 text-sm text-ink/56">{member.email}</p>
                        </div>
                        <span className="rounded-full bg-white/64 px-3 py-1 text-xs font-semibold">
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                      <p className="mt-4 text-sm font-medium text-ink/58">
                        Status: {getMemberStatusLabel(member.status)}
                      </p>
                      {isSelf ? (
                        <p className="mt-3 text-xs text-ink/54">Seu acesso atual</p>
                      ) : null}
                      {canRemoveMember || canPromote || canDemote ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {canPromote ? (
                            <button
                              className="inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                              disabled={isBusy}
                              onClick={() => promoteMember(member.profileId, "admin")}
                              type="button"
                            >
                              {isBusy ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : null}
                              Promover a admin
                            </button>
                          ) : null}
                          {canDemote ? (
                            <button
                              className="inline-flex items-center gap-2 rounded-full bg-white/72 px-4 py-2 text-xs font-semibold text-ink disabled:opacity-60"
                              disabled={isBusy}
                              onClick={() => promoteMember(member.profileId, "seller")}
                              type="button"
                            >
                              {isBusy ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : null}
                              Rebaixar a consultor
                            </button>
                          ) : null}
                          {canRemoveMember ? (
                            <button
                              className="inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-xs font-semibold text-ink dark:text-cloud disabled:opacity-60"
                              disabled={isBusy || Boolean(pendingDeactivationRequest)}
                              onClick={() => removeMember(member.profileId)}
                              type="button"
                            >
                              {isBusy ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : null}
                              {pendingDeactivationRequest
                                ? "Solicitacao pendente"
                                : currentRole === "owner"
                                  ? "Desativar"
                                  : "Solicitar desativacao"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[26px] bg-white/44 px-5 py-6 text-sm leading-6 text-ink/62">
                {selectedTeam
                  ? `A equipe ${selectedTeam.name} ainda nao tem membros ativos ou aguardando aprovacao.`
                  : "Nenhuma equipe foi selecionada para mostrar os membros."}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="glass-strong rounded-[34px] p-5">
            <h2 className="text-xl font-semibold">Convite por link</h2>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Gere um link de convite e compartilhe com o novo membro. Sem provedor de email
              configurado, o fluxo permanece por link para manter o onboarding confiável agora.
            </p>

            {workspaceType === "team" ? (
              <>
                <label className="mt-5 block text-sm font-medium text-ink/72" htmlFor="inviteRole">
                  Papel do novo membro
                </label>
                <select
                  className="liquid-input mt-2"
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as InviteRole)}
                >
                  {canInviteAdmins ? <option value="admin">Admin</option> : null}
                  <option value="seller">Consultor</option>
                </select>
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud transition hover:bg-ink/90 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isGenerating}
                  onClick={generateInvite}
                  type="button"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
                  Gerar convite
                </button>
                {currentRole === "admin" && !selectedTeam ? (
                  <p className="mt-3 rounded-[18px] bg-white/48 px-4 py-3 text-sm leading-6 text-ink/62">
                    Seu usuario precisa estar vinculado a uma equipe ativa para gerar convites de
                    consultor.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-5 rounded-[22px] bg-white/48 px-4 py-3 text-sm leading-6 text-ink/62">
                Este workspace ainda e individual. Ative uma equipe para liberar convites e
                controle de membros.
              </p>
            )}

            <div className="mt-5 rounded-[22px] bg-white/48 p-3 text-sm font-semibold text-ink/70">
              {latestInviteUrl || "Gere um convite para criar o primeiro link."}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cloud disabled:opacity-50"
                disabled={!latestInviteUrl}
                onClick={copyInvite}
                type="button"
              >
                <Copy size={16} aria-hidden="true" />
                Copiar link
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isGenerating}
                onClick={generateInvite}
                type="button"
              >
                <Link2 size={16} aria-hidden="true" />
                Novo token
              </button>
            </div>
          </section>

          <section className="glass rounded-[34px] p-5">
            <h2 className="text-xl font-semibold">Acesso por papel</h2>
            <div className="mt-5 space-y-3">
              {accessBullets.map((item) => (
                <div className="flex items-center gap-3 rounded-2xl bg-white/42 px-4 py-3" key={item}>
                  <CheckCircle2 className="text-lagoon" size={18} aria-hidden="true" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {visibleDeactivationRequests.length > 0 ? (
            <section className="glass rounded-[34px] p-5">
              <h2 className="text-xl font-semibold">
                {currentRole === "owner" ? "Desativacoes pendentes" : "Solicitacoes recentes"}
              </h2>
              <div className="mt-4 space-y-3">
                {visibleDeactivationRequests.map((request) => (
                  <div className="rounded-[20px] bg-white/42 p-3" key={request.id}>
                    <p className="text-sm font-semibold">{request.targetName}</p>
                    <p className="mt-1 text-xs text-ink/54">
                      Papel: {getRoleLabel(request.targetRole)}
                    </p>
                    <p className="mt-1 text-xs text-ink/54">
                      Solicitado por: {request.requestedByName}
                    </p>
                    {request.teamName ? (
                      <p className="mt-1 text-xs text-ink/54">Equipe: {request.teamName}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-ink/54">
                      Status: {getDeactivationRequestStatusLabel(request.status)}
                    </p>
                    {currentRole === "owner" && request.status === "pending" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          disabled={reviewingDeactivationRequestId === request.id}
                          onClick={() => reviewDeactivationRequest(request.id, "approved")}
                          type="button"
                        >
                          {reviewingDeactivationRequestId === request.id ? (
                            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                          ) : null}
                          Aprovar
                        </button>
                        <button
                          className="inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-xs font-semibold text-ink dark:text-cloud disabled:opacity-60"
                          disabled={reviewingDeactivationRequestId === request.id}
                          onClick={() => reviewDeactivationRequest(request.id, "rejected")}
                          type="button"
                        >
                          {reviewingDeactivationRequestId === request.id ? (
                            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                          ) : null}
                          Rejeitar
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {invites.length > 0 ? (
            <section className="glass rounded-[34px] p-5">
              <h2 className="text-xl font-semibold">Convites recentes</h2>
              <div className="mt-4 space-y-3">
                {visibleInvites.map((invite) => (
                  <div className="rounded-[20px] bg-white/42 p-3" key={invite.id}>
                    <p className="truncate text-sm font-semibold">{invite.invitePath}</p>
                    {invite.teamName ? (
                      <p className="mt-1 text-xs text-ink/54">Equipe: {invite.teamName}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-ink/54">Papel: {getRoleLabel(invite.roleToAssign)}</p>
                    <p className="mt-1 text-xs text-ink/54">
                      Status: {getInviteStatusLabel(invite)}
                    </p>
                    {currentRole === "owner" && isPendingInviteReview(invite) ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          disabled={reviewingInviteId === invite.id}
                          onClick={() => reviewInvite(invite.id, "approved")}
                          type="button"
                        >
                          {reviewingInviteId === invite.id ? (
                            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                          ) : null}
                          Aprovar
                        </button>
                        <button
                          className="inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-xs font-semibold text-ink dark:text-cloud disabled:opacity-60"
                          disabled={reviewingInviteId === invite.id}
                          onClick={() => reviewInvite(invite.id, "rejected")}
                          type="button"
                        >
                          {reviewingInviteId === invite.id ? (
                            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                          ) : null}
                          Rejeitar
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function getRoleLabel(role: "owner" | "admin" | "seller" | InviteRole) {
  return role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Consultor";
}

function getMemberStatusLabel(status: TeamMember["status"]) {
  if (status === "active") {
    return "ativo";
  }

  if (status === "pending_approval") {
    return "pendente de aprovacao";
  }

  if (status === "invited") {
    return "convidado";
  }

  if (status === "removed") {
    return "removido";
  }

  return "inativo";
}

function getAccessBullets(workspaceType: "solo" | "team", currentRole: "owner" | "admin" | "seller") {
  if (workspaceType !== "team") {
    return [
      "Workspace individual: o owner controla nome, integrações e webhook.",
      "Quando a equipe for ativada, você poderá convidar membros por link."
    ];
  }

  if (currentRole === "owner") {
    return [
      "Owner: convida admins e consultores, altera nome e gerencia membros.",
      "Admin: convida consultores e organiza a operação comercial.",
      "Consultor: trabalha apenas sua carteira e leads permitidos."
    ];
  }

  if (currentRole === "admin") {
    return [
      "Admin: coordena a equipe e convida consultores.",
      "Consultor: trabalha apenas sua carteira e leads permitidos."
    ];
  }

  return ["Consultor: trabalha apenas sua carteira e leads permitidos."];
}

function getInviteStatusLabel(invite: TeamInvite) {
  if (invite.status === "used") {
    return "aceito";
  }

  if (invite.status === "expired") {
    return "expirado";
  }

  if (invite.approvalStatus === "pending") {
    return "pendente de aprovacao";
  }

  if (invite.approvalStatus === "approved") {
    return "aprovado";
  }

  if (invite.approvalStatus === "rejected") {
    return "rejeitado";
  }

  return "ativo";
}

function getDeactivationRequestStatusLabel(
  status: TeamMemberDeactivationRequest["status"]
) {
  if (status === "pending") {
    return "pendente de aprovacao";
  }

  if (status === "approved") {
    return "aprovado";
  }

  if (status === "rejected") {
    return "rejeitado";
  }

  return "cancelado";
}

function isPendingInviteReview(invite: TeamInvite) {
  return invite.requiresApproval && invite.approvalStatus === "pending" && invite.status === "active";
}

function useAbsoluteInviteUrl(invitePath: string) {
  return useMemo(() => {
    if (!invitePath || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}${invitePath}`;
  }, [invitePath]);
}

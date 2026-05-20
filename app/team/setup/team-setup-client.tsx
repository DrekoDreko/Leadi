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
import type { TeamInvite, TeamMember } from "@/lib/workspaces/team";
import { createInviteAction, removeMemberAction, updateMemberRoleAction, updateTeamNameAction } from "./actions";

type InviteRole = "admin" | "seller";

type TeamSetupClientProps = {
  initialWorkspaceName: string;
  initialInvites: TeamInvite[];
  inviteAccess: ResourceAccessSummary;
  members: TeamMember[];
  currentProfileId: string;
  currentRole: "owner" | "admin" | "seller";
  workspaceType: "solo" | "team";
};

export function TeamSetupClient({
  initialWorkspaceName,
  initialInvites,
  inviteAccess,
  members,
  currentProfileId,
  currentRole,
  workspaceType
}: TeamSetupClientProps) {
  const [workspaceName, setWorkspaceName] = useState(initialWorkspaceName);
  const [invites, setInvites] = useState(initialInvites);
  const [teamMembers, setTeamMembers] = useState(members);
  const [latestInvitePath, setLatestInvitePath] = useState(initialInvites[0]?.invitePath ?? "");
  const [inviteRole, setInviteRole] = useState<InviteRole>(currentRole === "owner" ? "admin" : "seller");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const latestInviteUrl = useAbsoluteInviteUrl(latestInvitePath);
  const canInviteAdmins = currentRole === "owner";
  const accessBullets = getAccessBullets(workspaceType, currentRole);

  async function generateInvite() {
    if (!inviteAccess.allowed) {
      setFeedback(inviteAccess.message);
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
        return;
      }

      const token = result.invitePath.split("/").at(-1) ?? result.invitePath;
      const nextInvite: TeamInvite = {
        id: token,
        token,
        invitePath: result.invitePath,
        roleToAssign: result.roleToAssign,
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: result.expiresAt
      };

      setLatestInvitePath(result.invitePath);
      setInvites((currentInvites) => [nextInvite, ...currentInvites]);
      setFeedback("Convite gerado com sucesso.");
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
        setTeamMembers((currentMembers) =>
          currentMembers.filter((member) => member.profileId !== memberProfileId)
        );
        setFeedback("Membro removido da equipe.");
      } else {
        setFeedback(result.error);
      }
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Equipe"
        title={workspaceType === "team" ? "Gestao da equipe" : "Workspace individual"}
        description={
          workspaceType === "team"
            ? "Convide administradores e consultores, ajuste papéis e acompanhe os membros ativos."
            : "Seu workspace ainda e individual. Quando virar equipe, os convites e papéis aparecem aqui."
        }
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-white/58 px-4 py-2 text-sm font-semibold text-ink">
          <ShieldCheck size={16} aria-hidden="true" />
          {currentRole === "owner" ? "Owner" : currentRole === "admin" ? "Admin" : "Consultor"}
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
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
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
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
                <h2 className="mt-2 text-2xl font-semibold">Equipe ativa</h2>
              </div>
              <UserRoundPlus size={22} aria-hidden="true" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {teamMembers.map((member) => {
                const isSelf = member.profileId === currentProfileId;
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
                      Status: {member.status === "active" ? "ativo" : member.status === "invited" ? "convidado" : "removido"}
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
                            className="inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-xs font-semibold text-ink disabled:opacity-60"
                            disabled={isBusy}
                            onClick={() => removeMember(member.profileId)}
                            type="button"
                          >
                            {isBusy ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : null}
                            Remover
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
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
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-70"
                  disabled={isGenerating || !inviteAccess.allowed}
                  onClick={generateInvite}
                  type="button"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
                  Gerar convite
                </button>
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
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={!latestInviteUrl}
                onClick={copyInvite}
                type="button"
              >
                <Copy size={16} aria-hidden="true" />
                Copiar link
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-50"
                disabled={isGenerating || !inviteAccess.allowed || workspaceType !== "team"}
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

          {invites.length > 0 ? (
            <section className="glass rounded-[34px] p-5">
              <h2 className="text-xl font-semibold">Convites recentes</h2>
              <div className="mt-4 space-y-3">
                {invites.slice(0, 4).map((invite) => (
                  <div className="rounded-[20px] bg-white/42 p-3" key={invite.id}>
                    <p className="truncate text-sm font-semibold">{invite.invitePath}</p>
                    <p className="mt-1 text-xs text-ink/54">Papel: {getRoleLabel(invite.roleToAssign)}</p>
                    <p className="mt-1 text-xs text-ink/54">Status: {invite.status}</p>
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

function useAbsoluteInviteUrl(invitePath: string) {
  return useMemo(() => {
    if (!invitePath || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}${invitePath}`;
  }, [invitePath]);
}

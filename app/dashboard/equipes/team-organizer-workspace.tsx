"use client";

import {
  type DragEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Coins,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Send,
  ShieldCheck,
  UserCog,
  UserMinus,
  UserPlus,
  UserX,
  Users,
  UsersRound,
  X
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import type { TeamSetupTeam, TeamMember } from "@/lib/workspaces/team";
import type { CreditWallet } from "@/lib/ai/wallets.server";
import {
  reassignMemberAction,
  deactivateTeamAction,
  deactivateMemberAction,
  reactivateMemberAction,
  updateTeamNameAction,
  promoteMemberAction,
  demoteSupervisorAction,
  changeTeamSupervisorAction
} from "./actions";
import { updateWorkspaceNameAction } from "./actions";

type Tab = "organizar" | "creditos" | "desativados";

type TeamOrganizerWorkspaceProps = {
  teams: TeamSetupTeam[];
  members: TeamMember[];
  deactivatedMembers: TeamMember[];
  wallets: CreditWallet[];
  inviteAccess: ResourceAccessSummary;
  workspaceName: string;
};

export function TeamOrganizerWorkspace({
  teams,
  members: initialMembers,
  deactivatedMembers: initialDeactivatedMembers,
  wallets: initialWallets,
  inviteAccess,
  workspaceName: initialWorkspaceName
}: TeamOrganizerWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<Tab>("organizar");
  const [members, setMembers] = useState(initialMembers);
  const [deactivatedMembers, setDeactivatedMembers] = useState(initialDeactivatedMembers);
  const [wallets, setWallets] = useState(initialWallets);
  const [draggedProfileId, setDraggedProfileId] = useState<string | null>(null);
  const [activeDropTeamId, setActiveDropTeamId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [workspaceName, setWorkspaceName] = useState(initialWorkspaceName);
  const [isSavingName, setIsSavingName] = useState(false);

  const [consultantMenu, setConsultantMenu] = useState<{
    member: TeamMember;
    anchorRect: DOMRect;
  } | null>(null);
  const [teamMenu, setTeamMenu] = useState<{
    team: TeamSetupTeam;
    supervisor: TeamMember | undefined;
    anchorRect: DOMRect;
  } | null>(null);
  const [supervisorChangeTarget, setSupervisorChangeTarget] = useState<{
    teamId: string;
    teamName: string;
    candidates: TeamMember[];
  } | null>(null);
  const [editingTeamName, setEditingTeamName] = useState<{
    teamId: string;
    currentName: string;
  } | null>(null);

  const consultants = members.filter((m) => m.role === "seller");
  const orgWallet = wallets.find((w) => w.walletType === "organization");

  const getTeamConsultants = useCallback(
    (teamId: string) => consultants.filter((m) => m.teamId === teamId && m.status === "active"),
    [consultants]
  );

  const getUnassignedConsultants = useCallback(
    () => {
      const assignedTeamIds = new Set(teams.map((t) => t.id));
      return consultants.filter(
        (m) => !m.teamId || !assignedTeamIds.has(m.teamId) || m.status !== "active"
      );
    },
    [consultants, teams]
  );

  const getSupervisor = useCallback(
    (teamId: string) => members.find((m) => m.role === "admin" && m.teamId === teamId),
    [members]
  );

  // -- Drag and Drop --

  function handleDragStart(event: DragEvent<HTMLElement>, profileId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", profileId);
    setDraggedProfileId(profileId);
    setFeedback(null);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, teamId: string | null) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setActiveDropTeamId(teamId);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>, teamId: string | null) {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
      return;
    }
    setActiveDropTeamId((current) => (current === teamId ? null : current));
  }

  function handleDrop(event: DragEvent<HTMLElement>, toTeamId: string | null) {
    event.preventDefault();
    const profileId = event.dataTransfer.getData("text/plain") || draggedProfileId;
    setDraggedProfileId(null);
    setActiveDropTeamId(null);

    if (!profileId) return;

    const member = consultants.find((m) => m.profileId === profileId);
    if (!member) return;

    const fromTeamId = member.teamId;
    if (fromTeamId === toTeamId) return;

    const targetTeam = toTeamId ? teams.find((t) => t.id === toTeamId) : null;
    setMembers((prev) =>
      prev.map((m) =>
        m.profileId === profileId
          ? { ...m, teamId: toTeamId, teamName: targetTeam?.name ?? null, status: toTeamId ? "active" : m.status }
          : m
      )
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.set("profileId", profileId);
      if (fromTeamId) formData.set("fromTeamId", fromTeamId);
      if (toTeamId) formData.set("toTeamId", toTeamId);

      const result = await reassignMemberAction(formData);

      if (result.error) {
        setMembers(initialMembers);
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({
          type: "success",
          message: `${member.name} movido para ${targetTeam?.name ?? "Sem Equipe"}.`
        });
      }
    });
  }

  function handleDragEnd() {
    setDraggedProfileId(null);
    setActiveDropTeamId(null);
  }

  // -- Actions --

  function runAction(action: (formData: FormData) => Promise<{ success?: boolean; error?: string }>, formData: FormData) {
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: "Ação realizada com sucesso." });
      }
    });
  }

  function handlePromoteMember(profileId: string) {
    setConsultantMenu(null);
    const fd = new FormData();
    fd.set("profileId", profileId);
    runAction(promoteMemberAction, fd);
  }

  function handleDeactivateMember(profileId: string) {
    setConsultantMenu(null);
    setTeamMenu(null);
    const fd = new FormData();
    fd.set("profileId", profileId);
    runAction(deactivateMemberAction, fd);
  }

  function handleReactivateMember(profileId: string) {
    const fd = new FormData();
    fd.set("profileId", profileId);
    runAction(reactivateMemberAction, fd);
  }

  function handleDeactivateTeam(teamId: string) {
    setTeamMenu(null);
    const fd = new FormData();
    fd.set("teamId", teamId);
    runAction(deactivateTeamAction, fd);
  }

  function handleDemoteSupervisor(profileId: string) {
    setTeamMenu(null);
    const fd = new FormData();
    fd.set("profileId", profileId);
    runAction(demoteSupervisorAction, fd);
  }

  function handleUpdateTeamName(teamId: string, name: string) {
    setEditingTeamName(null);
    const fd = new FormData();
    fd.set("teamId", teamId);
    fd.set("name", name);
    runAction(updateTeamNameAction, fd);
  }

  function handleChangeTeamSupervisor(teamId: string, newSupervisorProfileId: string) {
    setSupervisorChangeTarget(null);
    const fd = new FormData();
    fd.set("teamId", teamId);
    fd.set("newSupervisorProfileId", newSupervisorProfileId);
    runAction(changeTeamSupervisorAction, fd);
  }

  function openSupervisorChangeModal(team: TeamSetupTeam) {
    setTeamMenu(null);
    const candidates = getTeamConsultants(team.id);
    setSupervisorChangeTarget({
      teamId: team.id,
      teamName: team.name,
      candidates
    });
  }

  function openEditTeamNameModal(team: TeamSetupTeam) {
    setTeamMenu(null);
    setEditingTeamName({
      teamId: team.id,
      currentName: team.name
    });
  }

  // -- Credit Distribution --

  async function distributeCredits(
    targetType: "team" | "user",
    targetId: string,
    amount: number,
    inputEl: HTMLInputElement
  ) {
    if (!orgWallet || amount <= 0) return;

    try {
      const response = await fetch("/api/credits/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWalletId: orgWallet.id,
          walletType: targetType,
          ...(targetType === "team" ? { teamId: targetId } : { targetUserId: targetId }),
          amount,
          reason: "Distribuição de créditos pelo gestor"
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setFeedback({ type: "error", message: data.error ?? "Erro ao distribuir créditos." });
        return;
      }

      const data = await response.json();

      // A alocação do pool da org retorna orgPoolBalance; as demais, fromWalletBalance.
      const newFromBalance =
        data.allocation.fromWalletBalance ?? data.allocation.orgPoolBalance;

      setWallets((prev) =>
        prev.map((w) => {
          if (w.id === orgWallet.id && typeof newFromBalance === "number") {
            return { ...w, availableCredits: newFromBalance };
          }
          return w;
        })
      );

      const refreshRes = await fetch("/api/credits/wallets");
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setWallets(refreshData.wallets);
      }

      inputEl.value = "";
      setFeedback({ type: "success", message: `${amount} créditos distribuídos com sucesso.` });
    } catch {
      setFeedback({ type: "error", message: "Erro ao distribuir créditos." });
    }
  }

  async function saveWorkspaceName(formData: FormData) {
    setIsSavingName(true);
    setFeedback(null);
    try {
      const result = await updateWorkspaceNameAction(formData);
      if (result.ok) {
        setWorkspaceName(String(formData.get("workspaceName") ?? workspaceName));
        setFeedback({ type: "success", message: "Nome comercial atualizado." });
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    } finally {
      setIsSavingName(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        eyebrow="Gestão"
        title="Organizador de Equipes"
        description="Arraste consultores entre equipes e distribua créditos."
      />

      <Link
        href="/team/invite"
        className="campaign-liquid-hero relative flex items-center gap-4 overflow-hidden rounded-[28px] border border-border/60 p-5 text-white shadow-[0_20px_60px_rgba(10,18,39,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(10,18,39,0.34)]"
      >
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
          <UserPlus size={22} />
        </span>
        <div className="relative min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Convidar membro</h3>
          <p className="mt-0.5 text-xs leading-5 text-white/60">
            Adicione um novo consultor ou supervisor a sua equipe.
          </p>
        </div>
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/20">
          <ArrowRight size={18} />
        </span>
      </Link>

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-red-500/15 text-red-700 dark:text-red-400"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <TabButton active={activeTab === "organizar"} onClick={() => setActiveTab("organizar")}>
          <Users className="mr-2 inline-block h-4 w-4" />
          Organizar Equipes
        </TabButton>
        <TabButton active={activeTab === "creditos"} onClick={() => setActiveTab("creditos")}>
          <Coins className="mr-2 inline-block h-4 w-4" />
          Distribuir Créditos
        </TabButton>
        <TabButton active={activeTab === "desativados"} onClick={() => setActiveTab("desativados")}>
          <UserX className="mr-2 inline-block h-4 w-4" />
          Desativados
        </TabButton>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <div className="flex flex-col gap-4">
          <WorkspaceNameCard
            workspaceName={workspaceName}
            isSavingName={isSavingName}
            onSave={saveWorkspaceName}
          />

          {activeTab === "organizar" && (
            <KanbanBoard
              teams={teams}
              getTeamConsultants={getTeamConsultants}
              getUnassignedConsultants={getUnassignedConsultants}
              getSupervisor={getSupervisor}
              draggedProfileId={draggedProfileId}
              activeDropTeamId={activeDropTeamId}
              isPending={isPending}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onCardClick={(member, anchorRect) => setConsultantMenu({ member, anchorRect })}
              onColumnHeaderClick={(team, supervisor, anchorRect) => setTeamMenu({ team, supervisor, anchorRect })}
            />
          )}

          {activeTab === "creditos" && (
            <CreditDistribution
              orgWallet={orgWallet}
              wallets={wallets}
              teams={teams}
              consultants={consultants}
              getSupervisor={getSupervisor}
              onDistribute={distributeCredits}
            />
          )}

          {activeTab === "desativados" && (
            <DeactivatedUsersPanel
              deactivatedMembers={deactivatedMembers}
              isPending={isPending}
              onReactivate={handleReactivateMember}
            />
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <TeamOverviewCard
            teams={teams}
            members={members}
            deactivatedMembers={deactivatedMembers}
          />
          <AccessByRoleCard />
        </aside>
      </section>

      {/* Popups & Modals */}
      {consultantMenu && (
        <ActionPopover
          anchorRect={consultantMenu.anchorRect}
          onClose={() => setConsultantMenu(null)}
        >
          <ActionItem
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Tornar Admin"
            onClick={() => handlePromoteMember(consultantMenu.member.profileId)}
          />
          <ActionItem
            icon={<UserMinus className="h-4 w-4" />}
            label="Desativar Usuário"
            destructive
            onClick={() => handleDeactivateMember(consultantMenu.member.profileId)}
          />
        </ActionPopover>
      )}

      {teamMenu && (
        <ActionPopover
          anchorRect={teamMenu.anchorRect}
          onClose={() => setTeamMenu(null)}
        >
          <ActionItem
            icon={<UserCog className="h-4 w-4" />}
            label="Alterar Supervisor"
            onClick={() => openSupervisorChangeModal(teamMenu.team)}
          />
          <ActionItem
            icon={<Pencil className="h-4 w-4" />}
            label="Editar Nome da Equipe"
            onClick={() => openEditTeamNameModal(teamMenu.team)}
          />
          <ActionItem
            icon={<Power className="h-4 w-4" />}
            label="Desativar Equipe"
            destructive
            onClick={() => handleDeactivateTeam(teamMenu.team.id)}
          />
          {teamMenu.supervisor && (
            <>
              <ActionItem
                icon={<UserMinus className="h-4 w-4" />}
                label="Desativar Supervisor"
                destructive
                onClick={() => handleDeactivateMember(teamMenu.supervisor!.profileId)}
              />
              <ActionItem
                icon={<ArrowDown className="h-4 w-4" />}
                label="Rebaixar Supervisor"
                onClick={() => handleDemoteSupervisor(teamMenu.supervisor!.profileId)}
              />
            </>
          )}
        </ActionPopover>
      )}

      {supervisorChangeTarget && (
        <Modal onClose={() => setSupervisorChangeTarget(null)}>
          <h2 className="text-lg font-semibold">
            Alterar Supervisor — {supervisorChangeTarget.teamName}
          </h2>
          <p className="text-muted-soft mt-1 text-sm">
            Selecione o novo supervisor da equipe.
          </p>
          {supervisorChangeTarget.candidates.length === 0 ? (
            <p className="text-muted-soft mt-6 text-center text-sm">
              Nenhum consultor disponível nesta equipe.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {supervisorChangeTarget.candidates.map((candidate) => (
                <button
                  key={candidate.profileId}
                  type="button"
                  className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border)/0.5)] bg-[rgb(var(--card)/0.6)] p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(18,23,33,0.1)]"
                  onClick={() =>
                    handleChangeTeamSupervisor(
                      supervisorChangeTarget.teamId,
                      candidate.profileId
                    )
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{candidate.name}</p>
                    <p className="text-muted-soft truncate text-xs">{candidate.email}</p>
                  </div>
                  <ShieldCheck className="h-4 w-4 shrink-0 text-cobalt" />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {editingTeamName && (
        <EditTeamNameModal
          teamId={editingTeamName.teamId}
          currentName={editingTeamName.currentName}
          onSave={handleUpdateTeamName}
          onClose={() => setEditingTeamName(null)}
        />
      )}

      {!inviteAccess.allowed && <SubscriptionAccessBanner notice={inviteAccess} />}
    </div>
  );
}

// -- Tab Button --

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-cobalt text-white"
          : "surface-card text-muted-soft hover:-translate-y-0.5"
      }`}
    >
      {children}
    </button>
  );
}

// -- Kanban Board --

function KanbanBoard({
  teams,
  getTeamConsultants,
  getUnassignedConsultants,
  getSupervisor,
  draggedProfileId,
  activeDropTeamId,
  isPending,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onCardClick,
  onColumnHeaderClick
}: {
  teams: TeamSetupTeam[];
  getTeamConsultants: (teamId: string) => TeamMember[];
  getUnassignedConsultants: () => TeamMember[];
  getSupervisor: (teamId: string) => TeamMember | undefined;
  draggedProfileId: string | null;
  activeDropTeamId: string | null;
  isPending: boolean;
  onDragStart: (event: DragEvent<HTMLElement>, profileId: string) => void;
  onDragOver: (event: DragEvent<HTMLElement>, teamId: string | null) => void;
  onDragLeave: (event: DragEvent<HTMLElement>, teamId: string | null) => void;
  onDrop: (event: DragEvent<HTMLElement>, teamId: string | null) => void;
  onDragEnd: () => void;
  onCardClick: (member: TeamMember, anchorRect: DOMRect) => void;
  onColumnHeaderClick: (team: TeamSetupTeam, supervisor: TeamMember | undefined, anchorRect: DOMRect) => void;
}) {
  const unassigned = getUnassignedConsultants();
  const activeTeams = teams.filter((t) => t.isActive);

  return (
    <div className="flex gap-4 overflow-x-auto px-1 pb-20 pt-1">
      {/* Unassigned column */}
      {unassigned.length > 0 && (
        <KanbanColumn
          title="Sem Equipe"
          subtitle="Não atribuídos"
          teamId={null}
          members={unassigned}
          isDropTarget={activeDropTeamId === "__unassigned__"}
          draggedProfileId={draggedProfileId}
          isPending={isPending}
          onDragStart={onDragStart}
          onDragOver={(e) => onDragOver(e, null)}
          onDragLeave={(e) => onDragLeave(e, null)}
          onDrop={(e) => onDrop(e, null)}
          onDragEnd={onDragEnd}
          onCardClick={onCardClick}
        />
      )}

      {activeTeams.map((team) => {
        const supervisor = getSupervisor(team.id);
        const teamConsultants = getTeamConsultants(team.id);

        return (
          <KanbanColumn
            key={team.id}
            title={team.name}
            subtitle={supervisor ? `Supervisor: ${supervisor.name}` : "Sem supervisor"}
            teamId={team.id}
            team={team}
            supervisor={supervisor}
            members={teamConsultants}
            isDropTarget={activeDropTeamId === team.id}
            draggedProfileId={draggedProfileId}
            isPending={isPending}
            onDragStart={onDragStart}
            onDragOver={(e) => onDragOver(e, team.id)}
            onDragLeave={(e) => onDragLeave(e, team.id)}
            onDrop={(e) => onDrop(e, team.id)}
            onDragEnd={onDragEnd}
            onCardClick={onCardClick}
            onColumnHeaderClick={onColumnHeaderClick}
          />
        );
      })}

      <Link
        href="/dashboard/criar-equipe"
        className="flex min-h-[300px] w-72 shrink-0 flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-cobalt/30 transition-all hover:border-cobalt hover:bg-cobalt/5 hover:-translate-y-0.5"
      >
        <Plus className="h-10 w-10 text-muted-soft" />
        <span className="mt-2 text-sm font-semibold text-muted-soft">Nova Equipe</span>
      </Link>
    </div>
  );
}

function KanbanColumn({
  title,
  subtitle,
  teamId,
  team,
  supervisor,
  members,
  isDropTarget,
  draggedProfileId,
  isPending,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onCardClick,
  onColumnHeaderClick
}: {
  title: string;
  subtitle: string;
  teamId: string | null;
  team?: TeamSetupTeam;
  supervisor?: TeamMember;
  members: TeamMember[];
  isDropTarget: boolean;
  draggedProfileId: string | null;
  isPending: boolean;
  onDragStart: (event: DragEvent<HTMLElement>, profileId: string) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onCardClick: (member: TeamMember, anchorRect: DOMRect) => void;
  onColumnHeaderClick?: (team: TeamSetupTeam, supervisor: TeamMember | undefined, anchorRect: DOMRect) => void;
}) {
  return (
    <div
      className={`flex min-h-[300px] w-72 shrink-0 flex-col rounded-[28px] transition-all ${
        isDropTarget
          ? "ring-2 ring-cobalt/50 bg-cobalt/5"
          : "surface-card"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column header */}
      <div
        className={`border-b border-white/10 p-4 ${team ? "cursor-pointer transition hover:bg-[rgb(var(--border)/0.1)]" : ""} rounded-t-[28px]`}
        onClick={(e) => {
          if (team && onColumnHeaderClick) {
            onColumnHeaderClick(team, supervisor, (e.currentTarget as HTMLElement).getBoundingClientRect());
          }
        }}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-muted-soft mt-0.5 text-xs">{subtitle}</p>
        <span className="text-muted-soft mt-1 inline-block text-xs">
          {members.length} {members.length === 1 ? "consultor" : "consultores"}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2.5 p-3 pb-4">
        {members.map((member) => (
          <ConsultantCard
            key={member.profileId}
            member={member}
            isDragging={draggedProfileId === member.profileId}
            isPending={isPending && draggedProfileId === member.profileId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onCardClick={onCardClick}
          />
        ))}

        {members.length === 0 && (
          <div className="text-muted-soft flex flex-1 items-center justify-center text-center text-xs">
            Arraste consultores para cá
          </div>
        )}
      </div>
    </div>
  );
}

function ConsultantCard({
  member,
  isDragging,
  isPending,
  onDragStart,
  onDragEnd,
  onCardClick
}: {
  member: TeamMember;
  isDragging: boolean;
  isPending: boolean;
  onDragStart: (event: DragEvent<HTMLElement>, profileId: string) => void;
  onDragEnd: () => void;
  onCardClick: (member: TeamMember, anchorRect: DOMRect) => void;
}) {
  const wasDragged = useRef(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        wasDragged.current = true;
        onDragStart(e, member.profileId);
      }}
      onDragEnd={onDragEnd}
      onPointerDown={() => {
        wasDragged.current = false;
      }}
      onClick={(e) => {
        if (!wasDragged.current) {
          onCardClick(member, (e.currentTarget as HTMLElement).getBoundingClientRect());
        }
      }}
      className={`flex cursor-grab items-center gap-3 rounded-2xl border border-[rgb(var(--border)/0.5)] bg-[rgb(var(--card)/0.6)] p-3 shadow-[0_2px_8px_rgba(18,23,33,0.06)] backdrop-blur-sm transition-all active:cursor-grabbing ${
        isDragging ? "opacity-40 scale-95" : "hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(18,23,33,0.1)]"
      }`}
    >
      <GripVertical className="text-muted-soft h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="text-muted-soft truncate text-xs">{member.email}</p>
      </div>
      {isPending && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cobalt" />}
    </div>
  );
}

// -- Action Popover --

function ActionPopover({
  anchorRect,
  onClose,
  children
}: {
  anchorRect: DOMRect;
  onClose: () => void;
  children: ReactNode;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const top = anchorRect.bottom + 8;
    const left = anchorRect.left;
    const popoverWidth = 220;
    const adjustedLeft = Math.min(left, window.innerWidth - popoverWidth - 16);
    const adjustedTop = Math.min(top, window.innerHeight - 200);
    setPosition({ top: adjustedTop, left: Math.max(8, adjustedLeft) });
  }, [anchorRect]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-50 min-w-[200px] surface-card rounded-2xl border border-[rgb(var(--border)/0.5)] p-1.5 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {children}
    </div>,
    document.body
  );
}

function ActionItem({
  icon,
  label,
  destructive,
  onClick
}: {
  icon: ReactNode;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        destructive
          ? "text-red-600 hover:bg-red-500/10 dark:text-red-400"
          : "hover:bg-cobalt/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// -- Modal --

function Modal({
  onClose,
  children
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/42 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="surface-modal relative mx-4 w-full max-w-md rounded-[32px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 transition hover:bg-[rgb(var(--border)/0.2)]"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

// -- Edit Team Name Modal --

function EditTeamNameModal({
  teamId,
  currentName,
  onSave,
  onClose
}: {
  teamId: string;
  currentName: string;
  onSave: (teamId: string, name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-semibold">Editar Nome da Equipe</h2>
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (trimmed) onSave(teamId, trimmed);
        }}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="liquid-input text-sm"
          autoFocus
          placeholder="Nome da equipe"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition surface-card text-muted-soft hover:-translate-y-0.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-full bg-cobalt px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}

// -- Deactivated Users Panel --

function DeactivatedUsersPanel({
  deactivatedMembers,
  isPending,
  onReactivate
}: {
  deactivatedMembers: TeamMember[];
  isPending: boolean;
  onReactivate: (profileId: string) => void;
}) {
  if (deactivatedMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <UserX className="text-muted-soft mb-3 h-10 w-10" />
        <p className="text-muted-soft text-sm">Nenhum usuário desativado.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {deactivatedMembers.map((member) => (
        <div
          key={member.profileId}
          className="surface-card flex flex-col gap-3 rounded-[28px] p-4"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{member.name}</p>
            <p className="text-muted-soft truncate text-xs">{member.email}</p>
            {member.teamName && (
              <p className="text-muted-soft mt-1 text-xs">Equipe: {member.teamName}</p>
            )}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onReactivate(member.profileId)}
            className="flex items-center justify-center gap-1.5 rounded-full bg-cobalt px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reativar
          </button>
        </div>
      ))}
    </div>
  );
}

// -- Credit Distribution --

function CreditDistribution({
  orgWallet,
  wallets,
  teams,
  consultants,
  getSupervisor,
  onDistribute
}: {
  orgWallet: CreditWallet | undefined;
  wallets: CreditWallet[];
  teams: TeamSetupTeam[];
  consultants: TeamMember[];
  getSupervisor: (teamId: string) => TeamMember | undefined;
  onDistribute: (
    targetType: "team" | "user",
    targetId: string,
    amount: number,
    inputEl: HTMLInputElement
  ) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Org wallet balance */}
      <div className="glass-strong flex items-center gap-4 rounded-[34px] p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/15">
          <Coins className="h-6 w-6 text-cobalt" />
        </div>
        <div>
          <p className="text-muted-soft text-sm">Saldo da Organização</p>
          <p className="text-2xl font-semibold">{orgWallet?.availableCredits ?? 0} créditos</p>
        </div>
      </div>

      {/* Teams */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Por Equipe</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.filter((t) => t.isActive).map((team) => {
            const supervisor = getSupervisor(team.id);
            const teamWallet = wallets.find((w) => w.walletType === "team" && w.teamId === team.id);

            return (
              <CreditCard
                key={team.id}
                title={team.name}
                subtitle={supervisor ? `Supervisor: ${supervisor.name}` : "Sem supervisor"}
                balance={teamWallet?.availableCredits ?? 0}
                onDistribute={(amount, inputEl) => onDistribute("team", team.id, amount, inputEl)}
              />
            );
          })}
        </div>
      </div>

      {/* Consultants */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Por Consultor</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {consultants
            .filter((m) => m.status === "active")
            .map((member) => {
              const userWallet = wallets.find(
                (w) => w.walletType === "user" && w.profileId === member.profileId
              );

              return (
                <CreditCard
                  key={member.profileId}
                  title={member.name}
                  subtitle={member.teamName ?? "Sem equipe"}
                  balance={userWallet?.availableCredits ?? 0}
                  onDistribute={(amount, inputEl) =>
                    onDistribute("user", member.profileId, amount, inputEl)
                  }
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}

function CreditCard({
  title,
  subtitle,
  balance,
  onDistribute
}: {
  title: string;
  subtitle: string;
  balance: number;
  onDistribute: (amount: number, inputEl: HTMLInputElement) => void;
}) {
  return (
    <div className="surface-card flex flex-col gap-3 rounded-[28px] p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-soft text-xs">{subtitle}</p>
      </div>
      <p className="text-lg font-semibold">
        {balance} <span className="text-muted-soft text-sm font-normal">créditos</span>
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.querySelector("input") as HTMLInputElement;
          const amount = parseInt(input.value, 10);
          if (amount > 0) {
            onDistribute(amount, input);
          }
        }}
      >
        <input
          type="number"
          min="1"
          placeholder="Qtd"
          className="liquid-input w-20 flex-1 text-sm"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-full bg-cobalt px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5"
        >
          <Send className="h-3.5 w-3.5" />
          Distribuir
        </button>
      </form>
    </div>
  );
}

// -- Workspace Name Card --

function WorkspaceNameCard({
  workspaceName,
  isSavingName,
  onSave
}: {
  workspaceName: string;
  isSavingName: boolean;
  onSave: (formData: FormData) => void;
}) {
  return (
    <section className="glass-strong rounded-[34px] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cobalt">Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold">Nome da corretora</h2>
        </div>
        <UsersRound size={22} aria-hidden="true" />
      </div>
      <form action={onSave} className="flex flex-col gap-3 sm:flex-row">
        <input
          className="liquid-input"
          defaultValue={workspaceName}
          name="workspaceName"
          placeholder="Nome da corretora ou equipe"
          required
          type="text"
        />
        <button
          className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud transition hover:bg-ink/90 disabled:opacity-60 dark:bg-cobalt dark:text-white dark:hover:bg-cobalt/90"
          disabled={isSavingName}
          type="submit"
        >
          {isSavingName ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </section>
  );
}

// -- Team Overview Card --

function TeamOverviewCard({
  teams,
  members,
  deactivatedMembers
}: {
  teams: TeamSetupTeam[];
  members: TeamMember[];
  deactivatedMembers: TeamMember[];
}) {
  const activeTeams = teams.filter((t) => t.isActive);
  const supervisors = members.filter((m) => m.role === "admin" && m.status === "active");
  const consultants = members.filter((m) => m.role === "seller" && m.status === "active");

  const stats = [
    { label: "Equipes ativas", value: activeTeams.length },
    { label: "Supervisores", value: supervisors.length },
    { label: "Consultores", value: consultants.length },
    { label: "Desativados", value: deactivatedMembers.length }
  ];

  return (
    <section className="glass-strong rounded-[34px] p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cobalt/15">
          <Users size={19} className="text-cobalt" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Visão geral</h2>
          <p className="text-sm text-muted-soft">Resumo da operação</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div className="rounded-2xl bg-surface-elevated px-4 py-3" key={stat.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// -- Access By Role Card --

function AccessByRoleCard() {
  const bullets = [
    "Owner: convida supervisores e consultores, altera nome e gerencia membros.",
    "Supervisor: convida consultores e organiza a operação comercial.",
    "Consultor: trabalha apenas sua carteira e leads permitidos."
  ];

  return (
    <section className="glass-strong rounded-[34px] p-5">
      <h2 className="text-xl font-semibold">Acesso por papel</h2>
      <div className="mt-5 space-y-3">
        {bullets.map((item) => (
          <div className="flex items-center gap-3 rounded-2xl bg-surface-elevated px-4 py-3" key={item}>
            <CheckCircle2 className="shrink-0 text-lagoon" size={18} aria-hidden="true" />
            <span className="text-sm font-medium">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

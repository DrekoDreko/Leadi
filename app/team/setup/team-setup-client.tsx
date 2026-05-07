"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Link2,
  Loader2,
  UserRoundPlus,
  UsersRound
} from "lucide-react";
import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import { PageHeading } from "@/components/dashboard/widgets";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import type { TeamInvite, TeamMember } from "@/lib/workspaces/team";
import { createInviteAction, updateTeamNameAction } from "./actions";

type TeamSetupClientProps = {
  initialWorkspaceName: string;
  initialInvites: TeamInvite[];
  inviteAccess: ResourceAccessSummary;
  members: TeamMember[];
};

export function TeamSetupClient({
  initialWorkspaceName,
  initialInvites,
  inviteAccess,
  members
}: TeamSetupClientProps) {
  const [invites, setInvites] = useState(initialInvites);
  const [latestInvitePath, setLatestInvitePath] = useState(initialInvites[0]?.invitePath ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGenerating, startInviteTransition] = useTransition();
  const [isSavingName, startNameTransition] = useTransition();
  const latestInviteUrl = useAbsoluteInviteUrl(latestInvitePath);

  function generateInvite() {
    if (!inviteAccess.allowed) {
      setFeedback(inviteAccess.message);
      return;
    }

    startInviteTransition(async () => {
      setFeedback(null);
      const result = await createInviteAction();

      if (!result.ok) {
        setFeedback(result.error);
        return;
      }

      const nextInvite: TeamInvite = {
        id: result.invitePath,
        token: result.invitePath.split("/").at(-1) ?? result.invitePath,
        invitePath: result.invitePath,
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: result.expiresAt
      };

      setLatestInvitePath(result.invitePath);
      setInvites((currentInvites) => [nextInvite, ...currentInvites]);
      setFeedback("Convite gerado com sucesso.");
    });
  }

  function copyInvite() {
    if (!latestInviteUrl) {
      return;
    }

    navigator.clipboard
      .writeText(latestInviteUrl)
      .then(() => setFeedback("Link copiado para a area de transferencia."))
      .catch(() => setFeedback("Nao foi possivel copiar automaticamente."));
  }

  function saveTeamName(formData: FormData) {
    startNameTransition(async () => {
      setFeedback(null);
      const result = await updateTeamNameAction(formData);
      setFeedback(result.ok ? "Nome comercial atualizado." : result.error);
    });
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Equipe"
        title="Configuracao da equipe"
        description="Defina o nome da corretora, gere convites e acompanhe os vendedores vinculados."
      >
        <button
          className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/90"
          disabled={isGenerating || !inviteAccess.allowed}
          onClick={generateInvite}
          type="button"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
          Gerar convite
        </button>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
          href="/dashboard"
        >
          Finalizar
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      {!inviteAccess.allowed ? <SubscriptionAccessBanner notice={inviteAccess} /> : null}

      {feedback && (
        <p className="rounded-[22px] bg-white/50 px-4 py-3 text-sm font-semibold text-ink">
          {feedback}
        </p>
      )}

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
                defaultValue={initialWorkspaceName}
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
                Salvar
              </button>
            </form>
          </section>

          <section className="glass rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cobalt">Vendedores</p>
                <h2 className="mt-2 text-2xl font-semibold">Membros da equipe</h2>
              </div>
              <UserRoundPlus size={22} aria-hidden="true" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {members.map((member) => (
                <article className="rounded-[24px] bg-white/42 p-4" key={member.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="mt-1 text-sm text-ink/56">{member.email}</p>
                    </div>
                    <span className="rounded-full bg-white/64 px-3 py-1 text-xs font-semibold">
                      {member.role === "supervisor" ? "Supervisor" : "Vendedor"}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-medium text-ink/58">
                    Status: {member.status === "active" ? "ativo" : "convidado"}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="glass-strong rounded-[34px] p-5">
            <h2 className="text-xl font-semibold">Link de convite</h2>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Envie este link para um vendedor. Depois do cadastro ou login, ele entrara
              automaticamente neste workspace como seller.
            </p>
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
                disabled={isGenerating || !inviteAccess.allowed}
                onClick={generateInvite}
                type="button"
              >
                <Link2 size={16} aria-hidden="true" />
                Novo token
              </button>
            </div>
          </section>

          <section className="glass rounded-[34px] p-5">
            <h2 className="text-xl font-semibold">Acesso dos vendedores</h2>
            <div className="mt-5 space-y-3">
              {[
                "CRM e leads atribuidos",
                "Campanhas e mensagens de WhatsApp",
                "Validador de compliance",
                "Pedidos proprios de design/video"
              ].map((item) => (
                <div className="flex items-center gap-3 rounded-2xl bg-white/42 px-4 py-3" key={item}>
                  <CheckCircle2 className="text-lagoon" size={18} aria-hidden="true" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {invites.length > 0 && (
            <section className="glass rounded-[34px] p-5">
              <h2 className="text-xl font-semibold">Convites recentes</h2>
              <div className="mt-4 space-y-3">
                {invites.slice(0, 4).map((invite) => (
                  <div className="rounded-[20px] bg-white/42 p-3" key={invite.id}>
                    <p className="truncate text-sm font-semibold">{invite.invitePath}</p>
                    <p className="mt-1 text-xs text-ink/54">Status: {invite.status}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </section>
    </div>
  );
}

function useAbsoluteInviteUrl(invitePath: string) {
  return useMemo(() => {
    if (!invitePath || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}${invitePath}`;
  }, [invitePath]);
}

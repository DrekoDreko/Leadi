"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Check, Copy, Link2, ShieldCheck, UserRound } from "lucide-react";
import { createInviteLinkAction } from "../../../team/invite/actions";

type TeamRole = "admin" | "seller";

type GeneratedInvite = {
  id: string;
  url: string;
  role: TeamRole;
};

const roleLabels: Record<TeamRole, string> = {
  admin: "Supervisor",
  seller: "Consultor"
};

export function OnboardingInvites() {
  const [role, setRole] = useState<TeamRole>("admin");
  const [invites, setInvites] = useState<GeneratedInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    const formData = new FormData();
    formData.set("roleToAssign", role);

    startTransition(async () => {
      const result = await createInviteLinkAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const url = `${window.location.origin}${result.invitePath}`;
      setInvites((prev) => [{ id: result.id, url, role: result.roleToAssign }, ...prev]);
    });
  }

  async function handleCopy(invite: GeneratedInvite) {
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId((current) => (current === invite.id ? null : current)), 2000);
    } catch {
      setError("Nao foi possivel copiar. Copie o link manualmente.");
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="surface-card rounded-[26px] p-5">
        <p className="text-sm font-semibold text-muted-strong">Quem voce quer convidar?</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["admin", "seller"] as TeamRole[]).map((value) => {
            const active = role === value;
            const Icon = value === "admin" ? ShieldCheck : UserRound;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                aria-pressed={active}
                className={`flex items-center gap-3 rounded-[20px] border p-4 text-left transition ${
                  active
                    ? "border-cobalt bg-cobalt/10"
                    : "border-border surface-card-muted hover:bg-surface-elevated"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    active ? "bg-cobalt text-white" : "surface-pill text-muted-soft"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold">{roleLabels[value]}</span>
                  <span className="block text-xs text-muted-soft">
                    {value === "admin"
                      ? "Gerencia consultores e distribui leads"
                      : "Atende e trabalha os leads recebidos"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-cobalt/90 disabled:opacity-60"
        >
          <Link2 size={16} aria-hidden="true" />
          {isPending ? "Gerando..." : `Gerar link de ${roleLabels[role]}`}
        </button>

        {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
      </div>

      {invites.length > 0 && (
        <div className="surface-card-muted rounded-[26px] p-5">
          <p className="text-sm font-semibold text-muted-strong">Links gerados</p>
          <div className="mt-3 space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="surface-card flex items-center justify-between gap-3 rounded-[18px] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-cobalt">{roleLabels[invite.role]}</p>
                  <p className="truncate text-sm text-muted-soft">{invite.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(invite)}
                  className="surface-action-secondary inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
                >
                  {copiedId === invite.id ? (
                    <>
                      <Check size={14} aria-hidden="true" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={14} aria-hidden="true" /> Copiar
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard/criacoes/campanhas" className="text-sm font-semibold text-muted-soft hover:text-foreground">
          Pular por agora
        </Link>
        <Link
          href="/dashboard/criacoes/campanhas"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:-translate-y-0.5"
        >
          Continuar para criar anuncio
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Coins, Send, UsersRound } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";

export type SupervisorConsultant = {
  profileId: string;
  name: string;
  email: string;
  availableCredits: number;
};

export type SupervisorTeam = {
  id: string;
  name: string;
  walletId: string;
  availableCredits: number;
  consultants: SupervisorConsultant[];
};

export function SupervisorCreditsWorkspace({
  teams: initialTeams,
  embedded = false
}: {
  teams: SupervisorTeam[];
  /** Quando true, renderiza dentro de um card grande (ex.: página de créditos do perfil),
   *  sem o cabeçalho de página próprio. */
  embedded?: boolean;
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  async function distribute(
    teamId: string,
    teamWalletId: string,
    consultant: SupervisorConsultant,
    amount: number,
    inputEl: HTMLInputElement
  ) {
    if (amount <= 0) return;
    setFeedback(null);

    try {
      const response = await fetch("/api/credits/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWalletId: teamWalletId,
          walletType: "user",
          targetUserId: consultant.profileId,
          amount,
          reason: "Distribuição de créditos pelo supervisor"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({ type: "error", message: data.error ?? "Erro ao distribuir créditos." });
        return;
      }

      const fromBalance = Number(data.allocation?.fromWalletBalance);
      const toBalance = Number(data.allocation?.toWalletBalance);

      setTeams((prev) =>
        prev.map((team) => {
          if (team.id !== teamId) return team;
          return {
            ...team,
            availableCredits: Number.isFinite(fromBalance) ? fromBalance : team.availableCredits,
            consultants: team.consultants.map((c) =>
              c.profileId === consultant.profileId && Number.isFinite(toBalance)
                ? { ...c, availableCredits: toBalance }
                : c
            )
          };
        })
      );

      inputEl.value = "";
      setFeedback({
        type: "success",
        message: `${amount} créditos enviados para ${consultant.name}.`
      });
    } catch {
      setFeedback({ type: "error", message: "Erro ao distribuir créditos." });
    }
  }

  const body = (
    <>
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

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UsersRound className="text-muted-soft mb-3 h-10 w-10" />
          <p className="text-muted-soft text-sm">
            Você ainda não supervisiona nenhuma equipe ativa.
          </p>
        </div>
      ) : (
        teams.map((team) => (
          <section key={team.id} className="flex flex-col gap-4">
            <div className="glass-strong flex items-center gap-4 rounded-[34px] p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/15">
                <Coins className="h-6 w-6 text-cobalt" />
              </div>
              <div>
                <p className="text-muted-soft text-sm">Saldo da equipe {team.name}</p>
                <p className="text-2xl font-semibold">{team.availableCredits} créditos</p>
              </div>
            </div>

            {team.consultants.length === 0 ? (
              <p className="text-muted-soft text-sm">Nenhum consultor ativo nesta equipe.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {team.consultants.map((consultant) => (
                  <ConsultantCreditCard
                    key={consultant.profileId}
                    consultant={consultant}
                    onDistribute={(amount, inputEl) =>
                      distribute(team.id, team.walletId, consultant, amount, inputEl)
                    }
                  />
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </>
  );

  if (embedded) {
    return (
      <section className="glass rounded-[34px] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cobalt">Gestão</p>
            <h2 className="mt-2 text-2xl font-semibold">Distribuir Créditos</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/64">
              Envie créditos da carteira da sua equipe para os consultores.
            </p>
          </div>
          <Coins className="text-cobalt" size={20} aria-hidden="true" />
        </div>
        <div className="mt-6 flex flex-col gap-5">{body}</div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        eyebrow="Gestão"
        title="Distribuir Créditos"
        description="Envie créditos da carteira da sua equipe para os consultores."
      />
      {body}
    </div>
  );
}

function ConsultantCreditCard({
  consultant,
  onDistribute
}: {
  consultant: SupervisorConsultant;
  onDistribute: (amount: number, inputEl: HTMLInputElement) => void;
}) {
  return (
    <div className="surface-card flex flex-col gap-3 rounded-[28px] p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{consultant.name}</p>
        <p className="text-muted-soft truncate text-xs">{consultant.email}</p>
      </div>
      <p className="text-lg font-semibold">
        {consultant.availableCredits}{" "}
        <span className="text-muted-soft text-sm font-normal">créditos</span>
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
        <input type="number" min="1" placeholder="Qtd" className="liquid-input w-20 flex-1 text-sm" />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-full bg-cobalt px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5"
        >
          <Send className="h-3.5 w-3.5" />
          Enviar
        </button>
      </form>
    </div>
  );
}

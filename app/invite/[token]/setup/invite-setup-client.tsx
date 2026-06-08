"use client";

import { useState } from "react";
import { Loader2, UserRoundCheck, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { completeInviteSetupAction } from "./actions";

type InviteSetupClientProps = {
  role: string;
  token: string;
};

export function InviteSetupClient({ role, token }: InviteSetupClientProps) {
  const [fullName, setFullName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSupervisor = role === "admin";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("fullName", fullName);
      formData.set("role", role);
      if (isSupervisor) {
        formData.set("teamName", teamName);
      }

      const result = await completeInviteSetupAction(formData);

      if (!result.ok) {
        setError(result.error);
      }
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-2xl">
        <div className="mb-6">
          <BrandMark />
        </div>

        <div className="glass-strong rounded-[34px] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${
                isSupervisor ? "bg-lagoon" : "bg-cobalt"
              }`}
            >
              {isSupervisor ? (
                <UsersRound size={21} aria-hidden="true" />
              ) : (
                <UserRoundCheck size={21} aria-hidden="true" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-cobalt">Bem-vindo ao Leadi</p>
              <h1 className="text-2xl font-semibold sm:text-3xl">
                {isSupervisor ? "Configure sua supervisao" : "Configure seu perfil"}
              </h1>
            </div>
          </div>

          <p className="mt-4 leading-7 text-ink/62">
            {isSupervisor
              ? "Voce foi convidado como supervisor. Preencha seus dados e defina o nome da equipe que voce vai liderar."
              : "Voce foi convidado como consultor. Preencha seus dados para comecar a usar o CRM."}
          </p>

          {error ? (
            <p
              aria-live="polite"
              className="mt-6 rounded-[22px] bg-signal/34 px-4 py-3 text-sm font-medium text-ink dark:text-cloud"
            >
              {error}
            </p>
          ) : null}

          <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-ink/72" htmlFor="fullName">
                Nome completo
              </label>
              <input
                autoFocus
                className="liquid-input mt-2"
                id="fullName"
                placeholder="Seu nome completo"
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {isSupervisor ? (
              <div>
                <label className="block text-sm font-medium text-ink/72" htmlFor="teamName">
                  Nome da equipe
                </label>
                <input
                  className="liquid-input mt-2"
                  id="teamName"
                  placeholder="Ex: Equipe Norte, Time Corporativo"
                  required
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <p className="mt-2 text-xs text-ink/48">
                  Esse sera o nome da equipe que voce vai supervisionar.
                </p>
              </div>
            ) : null}

            <button
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cloud transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving || !fullName || (isSupervisor && !teamName)}
              type="submit"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} aria-hidden="true" />
              ) : null}
              {isSaving ? "Salvando..." : "Salvar e continuar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

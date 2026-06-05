"use client";

import { useMemo, useState } from "react";
import type { Lead } from "@/data/mock";
import type { LeadOwnerOption } from "@/lib/leads/repository.server";

export type LeadDistributionTargetType = "supervisor" | "consultant";

export type LeadDistributionResult = {
  leads?: Lead[];
  updatedCount?: number;
  mode?: "supabase" | "not-configured";
};

type LeadDistributionResponse = LeadDistributionResult & { error?: string };

type LeadDistributionControlsProps = {
  /** IDs dos leads que serao distribuidos (selecionados ou importados). */
  leadIds: string[];
  leadOwnerOptions: LeadOwnerOption[];
  /** Owner pode escolher entre supervisores e consultores. Supervisor fica travado em consultores. */
  canChooseSupervisors: boolean;
  onDistributed: (result: LeadDistributionResult, targetType: LeadDistributionTargetType) => void;
  onError: (message: string) => void;
  className?: string;
};

const TARGET_LABELS: Record<LeadDistributionTargetType, { singular: string; plural: string }> = {
  supervisor: { singular: "supervisor", plural: "supervisores" },
  consultant: { singular: "consultor", plural: "consultores" }
};

export function LeadDistributionControls({
  leadIds,
  leadOwnerOptions,
  canChooseSupervisors,
  onDistributed,
  onError,
  className
}: LeadDistributionControlsProps) {
  const hasSupervisors = useMemo(
    () => leadOwnerOptions.some((option) => option.role === "admin"),
    [leadOwnerOptions]
  );
  const canToggle = canChooseSupervisors && hasSupervisors;
  const [targetType, setTargetType] = useState<LeadDistributionTargetType>(
    canToggle ? "supervisor" : "consultant"
  );
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [pendingAction, setPendingAction] = useState<"manual" | "equal" | null>(null);

  const targetOptions = useMemo(() => {
    const role = targetType === "supervisor" ? "admin" : "seller";
    return leadOwnerOptions.filter((option) => option.role === role);
  }, [leadOwnerOptions, targetType]);

  const labels = TARGET_LABELS[targetType];
  const hasLeads = leadIds.length > 0;
  const hasTargets = targetOptions.length > 0;
  const isWorking = pendingAction !== null;

  function changeTargetType(next: LeadDistributionTargetType) {
    if (next === targetType) {
      return;
    }
    setTargetType(next);
    setSelectedProfileId("");
  }

  async function postDistribution(
    url: string,
    payload: Record<string, unknown>,
    action: "manual" | "equal"
  ) {
    if (!hasLeads || isWorking) {
      return;
    }

    setPendingAction(action);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as LeadDistributionResponse;

      if (!response.ok || !data.leads) {
        throw new Error(data.error ?? "Nao foi possivel distribuir os leads.");
      }

      onDistributed(
        { leads: data.leads, updatedCount: data.updatedCount, mode: data.mode },
        targetType
      );
      setSelectedProfileId("");
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Nao foi possivel distribuir os leads."
      );
    } finally {
      setPendingAction(null);
    }
  }

  function handleAssignToPerson() {
    if (!selectedProfileId) {
      return;
    }
    void postDistribution(
      "/api/leads/assign",
      { leadIds, ownerProfileId: selectedProfileId },
      "manual"
    );
  }

  function handleDistributeEqually() {
    if (!hasTargets) {
      return;
    }
    void postDistribution(
      "/api/leads/distribute",
      { leadIds, targetProfileIds: targetOptions.map((option) => option.id) },
      "equal"
    );
  }

  return (
    <div className={`flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center ${className ?? ""}`}>
      {canToggle ? (
        <div
          className="inline-flex rounded-full border border-border/70 bg-surface-elevated/92 p-1 text-sm font-semibold"
          role="group"
          aria-label="Distribuir para"
        >
          {(["supervisor", "consultant"] as LeadDistributionTargetType[]).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={targetType === type}
              className={`rounded-full px-3 py-1.5 transition ${
                targetType === type
                  ? "bg-cobalt text-white"
                  : "text-foreground/70 hover:text-foreground"
              }`}
              onClick={() => changeTargetType(type)}
            >
              {TARGET_LABELS[type].plural.charAt(0).toUpperCase() +
                TARGET_LABELS[type].plural.slice(1)}
            </button>
          ))}
        </div>
      ) : null}

      <label className="sr-only" htmlFor="distribution-target-profile-id">
        Distribuir leads para {labels.singular}
      </label>
      <select
        aria-label={`Distribuir leads para ${labels.singular}`}
        className="rounded-full border border-border/70 bg-surface-elevated/92 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-cobalt/40 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!hasTargets || isWorking}
        id="distribution-target-profile-id"
        onChange={(event) => setSelectedProfileId(event.target.value)}
        value={selectedProfileId}
      >
        <option value="">
          {hasTargets ? `Selecione um ${labels.singular}` : `Nenhum ${labels.singular} disponivel`}
        </option>
        {targetOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <button
        className="surface-action-secondary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!hasLeads || !selectedProfileId || isWorking}
        onClick={handleAssignToPerson}
        type="button"
      >
        {pendingAction === "manual" ? "Distribuindo" : "Distribuir"}
      </button>
      <button
        className="inline-flex items-center justify-center rounded-full bg-cobalt px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt/92 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!hasLeads || !hasTargets || isWorking}
        onClick={handleDistributeEqually}
        title={`Divide os leads igualmente entre os ${labels.plural}`}
        type="button"
      >
        {pendingAction === "equal" ? "Dividindo" : "Dividir igualmente"}
      </button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, Loader2, RotateCcw, X } from "lucide-react";
import type { Lead } from "@/data/mock";

type ArchivedLeadsModalProps = {
  open: boolean;
  onClose: () => void;
  onUnarchived: (leadId: string) => void;
};

type LeadsResponse = {
  leads: Lead[];
  mode?: string;
};

export function ArchivedLeadsModal({ open, onClose, onUnarchived }: ArchivedLeadsModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null);

  const fetchArchivedLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leads?archived=true");
      if (!response.ok) {
        throw new Error("Erro ao carregar leads arquivados.");
      }
      const data: LeadsResponse = await response.json();
      setLeads(data.leads ?? []);
    } catch {
      setError("Nao foi possivel carregar os leads arquivados.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchArchivedLeads();
    }
  }, [open, fetchArchivedLeads]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !unarchivingId) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose, unarchivingId]);

  if (!open) {
    return null;
  }

  const closeModal = () => {
    if (!unarchivingId) {
      onClose();
    }
  };

  async function handleUnarchive(leadId: string) {
    setUnarchivingId(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}`, { method: "PUT" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Erro ao desarquivar lead.");
      }
      setLeads(prev => prev.filter(l => l.id !== leadId));
      onUnarchived(leadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desarquivar lead.");
    } finally {
      setUnarchivingId(null);
    }
  }

  return (
    <div
      aria-labelledby="archived-leads-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
      onClick={closeModal}
      role="dialog"
    >
      <section
        className="surface-modal mx-auto flex w-full max-w-2xl flex-col rounded-[32px] p-4 shadow-glass sm:p-6"
        style={{ maxHeight: "80vh" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
          <div>
            <p className="text-sm font-medium text-amber-600">Historico</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl" id="archived-leads-title">
              Leads arquivados
            </h2>
          </div>
          <button className="icon-button shrink-0" onClick={closeModal} type="button" title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-ink/40" size={28} />
            </div>
          )}

          {error && !isLoading && (
            <p className="py-6 text-center text-sm text-red-500">{error}</p>
          )}

          {!isLoading && !error && leads.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-ink/40">
              <Archive size={36} />
              <p className="text-sm">Nenhum lead arquivado.</p>
            </div>
          )}

          {!isLoading && leads.length > 0 && (
            <ul className="divide-y divide-ink/8">
              {leads.map(lead => (
                <li key={lead.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{lead.name}</p>
                    <p className="text-sm text-ink/60">{lead.phone || "Sem telefone"}</p>
                    {lead.archiveReason && (
                      <p className="mt-0.5 text-xs italic text-ink/45">{lead.archiveReason}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                    disabled={unarchivingId === lead.id}
                    onClick={() => handleUnarchive(lead.id)}
                  >
                    {unarchivingId === lead.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                    Desarquivar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

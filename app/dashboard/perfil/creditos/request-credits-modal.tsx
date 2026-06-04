"use client";

import { useEffect, useState } from "react";
import { Loader2, Coins, X, CheckCircle2, AlertCircle } from "lucide-react";

type RequestCreditsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultCredits: number;
};

export function RequestCreditsModal({ isOpen, onClose, defaultCredits }: RequestCreditsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [consultants, setConsultants] = useState<number>(1);
  const [creditsPerConsultant, setCreditsPerConsultant] = useState<number>(defaultCredits);
  const [reason, setReason] = useState("");

  const totalCredits = Math.max(0, consultants * creditsPerConsultant);

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setSuccess("");
      setReason("");
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) {
    return null;
  }

  const closeModal = () => {
    if (!loading) {
      onClose();
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (totalCredits <= 0) {
      setError("O total de créditos solicitados deve ser maior que zero.");
      setLoading(false);
      return;
    }

    if (!reason.trim()) {
      setError("Informe o motivo da solicitação.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/credits/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "team",
          amountRequested: totalCredits,
          consultantCount: consultants,
          creditsPerConsultant: creditsPerConsultant,
          reason
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Erro ao solicitar créditos.");
      }

      setSuccess("Solicitação enviada ao gestor com sucesso!");
      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      aria-labelledby="request-credits-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
      onClick={closeModal}
      role="dialog"
    >
      <section
        className="surface-modal mx-auto w-full max-w-lg rounded-[32px] p-4 shadow-glass sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
          <div>
            <p className="text-sm font-medium text-cobalt">Solicitação</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl" id="request-credits-title">
              Solicitar créditos
            </h2>
            <p className="text-muted-soft mt-2 text-sm leading-6">
              Peça créditos ao gestor para distribuir entre os consultores da equipe.
            </p>
          </div>
          <button className="icon-button shrink-0" onClick={closeModal} type="button" title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-5 space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-[24px] border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-800">
              <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 rounded-[24px] border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-900">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-2">
              <span className="text-muted-soft block text-sm font-medium">Nº de consultores</span>
              <input
                className="liquid-input disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || !!success}
                max={100}
                min={1}
                onChange={(e) => setConsultants(Number(e.target.value) || 1)}
                type="number"
                value={consultants}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-muted-soft block text-sm font-medium">Créditos / consultor</span>
              <input
                className="liquid-input disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || !!success}
                max={10000}
                min={1}
                onChange={(e) => setCreditsPerConsultant(Number(e.target.value) || 1)}
                type="number"
                value={creditsPerConsultant}
              />
            </label>
          </div>

          <div className="rounded-[20px] bg-cobalt/8 p-4 flex items-center justify-between border border-cobalt/10">
            <span className="text-sm font-semibold text-cobalt">Total solicitado</span>
            <span className="flex items-center gap-2 text-2xl font-bold text-cobalt">
              <Coins size={22} />
              {totalCredits}
            </span>
          </div>

          <label className="block space-y-2">
            <span className="text-muted-soft block text-sm font-medium">Motivo</span>
            <textarea
              className="liquid-input min-h-[100px] resize-y disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !!success}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Campanha de fim de mês"
              required
              rows={3}
              value={reason}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
            <button
              className="surface-action-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading || !!success}
              onClick={closeModal}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/90 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading || !!success}
              type="submit"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Enviando..." : "Enviar solicitação"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

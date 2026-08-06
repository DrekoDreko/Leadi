"use client";

import { useEffect, useState } from "react";
import { Radar, X } from "lucide-react";

// Mudança 8: card de onboarding de pixel/dataset. Consulta o estado sob demanda
// (não bloqueia o carregamento) e só aparece para owner/admin cuja conta ainda não
// tem dataset. É melhoria, não pré-requisito — pode ser dispensado.
export function DatasetOnboardingCard() {
  const [show, setShow] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/meta/dataset-onboarding")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { show?: boolean } | null) => {
        if (active && data?.show) setShow(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleDismiss() {
    setDismissing(true);
    try {
      await fetch("/api/meta/dataset-onboarding", { method: "POST" });
    } catch {
      // Silencioso: se falhar, o card volta no próximo carregamento.
    } finally {
      setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div className="surface-card rounded-[24px] border border-cobalt/20 p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
          <Radar size={20} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">
            Instale o pixel da Meta para não perder quem visita seu site
          </h3>
          <p className="mt-1 text-sm text-muted-soft">
            Sua conta ainda não tem um pixel (dataset). Com ele você pode anunciar de novo para quem já
            visitou seu site, criar públicos semelhantes a quem converteu e medir o que acontece depois do
            lead. Seus anúncios continuam funcionando sem ele — é uma melhoria.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              className="inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-sm font-semibold text-white"
              href="https://business.facebook.com/events_manager2/list/dataset"
              rel="noreferrer"
              target="_blank"
            >
              Criar pixel na Meta
            </a>
            <button
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              disabled={dismissing}
              onClick={handleDismiss}
              type="button"
            >
              <X size={14} aria-hidden="true" />
              Dispensar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { SupportModal } from "./support-modal";

export function SupportCard({ variant = "secondary" }: { variant?: "primary" | "secondary" }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (variant === "primary") {
    return (
      <>
        <button
          className="group surface-card flex min-h-[250px] flex-col justify-between rounded-[34px] p-6 text-left transition hover:-translate-y-1 hover:border-cobalt/24 hover:bg-surface-elevated"
          onClick={() => setModalOpen(true)}
          type="button"
        >
          <div>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-surface-elevated text-foreground ring-1 ring-border/70">
              <LifeBuoy size={24} aria-hidden="true" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold leading-tight">Central de Ajuda</h2>
            <p className="text-muted-soft mt-3 leading-7">
              Envie uma mensagem para a equipe de suporte.
            </p>
          </div>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
            Abrir
            <ArrowRight
              className="transition group-hover:translate-x-1"
              size={18}
              aria-hidden="true"
            />
          </span>
        </button>
        <SupportModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        className="group surface-card-muted flex min-h-[190px] flex-col justify-between rounded-[26px] p-5 text-left transition hover:-translate-y-1 hover:border-cobalt/18 hover:bg-surface-elevated"
        onClick={() => setModalOpen(true)}
        type="button"
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <span className="surface-pill-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground">
              <LifeBuoy size={19} aria-hidden="true" />
            </span>
            <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-transparent text-muted-foreground transition group-hover:border-cobalt/20 group-hover:bg-cobalt/10 group-hover:text-cobalt group-hover:shadow-[0_8px_24px_rgba(37,99,235,0.16)]">
              <ArrowRight
                className="transition group-hover:translate-x-0.5"
                size={18}
                aria-hidden="true"
              />
            </span>
          </div>
          <h3 className="mt-5 font-semibold">Central de Ajuda</h3>
          <p className="text-muted-soft mt-2 text-sm leading-6">
            Envie uma mensagem para a equipe de suporte.
          </p>
        </div>
      </button>

      <SupportModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

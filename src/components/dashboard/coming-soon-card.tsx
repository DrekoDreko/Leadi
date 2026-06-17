"use client";

import { useState, type ComponentType } from "react";
import { ArrowRight, type LucideProps } from "lucide-react";
import { ComingSoonModal, type ComingSoonFeature } from "./coming-soon-modal";

type ComingSoonCardProps = {
  title: string;
  description: string;
  icon: ComponentType<LucideProps>;
  /** Configuração do popup "em breve" exibido ao clicar no card. */
  modal: {
    title: string;
    icon: ComponentType<LucideProps>;
    description: React.ReactNode;
    features: ComingSoonFeature[];
  };
};

/**
 * Card secundário do hub de Criações que, em vez de navegar, abre um popup
 * de "em breve / acesso antecipado" (módulo ainda não lançado).
 */
export function ComingSoonCard({ title, description, icon: Icon, modal }: ComingSoonCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group surface-card-muted flex min-h-[190px] flex-col justify-between rounded-[26px] p-5 text-left transition hover:-translate-y-1 hover:border-cobalt/18 hover:bg-surface-elevated"
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <span className="surface-pill-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground">
              <Icon size={19} aria-hidden="true" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-cobalt/10 px-2.5 py-1 text-[11px] font-semibold text-cobalt">
              Em breve
            </span>
          </div>
          <h3 className="mt-5 font-semibold">{title}</h3>
          <p className="text-muted-soft mt-2 text-sm leading-6">{description}</p>
        </div>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
          Saber mais
          <ArrowRight
            className="transition group-hover:translate-x-1"
            size={16}
            aria-hidden="true"
          />
        </span>
      </button>

      <ComingSoonModal
        open={open}
        onClose={() => setOpen(false)}
        title={modal.title}
        icon={modal.icon}
        description={modal.description}
        features={modal.features}
      />
    </>
  );
}

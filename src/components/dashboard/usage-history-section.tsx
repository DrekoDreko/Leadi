"use client";

import { ChevronDown, Clock3 } from "lucide-react";
import { useState } from "react";
import { type AiUsageHistoryItem } from "@/lib/ai/credits";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  success: {
    label: "Sucesso",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  },
  failed: {
    label: "Falhou",
    className: "bg-red-500/10 text-red-700 dark:text-red-300"
  },
  refunded: {
    label: "Estornado",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300"
  }
} as const;

export function UsageHistorySection({ items }: { items: AiUsageHistoryItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasItems = items.length > 0;

  return (
    <section className="glass rounded-[34px] p-5 md:p-6">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        disabled={!hasItems}
        aria-expanded={expanded}
        className="flex w-full flex-wrap items-start justify-between gap-4 text-left disabled:cursor-default"
      >
        <div>
          <p className="text-sm font-medium text-cobalt">Histórico</p>
          <h2 className="mt-2 text-2xl font-semibold">Uso de créditos</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/64">
            Registro de todas as ações que consumiram créditos de IA, incluindo estornos automáticos
            em caso de erro.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasItems ? (
            <ChevronDown
              className={cn(
                "text-cobalt transition-transform duration-300",
                expanded && "rotate-180"
              )}
              size={20}
              aria-hidden="true"
            />
          ) : null}
          <Clock3 className="text-cobalt" size={20} aria-hidden="true" />
        </div>
      </button>

      {hasItems ? (
        <div
          className={cn(
            "relative mt-6 overflow-hidden transition-all duration-300",
            expanded ? "max-h-[2000px]" : "max-h-[112px]"
          )}
        >
          <div className="space-y-3">
            {items.map((item) => {
              const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.failed;
              const date = new Date(item.createdAt);

              return (
                <div
                  className="flex flex-col gap-2 rounded-[22px] border border-white/50 bg-white/58 p-4 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                  key={item.id}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink dark:text-cloud">
                        {item.featureLabel}
                      </p>
                      {item.actorName ? (
                        <span className="rounded-full bg-cobalt/10 px-2 py-0.5 text-[11px] font-medium text-cobalt dark:bg-cobalt/20">
                          {item.actorName}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-ink/54 dark:text-cloud/54">
                      {date.toLocaleDateString("pt-BR")} às{" "}
                      {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {item.errorMessage ? ` · ${item.errorMessage}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold",
                        item.status === "refunded"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : item.status === "success"
                            ? "bg-ink text-cloud"
                            : "bg-red-500/10 text-red-700 dark:text-red-300"
                      )}
                    >
                      {item.status === "refunded" ? "+" : "-"}
                      {item.creditsCharged}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {!expanded ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/80 to-transparent dark:from-[#0b0f1a]/80" />
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm leading-6 text-ink/58">Nenhum uso de créditos registrado ainda.</p>
      )}

      {hasItems ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/58 px-4 py-2 text-xs font-semibold text-cobalt transition-colors hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20"
        >
          {expanded ? "Mostrar menos" : "Ver histórico completo"}
          <ChevronDown
            className={cn("transition-transform duration-300", expanded && "rotate-180")}
            size={14}
            aria-hidden="true"
          />
        </button>
      ) : null}
    </section>
  );
}

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  leadPeriodFilterOptions,
  leadSourceFilterOptions,
  leadStageFilterOptions,
  type LeadUrlFilters
} from "@/lib/leads/filters";
import type { LeadTeamOption } from "@/lib/leads/repository.server";

export function LeadFiltersPopup({
  open,
  value,
  onChange,
  onApply,
  onClear,
  onClose,
  teamOptions = []
}: {
  open: boolean;
  value: LeadUrlFilters;
  onChange: (value: LeadUrlFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  teamOptions?: LeadTeamOption[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
      onClick={onClose}
      role="dialog"
    >
      <section
        className="surface-modal mx-auto w-full max-w-3xl overflow-y-auto rounded-[32px] p-4 shadow-glass sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
          <div>
            <p className="text-sm font-medium text-cobalt">Filtros</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Filtrar leads</h2>
            <p className="text-muted-soft mt-2 max-w-2xl text-sm leading-6">
              Ajuste os filtros e aplique em uma única etapa.
            </p>
          </div>
          <button className="icon-button shrink-0" onClick={onClose} type="button" title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="pt-5">
          <div className="grid gap-4 md:grid-cols-2">
            <LeadFilterField label="Etapa">
              <select
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    stage: event.target.value as LeadUrlFilters["stage"]
                  })
                }
                value={value.stage}
              >
                {leadStageFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LeadFilterField>

            <LeadFilterField label="Origem">
              <select
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    source: event.target.value as LeadUrlFilters["source"]
                  })
                }
                value={value.source}
              >
                {leadSourceFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LeadFilterField>

            <LeadFilterField label="Cidade">
              <input
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    city: event.target.value
                  })
                }
                placeholder="Cidade"
                type="text"
                value={value.city}
              />
            </LeadFilterField>

            <LeadFilterField label="Período">
              <select
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    period: event.target.value as LeadUrlFilters["period"]
                  })
                }
                value={value.period}
              >
                {leadPeriodFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LeadFilterField>

            <LeadFilterField label="Responsável">
              <input
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    owner: event.target.value
                  })
                }
                placeholder="Nome do responsável"
                type="text"
                value={value.owner}
              />
            </LeadFilterField>

            <LeadFilterField label="Campanha (Meta)">
              <input
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    campaign: event.target.value
                  })
                }
                placeholder="Nome da campanha"
                type="text"
                value={value.campaign}
              />
            </LeadFilterField>

            {teamOptions.length > 0 && (
              <LeadFilterField label="Equipe">
                <select
                  className="liquid-input text-sm"
                  onChange={(event) =>
                    onChange({
                      ...value,
                      team: event.target.value
                    })
                  }
                  value={value.team}
                >
                  <option value="all">Todas as equipes</option>
                  {teamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </LeadFilterField>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-ink/10 pt-5">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink"
              onClick={onClear}
              type="button"
            >
              Limpar filtros
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/10 bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white"
              onClick={onApply}
              type="button"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}

function LeadFilterField({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink/72">{label}</span>
      {children}
    </label>
  );
}

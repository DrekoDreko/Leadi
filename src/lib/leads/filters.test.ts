import { describe, expect, it } from "vitest";
import { leads } from "@/data/mock";
import { applyLeadUrlFilters, getSupabaseStageValue, leadStageFilterOptions } from "./filters";

describe("lead filters", () => {
  it("reaproveita a mesma ordem de etapas no filtro do CRM", () => {
    expect(leadStageFilterOptions.map((option) => option.label)).toEqual([
      "Todos os estagios",
      "Novo lead",
      "Qualificação",
      "Proposta",
      "Negociação",
      "Venda",
      "Perdido"
    ]);
  });

  it("traduz a etapa filtrada para o value tecnico do banco", () => {
    expect(getSupabaseStageValue("Qualificação")).toBe("qualification");
    expect(getSupabaseStageValue("Venda")).toBe("won");
  });

  it("filtra corretamente mesmo quando o lead chega com value tecnico", () => {
    const leadComValueTecnico = { ...leads[0], stage: "won" };

    expect(
      applyLeadUrlFilters(leadComValueTecnico, {
        stage: "Venda",
        source: "all",
        city: "",
        period: "all",
        search: "",
        archived: false,
        owner: "",
        campaign: "",
        view: "all",
        team: "all"
      })
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  getLeadStageLabel,
  getLeadStageValue,
  isLeadClosedStage,
  isLeadQualifiedStage,
  isLeadWonStage,
  leadStageMetas
} from "./stages";

describe("lead stage helpers", () => {
  it("mantem a ordem e as labels oficiais das etapas", () => {
    expect(
      leadStageMetas.map((stage) => ({
        value: stage.value,
        label: stage.label
      }))
    ).toEqual([
      { value: "new", label: "Novo lead" },
      { value: "qualification", label: "Qualificação" },
      { value: "proposal", label: "Proposta" },
      { value: "negotiation", label: "Negociação" },
      { value: "won", label: "Venda" },
      { value: "lost", label: "Perdido" }
    ]);
  });

  it("normaliza labels comerciais e values tecnicos sem drift", () => {
    expect(getLeadStageLabel("proposal")).toBe("Proposta");
    expect(getLeadStageLabel("Venda")).toBe("Venda");
    expect(getLeadStageValue("Proposta")).toBe("proposal");
    expect(getLeadStageValue("won")).toBe("won");
  });

  it("classifica corretamente etapas qualificadas, fechadas e ganhas", () => {
    expect(isLeadQualifiedStage("Qualificação")).toBe(true);
    expect(isLeadQualifiedStage("won")).toBe(true);
    expect(isLeadQualifiedStage("Novo lead")).toBe(false);
    expect(isLeadClosedStage("lost")).toBe(true);
    expect(isLeadClosedStage("Negociação")).toBe(false);
    expect(isLeadWonStage("Venda")).toBe(true);
    expect(isLeadWonStage("Perdido")).toBe(false);
  });
});

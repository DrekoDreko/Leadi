import { describe, expect, it } from "vitest";
import { leads } from "@/data/mock";
import {
  getLeadOriginDescription,
  getLeadOriginDetails,
  getLeadOriginKind,
  getLeadOriginSummary
} from "./source";

describe("lead source helpers", () => {
  it("classifica a origem Meta e expande os detalhes disponiveis", () => {
    expect(getLeadOriginKind(leads[0].source)).toBe("meta");
    expect(getLeadOriginDetails(leads[0])).toEqual([
      { label: "Campanha", value: "Campanha PME conectada" },
      { label: "Conjunto", value: "Conjunto decisores Campinas" },
      { label: "Anuncio", value: "Anuncio rede premium" },
      { label: "Formulario", value: "form_445566" }
    ]);
    expect(getLeadOriginSummary(leads[0])).toBe(
      "Campanha: Campanha PME conectada • Conjunto: Conjunto decisores Campinas"
    );
  });

  it("explica a origem manual sem inventar referencias Meta", () => {
    expect(getLeadOriginKind(leads[2].source)).toBe("manual");
    expect(getLeadOriginDetails(leads[2])).toEqual([]);
    expect(getLeadOriginDescription(leads[2].source)).toBe(
      "Lead cadastrado manualmente pela equipe no CRM."
    );
    expect(getLeadOriginSummary(leads[2])).toBe("Cadastro direto no CRM");
  });
});

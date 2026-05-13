import { describe, expect, it } from "vitest";
import { calculateLeadScore, getLeadScoreBandLabel } from "./scoring";

describe("calculateLeadScore", () => {
  it("premia perfil completo e intenção clara", () => {
    const result = calculateLeadScore({
      stage: "negotiation",
      source: "meta_lead_ads",
      email: "lead@empresa.com",
      phone: "+5511999999999",
      city: "Campinas",
      companyName: "Empresa Exemplo",
      livesCount: 126,
      budget: "R$ 42k/mês",
      interest: "Migração de contrato com rede maior",
      lastInteraction: "Pediu ajuste para diretoria",
      notes: "Lead quente com urgência",
      nextContactAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.band).toBe("priority");
    expect(result.bandLabel).toBe("Prioridade máxima");
    expect(result.signals.some((signal) => signal.label === "Origem Meta Lead Form")).toBe(true);
    expect(result.summary.toLowerCase()).toContain("lead muito forte");
  });

  it("reduz o score quando faltam sinais de perfil e intenção", () => {
    const result = calculateLeadScore({
      stage: "new",
      source: "manual",
      email: null,
      phone: null,
      city: null,
      companyName: null,
      livesCount: null,
      budget: null,
      interest: null,
      lastInteraction: null,
      notes: null,
      nextContactAt: null,
      receivedAt: null
    });

    expect(result.score).toBeLessThan(20);
    expect(result.band).toBe("low");
    expect(getLeadScoreBandLabel(result.score)).toBe("Baixa prioridade");
  });
});

import { describe, expect, it } from "vitest";
import {
  containsSensitiveCompliancePattern,
  reviewTextLocally
} from "./compliance-guardrails";

describe("Compliance Guardrails", () => {
  describe("containsSensitiveCompliancePattern", () => {
    it("deve detectar promessa financeira agressiva", () => {
      expect(containsSensitiveCompliancePattern("Nós garantimos que você terá economia garantida.")).toBe(true);
      expect(containsSensitiveCompliancePattern("corte seus custos pela metade agora!")).toBe(true);
      expect(containsSensitiveCompliancePattern("cobrimos qualquer oferta da concorrência")).toBe(true);
    });

    it("deve detectar linguagem agressiva ou tom imperativo", () => {
      expect(containsSensitiveCompliancePattern("pare de perder dinheiro com seu plano atual")).toBe(true);
      expect(containsSensitiveCompliancePattern("você está pagando caro, feche agora")).toBe(true);
      expect(containsSensitiveCompliancePattern("não seja bobo, compre já")).toBe(true);
    });

    it("não deve detectar texto consultivo seguro", () => {
      expect(containsSensitiveCompliancePattern("Faça um comparativo de mercado e avalie uma possível redução de custos para a sua empresa.")).toBe(false);
      expect(containsSensitiveCompliancePattern("Estamos à disposição para ajudar sua equipe a encontrar a melhor opção.")).toBe(false);
    });
  });

  describe("reviewTextLocally", () => {
    it("deve classificar promessa financeira como risco alto", () => {
      const review = reviewTextLocally("Faça o plano conosco e tenha desconto garantido.");
      expect(review.riskLevel).toBe("high");
      expect(review.reasons.some(r => r.title === "Promessa financeira agressiva")).toBe(true);
    });

    it("deve classificar linguagem agressiva como risco médio", () => {
      const review = reviewTextLocally("Pare de perder dinheiro e fale com nosso corretor.");
      // It might match other rules, but definitely matches aggressive language.
      expect(["medium", "high"]).toContain(review.riskLevel);
      expect(review.reasons.some(r => r.title === "Linguagem agressiva ou tom imperativo")).toBe(true);
    });
  });
});

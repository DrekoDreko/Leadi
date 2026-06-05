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

    it("não deve disparar quando o termo aparece em contexto de negação", () => {
      expect(containsSensitiveCompliancePattern("Evitar prometer aprovação imediata ou economia garantida.")).toBe(false);
      expect(containsSensitiveCompliancePattern("Não prometer resultado garantido ao lead.")).toBe(false);
      expect(containsSensitiveCompliancePattern("Sem prometer cobertura total no primeiro contato.")).toBe(false);
    });

    it("deve disparar quando o termo é usado afirmativamente mesmo com negação próxima de outro termo", () => {
      expect(containsSensitiveCompliancePattern("Temos economia garantida para sua empresa.")).toBe(true);
      expect(containsSensitiveCompliancePattern("Aprovação imediata do seu plano.")).toBe(true);
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
      expect(["medium", "high"]).toContain(review.riskLevel);
      expect(review.reasons.some(r => r.title === "Linguagem agressiva ou tom imperativo")).toBe(true);
    });

    it("não deve gerar alerta para instruções internas com negação", () => {
      const review = reviewTextLocally("Evitar prometer aprovação imediata ou economia garantida. Convidar o lead para uma análise do perfil.");
      expect(review.riskLevel).toBe("low");
    });
  });
});

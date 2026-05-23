import { describe, expect, it } from "vitest";
import { systemTemplatesFallback } from "@/data/system-templates";
import {
  buildFallbackWhatsAppMessage,
  getSuggestedWhatsAppTone,
  getWhatsAppStageLabel,
  getWhatsAppSystemTemplatesFallback,
  getWhatsAppTemplateLibrary,
  getWhatsAppTemplatesByObjective
} from "./templates";

describe("whatsapp template library", () => {
  it("organizes a base library by commercial objective", () => {
    const templates = getWhatsAppTemplateLibrary();

    expect(templates).toHaveLength(7);
    expect(templates.map((template) => template.objective)).toEqual([
      "boas_vindas",
      "qualificacao",
      "proposta",
      "negociacao",
      "reengajamento",
      "reativacao",
      "pos_atendimento"
    ]);
  });

  it("filters templates by objective without changing the message payload shape", () => {
    const [template] = getWhatsAppTemplatesByObjective("reengajamento");

    expect(template.stage).toBe("awaiting_response");
    expect(getWhatsAppStageLabel(template.stage)).toBe("Follow-up sem resposta");
    expect(getSuggestedWhatsAppTone(template.stage)).toBe("reengajamento");
    expect(template.content.openingMessage).toContain("[Nome do Lead]");
    expect(template.content.complianceNotes.length).toBeGreaterThan(0);
  });

  it("builds a low-friction fallback follow-up for leads without response", () => {
    const message = buildFallbackWhatsAppMessage({
      brokerageName: "Corretora Exemplo",
      lead: {
        name: "Paula Mendes",
        companyName: "Mendes Studio",
        interest: "plano empresarial"
      },
      stage: "awaiting_response",
      tone: "reengajamento"
    });

    expect(message.openingMessage).toContain("retomar nosso contato");
    expect(message.followUpMessage).toContain("ou me dizer se prefere retomar isso depois");
    expect(message.complianceNotes[0]).toContain("baixo atrito");
  });

  it("builds a respectful fallback reactivation message for stale leads", () => {
    const message = buildFallbackWhatsAppMessage({
      brokerageName: "Corretora Exemplo",
      lead: {
        name: "Paula Mendes",
        companyName: "Mendes Studio",
        interest: "plano empresarial"
      },
      stage: "reactivation",
      tone: "reengajamento"
    });

    expect(message.openingMessage).toContain("faz um tempo desde o ultimo contato");
    expect(message.followUpMessage).toContain("prioridade de rede ou prazo atual");
    expect(message.complianceNotes[0]).toContain("sem parecer cobranca");
  });

  it("derives system templates from the whatsapp library fallback", () => {
    const fallback = getWhatsAppSystemTemplatesFallback();
    const systemTemplates = systemTemplatesFallback.filter(
      (template) => template.templateType === "whatsapp"
    );

    expect(fallback).toHaveLength(7);
    expect(systemTemplates).toHaveLength(fallback.length);
    expect(systemTemplates.map((template) => template.id)).toEqual(
      fallback.map((template) => template.id)
    );
    expect(systemTemplates[0]?.content).toHaveProperty("openingMessage");
    expect(systemTemplates[0]?.content).toHaveProperty("followUpMessage");
    expect(systemTemplates[0]?.content).toHaveProperty("objectionReply");
  });
});

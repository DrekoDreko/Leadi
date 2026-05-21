import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateWhatsAppMessage } from "./index";

vi.mock("server-only", () => ({}));

describe("OpenAI client", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "sk-platform-test";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
  });

  it("interpreta respostas JSON validas", async () => {
    const payload = {
      openingMessage: "Olá, tudo bem?",
      followUpMessage: "Quero te mostrar uma opção ideal para a sua empresa.",
      objectionReply: "Posso te explicar sem compromisso.",
      complianceNotes: ["Mensagem revisada com foco comercial."]
    };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify(payload)
      })
    }));

    vi.stubGlobal("fetch", fetchMock);

    const result = await generateWhatsAppMessage({
      product: "Plano empresarial",
      leadName: "Ana Martins",
      leadContext: "Empresa: Alfa",
      objective: "Iniciar conversa",
      tone: "consultivo"
    });

    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer sk-platform-test",
        "Content-Type": "application/json"
      }
    });
  });
});

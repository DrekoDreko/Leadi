import { describe, it, expect } from "vitest";
import { sensitize } from "./logger";

describe("sensitize", () => {
  it("should mask sensitive fields", () => {
    const input = {
      name: "John Doe",
      email: "john@example.com",
      token: "secret-token",
      nested: {
        password: "123",
        safe: "data"
      }
    };

    const output = sensitize(input);

    expect(output.name).toBe("[MASKED]");
    expect(output.email).toBe("[MASKED]");
    expect(output.token).toBe("[MASKED]");
    expect(output.nested.password).toBe("[MASKED]");
    expect(output.nested.safe).toBe("data");
  });

  it("should handle arrays", () => {
    const input = [
      { key: "value", token: "secret" },
      { safe: "data" }
    ];

    const output = sensitize(input);

    expect(output[0].token).toBe("[MASKED]");
    expect(output[1].safe).toBe("data");
  });

  it("should mask various sensitive variants", () => {
    const input = {
      whatsapp: "123",
      celular: "456",
      cpf: "789",
      cnpj: "012",
      address: "Street 1",
      Authorization: "Bearer token"
    };

    const output = sensitize(input);

    expect(output.whatsapp).toBe("[MASKED]");
    expect(output.celular).toBe("[MASKED]");
    expect(output.cpf).toBe("[MASKED]");
    expect(output.cnpj).toBe("[MASKED]");
    expect(output.address).toBe("[MASKED]");
    expect(output.Authorization).toBe("[MASKED]");
  });
});

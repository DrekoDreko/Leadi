import { describe, expect, it } from "vitest";
import {
  buildPlanCheckoutPath,
  buildPlanSignupPath,
  isPublicPlanSlug
} from "./checkout-flow";

describe("checkout-flow", () => {
  it("monta a rota de checkout do plano", () => {
    expect(buildPlanCheckoutPath("profissional")).toBe("/checkout?plan=profissional");
  });

  it("monta a rota de cadastro com retorno para o checkout", () => {
    expect(buildPlanSignupPath("essencial")).toBe(
      "/login?mode=signup&next=%2Fcheckout%3Fplan%3Dessencial"
    );
  });

  it("valida apenas slugs publicos conhecidos", () => {
    expect(isPublicPlanSlug("operacao")).toBe(true);
    expect(isPublicPlanSlug("enterprise")).toBe(false);
  });
});

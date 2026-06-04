import { describe, expect, it } from "vitest";
import {
  buildPlanCheckoutPath,
  buildPlanSignupPath,
  isBillingCycle,
  isPublicPlanSlug
} from "./checkout-flow";

describe("checkout-flow", () => {
  it("monta a rota de checkout do plano", () => {
    expect(buildPlanCheckoutPath("profissional")).toBe("/checkout?plan=profissional&cycle=monthly");
    expect(buildPlanCheckoutPath("profissional", "annual")).toBe(
      "/checkout?plan=profissional&cycle=annual"
    );
  });

  it("monta a rota de cadastro com retorno para o checkout", () => {
    expect(buildPlanSignupPath("essencial")).toBe(
      "/login?mode=signup&next=%2Fcheckout%3Fplan%3Dessencial%26cycle%3Dmonthly"
    );
    expect(buildPlanSignupPath("essencial", "annual")).toBe(
      "/login?mode=signup&next=%2Fcheckout%3Fplan%3Dessencial%26cycle%3Dannual"
    );
  });

  it("valida apenas slugs e ciclos publicos conhecidos", () => {
    expect(isPublicPlanSlug("equipe")).toBe(true);
    expect(isPublicPlanSlug("enterprise")).toBe(false);
    expect(isBillingCycle("annual")).toBe(true);
    expect(isBillingCycle("weekly")).toBe(false);
  });
});

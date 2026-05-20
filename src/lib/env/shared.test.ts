import { describe, expect, it } from "vitest";
import { shouldValidateProductionCoreEnv } from "./shared";

describe("shouldValidateProductionCoreEnv", () => {
  it("valida em producao local ou verdadeira", () => {
    expect(shouldValidateProductionCoreEnv({ NODE_ENV: "production" })).toBe(true);
  });

  it("ignora preview da Vercel mesmo com NODE_ENV=production", () => {
    expect(
      shouldValidateProductionCoreEnv({
        NODE_ENV: "production",
        VERCEL_ENV: "preview"
      })
    ).toBe(false);
  });

  it("respeita SKIP_ENV_VALIDATION", () => {
    expect(
      shouldValidateProductionCoreEnv({
        NODE_ENV: "production",
        SKIP_ENV_VALIDATION: "1"
      })
    ).toBe(false);
  });
});

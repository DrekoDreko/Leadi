import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ENV_VARIABLES,
  listPublicEnvVariables,
  listServerOnlyEnvVariables,
  shouldValidateProductionCoreEnv
} from "./shared";

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

describe("env variable catalog", () => {
  it("mantem NEXT_PUBLIC_* como variaveis publicas", () => {
    expect(listPublicEnvVariables().every((key) => key.startsWith("NEXT_PUBLIC_"))).toBe(true);
  });

  it("mantem variaveis sem NEXT_PUBLIC_* como server-only", () => {
    expect(listServerOnlyEnvVariables().every((key) => !key.startsWith("NEXT_PUBLIC_"))).toBe(true);
  });

  it("documenta no .env.example todas as variaveis do catalogo compartilhado", () => {
    const envExamplePath = path.join(process.cwd(), ".env.example");
    const envExample = readFileSync(envExamplePath, "utf8");

    for (const key of Object.keys(ENV_VARIABLES)) {
      expect(envExample).toContain(`${key}=`);
    }
  });
});

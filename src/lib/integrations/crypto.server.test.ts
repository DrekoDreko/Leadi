import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { getIntegrationSecretKey } from "./crypto.server";

const originalIntegrationSecretKey = process.env.INTEGRATIONS_SECRET_KEY;
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe("getIntegrationSecretKey", () => {
  afterEach(() => {
    if (originalIntegrationSecretKey === undefined) {
      delete process.env.INTEGRATIONS_SECRET_KEY;
    } else {
      process.env.INTEGRATIONS_SECRET_KEY = originalIntegrationSecretKey;
    }

    if (originalServiceRoleKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
    }
  });

  it("usa apenas INTEGRATIONS_SECRET_KEY como seed dedicada", () => {
    process.env.INTEGRATIONS_SECRET_KEY = "integration-seed";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-seed";

    expect(getIntegrationSecretKey()).toEqual(getIntegrationSecretKey());
  });

  it("falha quando INTEGRATIONS_SECRET_KEY nao esta configurada", () => {
    delete process.env.INTEGRATIONS_SECRET_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-seed";

    expect(() => getIntegrationSecretKey()).toThrow(
      "INTEGRATIONS_SECRET_KEY deve estar configurado no servidor para cifrar segredos de integracao."
    );
  });
});

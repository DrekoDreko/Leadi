import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMetaOAuthScopeDetails, getMetaOAuthScopes } from "./config";

vi.mock("server-only", () => ({}));

describe("Meta OAuth scope groups", () => {
  const originalValue = process.env.META_OAUTH_SCOPE_GROUPS;

  beforeEach(() => {
    delete process.env.META_OAUTH_SCOPE_GROUPS;
  });

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.META_OAUTH_SCOPE_GROUPS;
    } else {
      process.env.META_OAUTH_SCOPE_GROUPS = originalValue;
    }
  });

  it("requests base scopes plus webhook page subscription by default", () => {
    expect(getMetaOAuthScopes()).toEqual([
      "pages_show_list",
      "leads_retrieval",
      "pages_manage_metadata"
    ]);
  });

  it("adds advanced scopes when the env enables their group", () => {
    process.env.META_OAUTH_SCOPE_GROUPS = "base,ads";
    const scopes = getMetaOAuthScopes();

    expect(scopes).toContain("ads_read");
    expect(scopes).toContain("ads_management");
    expect(scopes).toContain("business_management");
    // base is always present
    expect(scopes).toContain("pages_show_list");
    expect(scopes).toContain("leads_retrieval");
  });

  it("always includes base even when the env omits it", () => {
    process.env.META_OAUTH_SCOPE_GROUPS = "ads";
    const scopes = getMetaOAuthScopes();

    expect(scopes).toContain("pages_show_list");
    expect(scopes).toContain("leads_retrieval");
  });

  it("ignores invalid groups without breaking the default flow", () => {
    process.env.META_OAUTH_SCOPE_GROUPS = "base,does_not_exist";
    expect(getMetaOAuthScopes()).toEqual([
      "pages_show_list",
      "leads_retrieval",
      "pages_manage_metadata"
    ]);
  });

  it("requests pages_manage_metadata for the webhook page subscription", () => {
    process.env.META_OAUTH_SCOPE_GROUPS = "base";
    expect(getMetaOAuthScopes()).toContain("pages_manage_metadata");
  });

  it("flags which groups are enabled in the scope details", () => {
    process.env.META_OAUTH_SCOPE_GROUPS = "base,lead_forms";
    const details = getMetaOAuthScopeDetails();

    const leadForms = details.find((detail) => detail.scope === "pages_read_engagement");
    const ads = details.find((detail) => detail.scope === "ads_management");

    expect(leadForms?.enabled).toBe(true);
    expect(ads?.enabled).toBe(false);
  });
});

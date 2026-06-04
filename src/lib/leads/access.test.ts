import { describe, expect, it } from "vitest";
import {
  canManageLeadWithScope,
  canReadLeadWithScope,
  createLeadAccessScope
} from "./access";

describe("lead access scope", () => {
  it("mantem o owner com acesso a todos os leads da organizacao", () => {
    const scope = createLeadAccessScope({
      role: "owner",
      profileId: "owner-1"
    });

    expect(
      canReadLeadWithScope(scope, {
        owner_profile_id: "seller-2",
        team_id: "team-b",
        source: "manual"
      })
    ).toBe(true);
  });

  it("restringe admin aos leads da propria equipe", () => {
    const scope = createLeadAccessScope({
      role: "admin",
      profileId: "admin-1",
      teamIds: ["team-a", "team-a"]
    });

    expect(
      canReadLeadWithScope(scope, {
        owner_profile_id: "seller-1",
        team_id: "team-a",
        source: "manual"
      })
    ).toBe(true);

    expect(
      canReadLeadWithScope(scope, {
        owner_profile_id: "seller-2",
        team_id: "team-b",
        source: "manual"
      })
    ).toBe(false);

    expect(scope.teamIds).toEqual(["team-a"]);
  });

  it("restringe seller aos proprios leads e preserva a regra da Meta", () => {
    const scope = createLeadAccessScope({
      role: "seller",
      profileId: "seller-1"
    });

    expect(
      canReadLeadWithScope(scope, {
        owner_profile_id: "seller-1",
        team_id: "team-a",
        source: "manual"
      })
    ).toBe(true);

    expect(
      canReadLeadWithScope(scope, {
        owner_profile_id: "seller-2",
        team_id: "team-a",
        source: "manual"
      })
    ).toBe(false);

    expect(
      canManageLeadWithScope(scope, {
        owner_profile_id: "seller-1",
        team_id: "team-a",
        source: "meta_lead_ads"
      })
    ).toBe(false);

    expect(
      canManageLeadWithScope(
        scope,
        {
          owner_profile_id: "seller-1",
          team_id: "team-a",
          source: "meta_lead_ads"
        },
        true
      )
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { PERMISSION_MAP, Permission } from "./permission-map";

describe("PERMISSION_MAP", () => {
  it("should have all expected permissions", () => {
    const expectedPermissions: Permission[] = [
      "view_billing",
      "buy_credits",
      "request_credits",
      "approve_purchases",
      "view_team_credits",
      "view_own_credits",
      "view_all_leads",
      "view_team_leads",
      "view_own_leads",
      "import_leads",
      "import_meta_leads",
      "export_leads",
      "delete_archive_leads",
      "distribute_leads",
      "edit_own_lead",
      "move_lead_stage",
      "create_ad",
      "approve_ad",
      "publish_ad",
      "view_running_ads",
      "configure_meta_ads",
      "invite_supervisor",
      "invite_consultant",
      "approve_consultant",
      "remove_deactivate_user",
      "view_org_reports",
      "view_team_reports",
      "use_ai_messages",
      "use_ai_images",
      "edit_company_profile",
    ];

    expect(Object.keys(PERMISSION_MAP)).toHaveLength(expectedPermissions.length);
    for (const p of expectedPermissions) {
      expect(PERMISSION_MAP).toHaveProperty(p);
    }
  });

  describe("Role matrix", () => {
    it("owner permissions", () => {
      const ownerPerms = Object.keys(PERMISSION_MAP).filter(p => PERMISSION_MAP[p as Permission].includes("owner"));
      // owner doesn't need request_credits
      expect(ownerPerms).not.toContain("request_credits");
      expect(ownerPerms.length).toBe(Object.keys(PERMISSION_MAP).length - 1);
    });

    it("admin permissions", () => {
      const adminPerms = Object.keys(PERMISSION_MAP).filter(p => PERMISSION_MAP[p as Permission].includes("admin"));
      const expectedAdminPerms: Permission[] = [
        "request_credits",
        "view_team_credits",
        "view_own_credits",
        "view_team_leads",
        "view_own_leads",
        "import_leads",
        "distribute_leads",
        "edit_own_lead",
        "move_lead_stage",
        "create_ad",
        "view_running_ads",
        "invite_consultant",
        "remove_deactivate_user",
        "view_team_reports",
        "use_ai_messages",
        "use_ai_images"
      ];
      expect(adminPerms.sort()).toEqual(expectedAdminPerms.sort());
    });

    it("seller permissions", () => {
      const sellerPerms = Object.keys(PERMISSION_MAP).filter(p => PERMISSION_MAP[p as Permission].includes("seller"));
      const expectedSellerPerms: Permission[] = [
        "view_own_credits",
        "view_own_leads",
        "edit_own_lead",
        "move_lead_stage",
        "use_ai_messages",
        "use_ai_images"
      ];
      expect(sellerPerms.sort()).toEqual(expectedSellerPerms.sort());
    });
  });
});

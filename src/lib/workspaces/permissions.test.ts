import { describe, expect, it } from "vitest";
import {
  can,
  canOrThrow,
  canAll,
  canAny,
  canProfileCreateAd,
  canManageOwnMetaConnection
} from "./permissions";

describe("Workspace Permissions Helpers", () => {
  describe("can()", () => {
    it("should return true when role has permission", () => {
      // Owner can view billing
      expect(can("owner", "view_billing")).toBe(true);
      
      // Admin can request credits
      expect(can("admin", "request_credits")).toBe(true);
      
      // Seller can edit own lead
      expect(can("seller", "edit_own_lead")).toBe(true);
    });

    it("should return false when role does not have permission", () => {
      // Seller cannot view billing
      expect(can("seller", "view_billing")).toBe(false);
      
      // Admin cannot approve purchases
      expect(can("admin", "approve_purchases")).toBe(false);
    });

    it("should handle null or undefined role by normalizing to seller", () => {
      // Seller has permission
      expect(can(null, "edit_own_lead")).toBe(true);
      expect(can(undefined, "edit_own_lead")).toBe(true);
      
      // Seller does not have permission
      expect(can(null, "view_billing")).toBe(false);
      expect(can(undefined, "view_billing")).toBe(false);
    });

    it("should handle non-standard role by normalizing to correct role", () => {
      // supervisor is normalized to admin
      expect(can("supervisor", "request_credits")).toBe(true);
      expect(can("supervisor", "view_billing")).toBe(false);
      
      // unknown role is normalized to seller
      expect(can("unknown", "edit_own_lead")).toBe(true);
      expect(can("unknown", "view_billing")).toBe(false);
    });
  });

  describe("canOrThrow()", () => {
    it("should not throw when role has permission", () => {
      expect(() => canOrThrow("owner", "view_billing")).not.toThrow();
    });

    it("should throw default error when role does not have permission", () => {
      expect(() => canOrThrow("seller", "view_billing")).toThrowError(
        "Access denied. Requires permission: view_billing"
      );
    });

    it("should throw custom error message when provided", () => {
      expect(() => canOrThrow("seller", "view_billing", "Custom error")).toThrowError("Custom error");
    });
    
    it("should correctly block admin from forbidden actions", () => {
      expect(() => canOrThrow("admin", "view_billing")).toThrow();
      expect(() => canOrThrow("admin", "buy_credits")).toThrow();
      expect(() => canOrThrow("admin", "publish_ad")).toThrow();
      expect(() => canOrThrow("admin", "export_leads")).toThrow();
      expect(() => canOrThrow("admin", "configure_meta_ads")).toThrow();
    });

    it("should correctly block seller from forbidden actions", () => {
      expect(() => canOrThrow("seller", "view_billing")).toThrow();
      expect(() => canOrThrow("seller", "view_team_leads")).toThrow();
      expect(() => canOrThrow("seller", "import_leads")).toThrow();
      expect(() => canOrThrow("seller", "distribute_leads")).toThrow();
      expect(() => canOrThrow("seller", "create_ad")).toThrow();
    });
  });

  describe("canAll()", () => {
    it("should return true when role has all permissions", () => {
      expect(canAll("owner", ["view_billing", "create_ad"])).toBe(true);
    });

    it("should return false when role is missing at least one permission", () => {
      // seller has edit_own_lead but not create_ad
      expect(canAll("seller", ["edit_own_lead", "create_ad"])).toBe(false);
    });

    it("should return true when permissions array is empty", () => {
      expect(canAll("seller", [])).toBe(true);
    });
  });

  describe("canProfileCreateAd()", () => {
    it("owner e admin criam anúncio pelo papel, independente do grant", () => {
      expect(canProfileCreateAd("owner", false)).toBe(true);
      expect(canProfileCreateAd("admin", false)).toBe(true);
    });

    it("consultor só cria anúncio quando liberado pelo owner", () => {
      expect(canProfileCreateAd("seller", false)).toBe(false);
      expect(canProfileCreateAd("seller", true)).toBe(true);
    });

    it("trata null/undefined no grant como sem liberação", () => {
      expect(canProfileCreateAd("seller", null)).toBe(false);
      expect(canProfileCreateAd("seller", undefined)).toBe(false);
    });
  });

  describe("canManageOwnMetaConnection()", () => {
    it("só o consultor liberado gerencia a própria conexão Meta", () => {
      expect(canManageOwnMetaConnection("seller", true)).toBe(true);
      expect(canManageOwnMetaConnection("seller", false)).toBe(false);
    });

    it("owner/admin não usam a conexão pessoal (gerenciam a da corretora)", () => {
      expect(canManageOwnMetaConnection("owner", true)).toBe(false);
      expect(canManageOwnMetaConnection("admin", true)).toBe(false);
    });
  });

  describe("canAny()", () => {
    it("should return true when role has at least one permission", () => {
      // seller has edit_own_lead but not create_ad, so returns true
      expect(canAny("seller", ["edit_own_lead", "create_ad"])).toBe(true);
    });

    it("should return false when role has none of the permissions", () => {
      expect(canAny("seller", ["view_billing", "create_ad"])).toBe(false);
    });

    it("should return false when permissions array is empty", () => {
      expect(canAny("seller", [])).toBe(false);
    });
  });
});

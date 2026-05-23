import { describe, expect, it, vi } from "vitest";
import { sanitizeWebhookPayloadForStorage } from "./webhook-events.server";

vi.mock("server-only", () => ({}));

describe("sanitizeWebhookPayloadForStorage", () => {
  it("preserva diagnostico essencial sem manter PII bruta", () => {
    const result = sanitizeWebhookPayloadForStorage({
      source: "meta_lead_ads",
      processing_outcome: "duplicate",
      duplicate: true,
      duplicate_reason: "meta_lead_id",
      summary_message: "Lead absorvido como duplicado com seguranca.",
      meta_lead_summary: {
        lead_id: "123",
        form_id: "form-1",
        campaign_id: "cmp-1",
        adset_id: "adset-1",
        ad_id: "ad-1",
        created_time: "2026-05-20T00:00:00.000Z",
        platform: "facebook",
        field_names: ["full_name", "email"],
        unmapped_field_names: ["diagnostico"]
      },
      meta_webhook_event: {
        leadgen_id: "lead-123",
        form_id: "form-1",
        page_id: "page-1",
        field: "leadgen"
      },
      name: "Cliente Sensivel",
      email: "cliente@example.com"
    });

    expect(result).toMatchObject({
      source: "meta_lead_ads",
      processing_outcome: "duplicate",
      duplicate: true,
      duplicate_reason: "meta_lead_id",
      summary_message: "Lead absorvido como duplicado com seguranca."
    });
    expect(result).toHaveProperty("meta_lead_summary");
    expect(result).toHaveProperty("meta_webhook_event");
    expect(result).not.toHaveProperty("name");
    expect(result).not.toHaveProperty("email");
  });

  it("resume o payload bruto da Meta quando so o webhook original esta disponivel", () => {
    const result = sanitizeWebhookPayloadForStorage({
      source: "meta_lead_ads",
      processing_outcome: "failed",
      meta_webhook_payload: {
        object: "page",
        entry: [
          {
            changes: [
              { field: "leadgen" },
              { field: "feed" }
            ]
          }
        ]
      }
    });

    expect(result).toMatchObject({
      source: "meta_lead_ads",
      processing_outcome: "failed",
      meta_webhook_summary: {
        object: "page",
        entry_count: 1,
        leadgen_event_count: 1
      }
    });
  });
});

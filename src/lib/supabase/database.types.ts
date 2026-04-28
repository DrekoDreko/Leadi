export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type LeadSource = "manual" | "csv_import" | "meta_lead_ads" | "make_zapier" | "api";
export type LeadStage = "new" | "qualification" | "proposal" | "negotiation" | "won" | "lost";

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          organization_id: string;
          full_name: string | null;
          email: string;
          role: "owner" | "admin" | "seller";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          organization_id: string;
          full_name?: string | null;
          email: string;
          role?: "owner" | "admin" | "seller";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          organization_id?: string;
          full_name?: string | null;
          email?: string;
          role?: "owner" | "admin" | "seller";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          owner_profile_id: string | null;
          name: string;
          phone: string | null;
          phone_e164: string | null;
          email: string | null;
          city: string | null;
          company_name: string | null;
          lives_count: number | null;
          stage: LeadStage;
          source: LeadSource;
          score: number;
          next_contact_at: string | null;
          budget: string | null;
          interest: string | null;
          last_interaction: string | null;
          notes: string | null;
          source_campaign: string | null;
          source_adset: string | null;
          source_ad: string | null;
          meta_lead_id: string | null;
          meta_form_id: string | null;
          meta_page_id: string | null;
          meta_campaign_id: string | null;
          meta_adset_id: string | null;
          meta_ad_id: string | null;
          raw_payload: Json;
          received_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          owner_profile_id?: string | null;
          name: string;
          phone?: string | null;
          phone_e164?: string | null;
          email?: string | null;
          city?: string | null;
          company_name?: string | null;
          lives_count?: number | null;
          stage?: LeadStage;
          source?: LeadSource;
          score?: number;
          next_contact_at?: string | null;
          budget?: string | null;
          interest?: string | null;
          last_interaction?: string | null;
          notes?: string | null;
          source_campaign?: string | null;
          source_adset?: string | null;
          source_ad?: string | null;
          meta_lead_id?: string | null;
          meta_form_id?: string | null;
          meta_page_id?: string | null;
          meta_campaign_id?: string | null;
          meta_adset_id?: string | null;
          meta_ad_id?: string | null;
          raw_payload?: Json;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          owner_profile_id?: string | null;
          name?: string;
          phone?: string | null;
          phone_e164?: string | null;
          email?: string | null;
          city?: string | null;
          company_name?: string | null;
          lives_count?: number | null;
          stage?: LeadStage;
          source?: LeadSource;
          score?: number;
          next_contact_at?: string | null;
          budget?: string | null;
          interest?: string | null;
          last_interaction?: string | null;
          notes?: string | null;
          source_campaign?: string | null;
          source_adset?: string | null;
          source_ad?: string | null;
          meta_lead_id?: string | null;
          meta_form_id?: string | null;
          meta_page_id?: string | null;
          meta_campaign_id?: string | null;
          meta_adset_id?: string | null;
          meta_ad_id?: string | null;
          raw_payload?: Json;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lead_source: LeadSource;
      lead_stage: LeadStage;
    };
    CompositeTypes: Record<string, never>;
  };
};

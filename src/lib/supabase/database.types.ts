export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CampaignStatus = "generated" | "archived";
export type CampaignPublishMode = "draft" | "manual_review" | "scheduled" | "paused";
export type CampaignPublicationStatus =
  | "not_connected"
  | "ready_to_prepare"
  | "draft_created"
  | "pending_review"
  | "published"
  | "paused"
  | "failed";
export type CreativeRequestCommentVisibility = "workspace" | "ops_only";
export type CreativeRequestType = "design" | "video" | "campaign";
export type CreativeRequestStatus =
  | "requested"
  | "in_review"
  | "in_progress"
  | "delivered"
  | "approved"
  | "cancelled";
export type CreativeRequestPriority = "low" | "medium" | "high" | "urgent";
export type LeadSource = "manual" | "csv_import" | "meta_lead_ads" | "make_zapier" | "api";
export type LeadTaskStatus = "open" | "in_progress" | "completed" | "cancelled";
export type LeadTaskPriority = "low" | "medium" | "high";
export type MetaConnectionStatus = "active" | "inactive" | "error" | "revoked";
export type LeadWebhookEventStatus = "processed" | "failed";
export type LeadStage = "new" | "qualification" | "proposal" | "negotiation" | "won" | "lost";
export type PlanStatus = "active" | "inactive" | "archived";
export type BillingProviderGateway = "asaas" | "mercado_pago" | "stripe" | "abacatepay";
export type BillingGateway = "internal" | BillingProviderGateway | "manual";
export type BillingIntervalUnit = "day" | "week" | "month" | "year";
export type SubscriptionStatus = "pending" | "trialing" | "active" | "past_due" | "paused" | "cancelled" | "expired";
export type PaymentEventStatus = "pending" | "processed" | "failed" | "cancelled";
export type IntegrationConnectionStatus = "connected" | "disconnected" | "expired" | "pending" | "error";
export type IntegrationProvider = "meta" | "openai";
export type IntegrationSyncStatus = "success" | "warning" | "failed" | "error" | "running";
export type WhatsAppDeliveryProvider = "official_meta" | "external_http";
export type WhatsAppDeliveryStatus =
  | "not_requested"
  | "pending_config"
  | "opt_in_required"
  | "credentials_missing"
  | "queued"
  | "sent"
  | "failed"
  | "rate_limited"
  | "blocked";
export type WhatsAppStage = LeadStage;
export type ProfileRole = "owner" | "admin" | "seller";
export type WorkspaceType = "solo" | "team";
export type WorkspaceMemberRole = "owner" | "admin" | "seller";
export type WorkspaceMemberStatus = "active" | "invited" | "removed";
export type InviteStatus = "active" | "expired" | "used";
export type InviteApprovalStatus = "not_required" | "pending" | "approved" | "rejected";
export type AuditLogStatus = "success" | "failure";
export type CreditWalletType = "organization" | "team" | "user";
export type CreditTransactionType = "purchase" | "allocation" | "usage" | "refund" | "revocation";

export type Database = {
  public: {
    Tables: {
      credit_wallets: {
        Row: {
          id: string;
          organization_id: string;
          team_id: string | null;
          profile_id: string | null;
          wallet_type: CreditWalletType;
          available_credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          team_id?: string | null;
          profile_id?: string | null;
          wallet_type: CreditWalletType;
          available_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          team_id?: string | null;
          profile_id?: string | null;
          wallet_type?: CreditWalletType;
          available_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_wallets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_wallets_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_wallets_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      credit_transactions: {
        Row: {
          id: string;
          organization_id: string;
          wallet_id: string;
          team_id: string | null;
          actor_id: string;
          target_user_id: string | null;
          transaction_type: CreditTransactionType;
          amount: number;
          balance_after: number;
          reason: string | null;
          reference_type: string | null;
          reference_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          wallet_id: string;
          team_id?: string | null;
          actor_id: string;
          target_user_id?: string | null;
          transaction_type: CreditTransactionType;
          amount: number;
          balance_after: number;
          reason?: string | null;
          reference_type?: string | null;
          reference_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          wallet_id?: string;
          team_id?: string | null;
          actor_id?: string;
          target_user_id?: string | null;
          transaction_type?: CreditTransactionType;
          amount?: number;
          balance_after?: number;
          reason?: string | null;
          reference_type?: string | null;
          reference_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_wallet_id_fkey";
            columns: ["wallet_id"];
            isOneToOne: false;
            referencedRelation: "credit_wallets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      lead_assignments: {
        Row: {
          id: string;
          organization_id: string;
          team_id: string;
          lead_id: string;
          assigned_to_profile_id: string;
          assigned_by_profile_id: string;
          previous_owner_profile_id: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          team_id: string;
          lead_id: string;
          assigned_to_profile_id: string;
          assigned_by_profile_id: string;
          previous_owner_profile_id?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          team_id?: string;
          lead_id?: string;
          assigned_to_profile_id?: string;
          assigned_by_profile_id?: string;
          previous_owner_profile_id?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_assignments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_assignments_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_assignments_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_assignments_assigned_to_profile_id_fkey";
            columns: ["assigned_to_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_assignments_assigned_by_profile_id_fkey";
            columns: ["assigned_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_assignments_previous_owner_profile_id_fkey";
            columns: ["previous_owner_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      approval_requests: {
        Row: {
          id: string;
          organization_id: string;
          team_id: string | null;
          request_type: "credit_purchase" | "credit_allocation" | "ad_publication" | "ad_budget_increase" | "member_add" | "member_remove";
          status: "pending" | "approved" | "rejected" | "cancelled";
          requested_by_profile_id: string;
          reviewed_by_profile_id: string | null;
          reviewed_at: string | null;
          title: string;
          description: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          team_id?: string | null;
          request_type: "credit_purchase" | "credit_allocation" | "ad_publication" | "ad_budget_increase" | "member_add" | "member_remove";
          status?: "pending" | "approved" | "rejected" | "cancelled";
          requested_by_profile_id: string;
          reviewed_by_profile_id?: string | null;
          reviewed_at?: string | null;
          title: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          team_id?: string | null;
          request_type?: "credit_purchase" | "credit_allocation" | "ad_publication" | "ad_budget_increase" | "member_add" | "member_remove";
          status?: "pending" | "approved" | "rejected" | "cancelled";
          requested_by_profile_id?: string;
          reviewed_by_profile_id?: string | null;
          reviewed_at?: string | null;
          title?: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "approval_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_requests_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_requests_requested_by_profile_id_fkey";
            columns: ["requested_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_requests_reviewed_by_profile_id_fkey";
            columns: ["reviewed_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      ad_approval_requests: {
        Row: {
          id: string;
          organization_id: string;
          team_id: string | null;
          campaign_id: string;
          requested_by_profile_id: string;
          reviewed_by_profile_id: string | null;
          status: "pending" | "approved" | "rejected" | "needs_adjustment";
          review_notes: string | null;
          metadata: Json;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          team_id?: string | null;
          campaign_id: string;
          requested_by_profile_id: string;
          reviewed_by_profile_id?: string | null;
          status?: "pending" | "approved" | "rejected" | "needs_adjustment";
          review_notes?: string | null;
          metadata?: Json;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          team_id?: string | null;
          campaign_id?: string;
          requested_by_profile_id?: string;
          reviewed_by_profile_id?: string | null;
          status?: "pending" | "approved" | "rejected" | "needs_adjustment";
          review_notes?: string | null;
          metadata?: Json;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_approval_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_approval_requests_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_approval_requests_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_approval_requests_requested_by_profile_id_fkey";
            columns: ["requested_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_approval_requests_reviewed_by_profile_id_fkey";
            columns: ["reviewed_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          team_id: string | null;
          actor_profile_id: string | null;
          actor_role: ProfileRole | null;
          action: string;
          target_type: string;
          target_id: string | null;
          status: AuditLogStatus;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          team_id?: string | null;
          actor_profile_id?: string | null;
          actor_role?: ProfileRole | null;
          action: string;
          target_type?: string;
          target_id?: string | null;
          status?: AuditLogStatus;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          team_id?: string | null;
          actor_profile_id?: string | null;
          actor_role?: ProfileRole | null;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          status?: AuditLogStatus;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      credit_requests: {
        Row: {
          id: string;
          organization_id: string;
          team_id: string | null;
          requested_by_profile_id: string;
          approved_by_profile_id: string | null;
          request_type: "team" | "user" | "campaign" | "image";
          status: "pending" | "approved" | "rejected" | "cancelled";
          amount_requested: number;
          amount_approved: number | null;
          credits_per_consultant: number | null;
          consultant_count: number | null;
          reason: string;
          review_notes: string | null;
          metadata: Json;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          team_id?: string | null;
          requested_by_profile_id: string;
          approved_by_profile_id?: string | null;
          request_type: "team" | "user" | "campaign" | "image";
          status?: "pending" | "approved" | "rejected" | "cancelled";
          amount_requested: number;
          amount_approved?: number | null;
          credits_per_consultant?: number | null;
          consultant_count?: number | null;
          reason: string;
          review_notes?: string | null;
          metadata?: Json;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          team_id?: string | null;
          requested_by_profile_id?: string;
          approved_by_profile_id?: string | null;
          request_type?: "team" | "user" | "campaign" | "image";
          status?: "pending" | "approved" | "rejected" | "cancelled";
          amount_requested?: number;
          amount_approved?: number | null;
          credits_per_consultant?: number | null;
          consultant_count?: number | null;
          reason?: string;
          review_notes?: string | null;
          metadata?: Json;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_requests_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_requests_requested_by_profile_id_fkey";
            columns: ["requested_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_requests_approved_by_profile_id_fkey";
            columns: ["approved_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          created_by_profile_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          created_by_profile_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          created_by_profile_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_created_by_profile_id_fkey";
            columns: ["created_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          profile_id: string;
          organization_id: string;
          role: "supervisor" | "consultant";
          status: "active" | "inactive" | "pending_approval";
          added_by_profile_id: string;
          approved_by_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          profile_id: string;
          organization_id: string;
          role: "supervisor" | "consultant";
          status?: "active" | "inactive" | "pending_approval";
          added_by_profile_id: string;
          approved_by_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          profile_id?: string;
          organization_id?: string;
          role?: "supervisor" | "consultant";
          status?: "active" | "inactive" | "pending_approval";
          added_by_profile_id?: string;
          approved_by_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_added_by_profile_id_fkey";
            columns: ["added_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_approved_by_profile_id_fkey";
            columns: ["approved_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      campaigns: {
        Row: {
          id: string;
          organization_id: string;
          created_by_profile_id: string;
          team_id: string | null;
          status: CampaignStatus;
          connected_account_id: string | null;
          meta_page_id: string | null;
          meta_ad_account_id: string | null;
          meta_lead_form_id: string | null;
          publish_mode: CampaignPublishMode;
          publication_status: CampaignPublicationStatus;
          approval_status: "not_required" | "pending" | "approved" | "rejected" | "needs_adjustment";
          meta_campaign_id: string | null;
          meta_adset_id: string | null;
          meta_ad_id: string | null;
          publication_message: string | null;
          prepared_at: string | null;
          published_at: string | null;
          last_publication_attempt_at: string | null;
          last_publication_error: string | null;
          product: string;
          audience: string;
          offer: string;
          region: string;
          differentiator: string;
          tone: string;
          campaign_name: string;
          primary_text: string;
          headline: string;
          description: string;
          call_to_action: string;
          suggested_audience: string;
          variants: Json;
          compliance_notes: Json;
          input_payload: Json;
          result_payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by_profile_id: string;
          team_id?: string | null;
          status?: CampaignStatus;
          connected_account_id?: string | null;
          meta_page_id?: string | null;
          meta_ad_account_id?: string | null;
          meta_lead_form_id?: string | null;
          publish_mode?: CampaignPublishMode;
          publication_status?: CampaignPublicationStatus;
          approval_status?: "not_required" | "pending" | "approved" | "rejected" | "needs_adjustment";
          meta_campaign_id?: string | null;
          meta_adset_id?: string | null;
          meta_ad_id?: string | null;
          publication_message?: string | null;
          prepared_at?: string | null;
          published_at?: string | null;
          last_publication_attempt_at?: string | null;
          last_publication_error?: string | null;
          product?: string;
          audience: string;
          offer: string;
          region: string;
          differentiator: string;
          tone: string;
          campaign_name: string;
          primary_text: string;
          headline: string;
          description: string;
          call_to_action: string;
          suggested_audience: string;
          variants?: Json;
          compliance_notes?: Json;
          input_payload?: Json;
          result_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by_profile_id?: string;
          team_id?: string | null;
          status?: CampaignStatus;
          connected_account_id?: string | null;
          meta_page_id?: string | null;
          meta_ad_account_id?: string | null;
          meta_lead_form_id?: string | null;
          publish_mode?: CampaignPublishMode;
          publication_status?: CampaignPublicationStatus;
          approval_status?: "not_required" | "pending" | "approved" | "rejected" | "needs_adjustment";
          meta_campaign_id?: string | null;
          meta_adset_id?: string | null;
          meta_ad_id?: string | null;
          publication_message?: string | null;
          prepared_at?: string | null;
          published_at?: string | null;
          last_publication_attempt_at?: string | null;
          last_publication_error?: string | null;
          product?: string;
          audience?: string;
          offer?: string;
          region?: string;
          differentiator?: string;
          tone?: string;
          campaign_name?: string;
          primary_text?: string;
          headline?: string;
          description?: string;
          call_to_action?: string;
          suggested_audience?: string;
          variants?: Json;
          compliance_notes?: Json;
          input_payload?: Json;
          result_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meta_campaign_publication_attempts: {
        Row: {
          id: string;
          organization_id: string;
          campaign_id: string;
          connected_account_id: string | null;
          created_by_profile_id: string;
          publish_mode: CampaignPublishMode;
          status: "pending" | "success" | "failed" | "skipped";
          request_payload: Json;
          response_payload: Json;
          error_message: string | null;
          meta_campaign_id: string | null;
          meta_adset_id: string | null;
          meta_ad_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          campaign_id: string;
          connected_account_id?: string | null;
          created_by_profile_id: string;
          publish_mode: CampaignPublishMode;
          status?: "pending" | "success" | "failed" | "skipped";
          request_payload?: Json;
          response_payload?: Json;
          error_message?: string | null;
          meta_campaign_id?: string | null;
          meta_adset_id?: string | null;
          meta_ad_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          campaign_id?: string;
          connected_account_id?: string | null;
          created_by_profile_id?: string;
          publish_mode?: CampaignPublishMode;
          status?: "pending" | "success" | "failed" | "skipped";
          request_payload?: Json;
          response_payload?: Json;
          error_message?: string | null;
          meta_campaign_id?: string | null;
          meta_adset_id?: string | null;
          meta_ad_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      creative_requests: {
        Row: {
          id: string;
          organization_id: string;
          requester_profile_id: string;
          type: CreativeRequestType;
          title: string;
          objective: string;
          briefing: string;
          notes: string | null;
          status: CreativeRequestStatus;
          priority: CreativeRequestPriority;
          due_at: string | null;
          files: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          requester_profile_id: string;
          type: CreativeRequestType;
          title: string;
          objective: string;
          briefing: string;
          notes?: string | null;
          status?: CreativeRequestStatus;
          priority?: CreativeRequestPriority;
          due_at?: string | null;
          files?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          requester_profile_id?: string;
          type?: CreativeRequestType;
          title?: string;
          objective?: string;
          briefing?: string;
          notes?: string | null;
          status?: CreativeRequestStatus;
          priority?: CreativeRequestPriority;
          due_at?: string | null;
          files?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dashboard_reminders: {
        Row: {
          id: string;
          organization_id: string;
          created_by_profile_id: string;
          reminder_date: string;
          remind_at: string;
          message: string;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by_profile_id: string;
          reminder_date: string;
          remind_at: string;
          message: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by_profile_id?: string;
          reminder_date?: string;
          remind_at?: string;
          message?: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meta_ad_image_uploads: {
        Row: {
          id: string;
          organization_id: string;
          connected_account_id: string;
          meta_ad_account_id: string;
          creative_request_id: string | null;
          campaign_id: string | null;
          source_filename: string;
          source_mime_type: string;
          source_size_bytes: number;
          meta_image_hash: string | null;
          meta_image_id: string | null;
          meta_image_url: string | null;
          meta_response: Json;
          local_status: "pending" | "uploaded" | "failed";
          uploaded_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          connected_account_id: string;
          meta_ad_account_id: string;
          creative_request_id?: string | null;
          campaign_id?: string | null;
          source_filename: string;
          source_mime_type: string;
          source_size_bytes: number;
          meta_image_hash?: string | null;
          meta_image_id?: string | null;
          meta_image_url?: string | null;
          meta_response?: Json;
          local_status?: "pending" | "uploaded" | "failed";
          uploaded_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          connected_account_id?: string;
          meta_ad_account_id?: string;
          creative_request_id?: string | null;
          campaign_id?: string | null;
          source_filename?: string;
          source_mime_type?: string;
          source_size_bytes?: number;
          meta_image_hash?: string | null;
          meta_image_id?: string | null;
          meta_image_url?: string | null;
          meta_response?: Json;
          local_status?: "pending" | "uploaded" | "failed";
          uploaded_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      creative_request_comments: {
        Row: {
          id: string;
          organization_id: string;
          creative_request_id: string;
          author_profile_id: string;
          author_name: string;
          author_email: string;
          body: string;
          visibility: CreativeRequestCommentVisibility;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          creative_request_id: string;
          author_profile_id: string;
          author_name: string;
          author_email: string;
          body: string;
          visibility?: CreativeRequestCommentVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          creative_request_id?: string;
          author_profile_id?: string;
          author_name?: string;
          author_email?: string;
          body?: string;
          visibility?: CreativeRequestCommentVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      whatsapp_messages: {
        Row: {
          id: string;
          organization_id: string;
          created_by_profile_id: string;
          lead_id: string | null;
          lead_name: string;
          lead_context: string;
          product: string;
          stage: WhatsAppStage;
          objective: string;
          tone: string;
          opening_message: string;
          follow_up_message: string;
          objection_reply: string;
          compliance_notes: Json;
          input_payload: Json;
          result_payload: Json;
          delivery_provider: WhatsAppDeliveryProvider | null;
          delivery_status: WhatsAppDeliveryStatus;
          delivery_attempted_at: string | null;
          delivery_sent_at: string | null;
          delivery_provider_message_id: string | null;
          delivery_error_code: string | null;
          delivery_error_message: string | null;
          delivery_request_payload: Json;
          delivery_response_payload: Json;
          delivery_history: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by_profile_id: string;
          lead_id?: string | null;
          lead_name: string;
          lead_context?: string;
          product?: string;
          stage?: WhatsAppStage;
          objective: string;
          tone: string;
          opening_message: string;
          follow_up_message: string;
          objection_reply: string;
          compliance_notes?: Json;
          input_payload?: Json;
          result_payload?: Json;
          delivery_provider?: WhatsAppDeliveryProvider | null;
          delivery_status?: WhatsAppDeliveryStatus;
          delivery_attempted_at?: string | null;
          delivery_sent_at?: string | null;
          delivery_provider_message_id?: string | null;
          delivery_error_code?: string | null;
          delivery_error_message?: string | null;
          delivery_request_payload?: Json;
          delivery_response_payload?: Json;
          delivery_history?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by_profile_id?: string;
          lead_id?: string | null;
          lead_name?: string;
          lead_context?: string;
          product?: string;
          stage?: WhatsAppStage;
          objective?: string;
          tone?: string;
          opening_message?: string;
          follow_up_message?: string;
          objection_reply?: string;
          compliance_notes?: Json;
          input_payload?: Json;
          result_payload?: Json;
          delivery_provider?: WhatsAppDeliveryProvider | null;
          delivery_status?: WhatsAppDeliveryStatus;
          delivery_attempted_at?: string | null;
          delivery_sent_at?: string | null;
          delivery_provider_message_id?: string | null;
          delivery_error_code?: string | null;
          delivery_error_message?: string | null;
          delivery_request_payload?: Json;
          delivery_response_payload?: Json;
          delivery_history?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      whatsapp_delivery_settings: {
        Row: {
          organization_id: string;
          provider: WhatsAppDeliveryProvider;
          sending_enabled: boolean;
          opt_in_confirmed_at: string | null;
          opt_in_confirmed_by_profile_id: string | null;
          provider_config: Json;
          last_configuration_check_at: string | null;
          last_configuration_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          provider?: WhatsAppDeliveryProvider;
          sending_enabled?: boolean;
          opt_in_confirmed_at?: string | null;
          opt_in_confirmed_by_profile_id?: string | null;
          provider_config?: Json;
          last_configuration_check_at?: string | null;
          last_configuration_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          provider?: WhatsAppDeliveryProvider;
          sending_enabled?: boolean;
          opt_in_confirmed_at?: string | null;
          opt_in_confirmed_by_profile_id?: string | null;
          provider_config?: Json;
          last_configuration_check_at?: string | null;
          last_configuration_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          type: WorkspaceType;
          owner_profile_id: string | null;
          slug: string | null;
          logo_url: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          cnpj: string | null;
          description: string | null;
          instagram: string | null;
          linkedin: string | null;
          address_cep: string | null;
          address_street: string | null;
          address_number: string | null;
          address_complement: string | null;
          address_neighborhood: string | null;
          address_city: string | null;
          address_state: string | null;
          plan_type: string | null;
          plan_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: WorkspaceType;
          owner_profile_id?: string | null;
          slug?: string | null;
          logo_url?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          cnpj?: string | null;
          description?: string | null;
          instagram?: string | null;
          linkedin?: string | null;
          address_cep?: string | null;
          address_street?: string | null;
          address_number?: string | null;
          address_complement?: string | null;
          address_neighborhood?: string | null;
          address_city?: string | null;
          address_state?: string | null;
          plan_type?: string | null;
          plan_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: WorkspaceType;
          owner_profile_id?: string | null;
          slug?: string | null;
          logo_url?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          cnpj?: string | null;
          description?: string | null;
          instagram?: string | null;
          linkedin?: string | null;
          address_cep?: string | null;
          address_street?: string | null;
          address_number?: string | null;
          address_complement?: string | null;
          address_neighborhood?: string | null;
          address_city?: string | null;
          address_state?: string | null;
          plan_type?: string | null;
          plan_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meta_integrations: {
        Row: {
          id: string;
          organization_id: string;
          connected_by_profile_id: string | null;
          connected_at: string | null;
          expires_at: string | null;
          meta_user_id: string | null;
          meta_user_name: string | null;
          meta_account_id: string | null;
          meta_account_name: string | null;
          access_token_ciphertext: string | null;
          access_token_reference: string | null;
          token_last_four: string | null;
          token_expires_at: string | null;
          scopes: string[];
          connection_status: IntegrationConnectionStatus;
          status: MetaConnectionStatus;
          last_synced_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          connected_by_profile_id?: string | null;
          connected_at?: string | null;
          expires_at?: string | null;
          meta_user_id?: string | null;
          meta_user_name?: string | null;
          meta_account_id?: string | null;
          meta_account_name?: string | null;
          access_token_ciphertext?: string | null;
          access_token_reference?: string | null;
          token_last_four?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          connection_status?: IntegrationConnectionStatus;
          status?: MetaConnectionStatus;
          last_synced_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          connected_by_profile_id?: string | null;
          connected_at?: string | null;
          expires_at?: string | null;
          meta_user_id?: string | null;
          meta_user_name?: string | null;
          meta_account_id?: string | null;
          meta_account_name?: string | null;
          access_token_ciphertext?: string | null;
          access_token_reference?: string | null;
          token_last_four?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          connection_status?: IntegrationConnectionStatus;
          status?: MetaConnectionStatus;
          last_synced_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meta_pages: {
        Row: {
          id: string;
          organization_id: string;
          integration_id: string;
          connected_account_id: string | null;
          page_id: string;
          page_name: string;
          category: string | null;
          status: MetaConnectionStatus;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          integration_id: string;
          connected_account_id?: string | null;
          page_id: string;
          page_name: string;
          category?: string | null;
          status?: MetaConnectionStatus;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          integration_id?: string;
          connected_account_id?: string | null;
          page_id?: string;
          page_name?: string;
          category?: string | null;
          status?: MetaConnectionStatus;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meta_forms: {
        Row: {
          id: string;
          organization_id: string;
          page_connection_id: string;
          connected_account_id: string | null;
          page_id: string;
          page_name: string;
          form_id: string;
          form_name: string;
          status: MetaConnectionStatus;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          page_connection_id: string;
          connected_account_id?: string | null;
          page_id: string;
          page_name: string;
          form_id: string;
          form_name: string;
          status?: MetaConnectionStatus;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          page_connection_id?: string;
          connected_account_id?: string | null;
          page_id?: string;
          page_name?: string;
          form_id?: string;
          form_name?: string;
          status?: MetaConnectionStatus;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meta_ad_accounts: {
        Row: {
          id: string;
          organization_id: string;
          connected_account_id: string;
          meta_ad_account_id: string;
          name: string;
          currency: string;
          timezone: string;
          status: IntegrationConnectionStatus;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          connected_account_id: string;
          meta_ad_account_id: string;
          name: string;
          currency: string;
          timezone: string;
          status?: IntegrationConnectionStatus;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          connected_account_id?: string;
          meta_ad_account_id?: string;
          name?: string;
          currency?: string;
          timezone?: string;
          status?: IntegrationConnectionStatus;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_ai_balances: {
        Row: {
          org_id: string;
          available_credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          available_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          org_id?: string;
          available_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_credit_ledger: {
        Row: {
          balance_after: number;
          id: string;
          org_id: string;
          credits: number;
          description: string | null;
          metadata: Json | null;
          reason: string | null;
          reference_id: string | null;
          reference_type: string | null;
          type: "purchase" | "monthly_grant" | "usage" | "refund" | "adjustment";
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          balance_after: number;
          id?: string;
          org_id: string;
          credits: number;
          description?: string | null;
          metadata?: Json | null;
          reason?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          type: "purchase" | "monthly_grant" | "usage" | "refund" | "adjustment";
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          balance_after?: number;
          id?: string;
          org_id?: string;
          credits?: number;
          description?: string | null;
          metadata?: Json | null;
          reason?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          type?: "purchase" | "monthly_grant" | "usage" | "refund" | "adjustment";
          user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_credit_orders: {
        Row: {
          amount_cents: number;
          created_at: string;
          credits: number;
          id: string;
          metadata: Json;
          organization_id: string;
          package_id: string;
          paid_at: string | null;
          payment_provider: string;
          provider_payment_id: string | null;
          provider_preference_id: string | null;
          status: "pending" | "paid" | "cancelled" | "failed" | "refunded";
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          credits: number;
          id?: string;
          metadata?: Json;
          organization_id: string;
          package_id: string;
          paid_at?: string | null;
          payment_provider?: string;
          provider_payment_id?: string | null;
          provider_preference_id?: string | null;
          status?: "pending" | "paid" | "cancelled" | "failed" | "refunded";
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          credits?: number;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          package_id?: string;
          paid_at?: string | null;
          payment_provider?: string;
          provider_payment_id?: string | null;
          provider_preference_id?: string | null;
          status?: "pending" | "paid" | "cancelled" | "failed" | "refunded";
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      ai_credit_packages: {
        Row: {
          created_at: string;
          credits: number;
          currency: string;
          description: string | null;
          id: string;
          is_active: boolean;
          is_featured: boolean;
          metadata: Json;
          name: string;
          price_cents: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          credits: number;
          currency?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          metadata?: Json;
          name: string;
          price_cents: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          credits?: number;
          currency?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          metadata?: Json;
          name?: string;
          price_cents?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_usage_events: {
        Row: {
          id: string;
          org_id: string;
          user_id: string | null;
          feature: string;
          model: string | null;
          input_tokens: number | null;
          output_tokens: number | null;
          total_tokens: number | null;
          estimated_cost: number | null;
          credits_charged: number;
          status: "success" | "failed" | "refunded";
          error_message: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id?: string | null;
          feature: string;
          model?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          total_tokens?: number | null;
          estimated_cost?: number | null;
          credits_charged: number;
          status: "success" | "failed" | "refunded";
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string | null;
          feature?: string;
          model?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          total_tokens?: number | null;
          estimated_cost?: number | null;
          credits_charged?: number;
          status?: "success" | "failed" | "refunded";
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      openai_connections: {
        Row: {
          id: string;
          organization_id: string;
          connected_by_profile_id: string | null;
          provider: IntegrationProvider;
          status: IntegrationConnectionStatus;
          api_key_ciphertext: string | null;
          api_key_reference: string | null;
          key_preview: string | null;
          key_last_four: string | null;
          connected_at: string | null;
          last_validated_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          connected_by_profile_id?: string | null;
          provider?: IntegrationProvider;
          status?: IntegrationConnectionStatus;
          api_key_ciphertext?: string | null;
          api_key_reference?: string | null;
          key_preview?: string | null;
          key_last_four?: string | null;
          connected_at?: string | null;
          last_validated_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          connected_by_profile_id?: string | null;
          provider?: IntegrationProvider;
          status?: IntegrationConnectionStatus;
          api_key_ciphertext?: string | null;
          api_key_reference?: string | null;
          key_preview?: string | null;
          key_last_four?: string | null;
          connected_at?: string | null;
          last_validated_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integration_sync_logs: {
        Row: {
          id: string;
          organization_id: string;
          provider: IntegrationProvider;
          connection_id: string | null;
          asset_type: string;
          status: IntegrationSyncStatus;
          title: string;
          message: string;
          details: Json;
          created_by_profile_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          provider: IntegrationProvider;
          connection_id?: string | null;
          asset_type: string;
          status?: IntegrationSyncStatus;
          title: string;
          message: string;
          details?: Json;
          created_by_profile_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          provider?: IntegrationProvider;
          connection_id?: string | null;
          asset_type?: string;
          status?: IntegrationSyncStatus;
          title?: string;
          message?: string;
          details?: Json;
          created_by_profile_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      lead_webhook_integrations: {
        Row: {
          id: string;
          organization_id: string;
          label: string | null;
          token_hash: string;
          last_used_at: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          label?: string | null;
          token_hash: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          label?: string | null;
          token_hash?: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_webhook_events: {
        Row: {
          id: string;
          organization_id: string | null;
          integration_id: string | null;
          lead_id: string | null;
          status: LeadWebhookEventStatus;
          http_status: number;
          raw_payload: Json;
          safe_headers: Json;
          error_message: string | null;
          received_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          integration_id?: string | null;
          lead_id?: string | null;
          status: LeadWebhookEventStatus;
          http_status: number;
          raw_payload?: Json;
          safe_headers?: Json;
          error_message?: string | null;
          received_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          integration_id?: string | null;
          lead_id?: string | null;
          status?: LeadWebhookEventStatus;
          http_status?: number;
          raw_payload?: Json;
          safe_headers?: Json;
          error_message?: string | null;
          received_at?: string;
          created_at?: string;
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
          role: ProfileRole;
          is_platform_admin: boolean;
          profile_setup_completed: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          organization_id: string;
          full_name?: string | null;
          email: string;
          role?: ProfileRole;
          is_platform_admin?: boolean;
          profile_setup_completed?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          organization_id?: string;
          full_name?: string | null;
          email?: string;
          role?: ProfileRole;
          is_platform_admin?: boolean;
          profile_setup_completed?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceMemberRole;
          status: WorkspaceMemberStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceMemberRole;
          status?: WorkspaceMemberStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceMemberRole;
          status?: WorkspaceMemberStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          token: string;
          workspace_id: string;
          created_by_user_id: string;
          team_id: string | null;
          role_to_assign: "admin" | "seller";
          status: InviteStatus;
          requires_approval: boolean;
          approval_status: InviteApprovalStatus;
          approved_by_user_id: string | null;
          invited_email: string | null;
          used_by_user_id: string | null;
          used_at: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          workspace_id: string;
          created_by_user_id: string;
          team_id?: string | null;
          role_to_assign?: "admin" | "seller";
          status?: InviteStatus;
          requires_approval?: boolean;
          approval_status?: InviteApprovalStatus;
          approved_by_user_id?: string | null;
          invited_email?: string | null;
          used_by_user_id?: string | null;
          used_at?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          workspace_id?: string;
          created_by_user_id?: string;
          team_id?: string | null;
          role_to_assign?: "admin" | "seller";
          status?: InviteStatus;
          requires_approval?: boolean;
          approval_status?: InviteApprovalStatus;
          approved_by_user_id?: string | null;
          invited_email?: string | null;
          used_by_user_id?: string | null;
          used_at?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          owner_profile_id: string | null;
          team_id: string | null;
          name: string;
          phone: string | null;
          phone_e164: string | null;
          email: string | null;
          city: string | null;
          company_name: string | null;
          lives_count: number | null;
          stage: LeadStage;
          source: LeadSource;
          budget: string | null;
          interest: string | null;
          last_interaction: string | null;
          notes: string | null;
          loss_reason: string | null;
          quality: string | null;
          cpf: string | null;
          birth_date: string | null;
          profession: string | null;
          health_plan_type: string | null;
          current_health_plan: string | null;
          dependents_count: number | null;
          source_campaign: string | null;
          source_adset: string | null;
          source_ad: string | null;
          meta_lead_id: string | null;
          meta_form_id: string | null;
          meta_page_id: string | null;
          meta_campaign_id: string | null;
          meta_adset_id: string | null;
          meta_ad_id: string | null;
          meta_connected_account_id: string | null;
          import_batch_id: string | null;
          archived_at: string | null;
          archive_reason: string | null;
          duplicate_of_lead_id: string | null;
          raw_payload: Json;
          received_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          owner_profile_id?: string | null;
          team_id?: string | null;
          name: string;
          phone?: string | null;
          phone_e164?: string | null;
          email?: string | null;
          city?: string | null;
          company_name?: string | null;
          lives_count?: number | null;
          stage?: LeadStage;
          source?: LeadSource;
          budget?: string | null;
          interest?: string | null;
          last_interaction?: string | null;
          notes?: string | null;
          loss_reason?: string | null;
          quality?: string | null;
          cpf?: string | null;
          birth_date?: string | null;
          profession?: string | null;
          health_plan_type?: string | null;
          current_health_plan?: string | null;
          dependents_count?: number | null;
          source_campaign?: string | null;
          source_adset?: string | null;
          source_ad?: string | null;
          meta_lead_id?: string | null;
          meta_form_id?: string | null;
          meta_page_id?: string | null;
          meta_campaign_id?: string | null;
          meta_adset_id?: string | null;
          meta_ad_id?: string | null;
          meta_connected_account_id?: string | null;
          import_batch_id?: string | null;
          archived_at?: string | null;
          archive_reason?: string | null;
          duplicate_of_lead_id?: string | null;
          raw_payload?: Json;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          owner_profile_id?: string | null;
          team_id?: string | null;
          name?: string;
          phone?: string | null;
          phone_e164?: string | null;
          email?: string | null;
          city?: string | null;
          company_name?: string | null;
          lives_count?: number | null;
          stage?: LeadStage;
          source?: LeadSource;
          budget?: string | null;
          interest?: string | null;
          last_interaction?: string | null;
          notes?: string | null;
          loss_reason?: string | null;
          quality?: string | null;
          cpf?: string | null;
          birth_date?: string | null;
          profession?: string | null;
          health_plan_type?: string | null;
          current_health_plan?: string | null;
          dependents_count?: number | null;
          source_campaign?: string | null;
          source_adset?: string | null;
          source_ad?: string | null;
          meta_lead_id?: string | null;
          meta_form_id?: string | null;
          meta_page_id?: string | null;
          meta_campaign_id?: string | null;
          meta_adset_id?: string | null;
          meta_ad_id?: string | null;
          meta_connected_account_id?: string | null;
          import_batch_id?: string | null;
          archived_at?: string | null;
          archive_reason?: string | null;
          duplicate_of_lead_id?: string | null;
          raw_payload?: Json;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_comments: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          author_profile_id: string;
          author_name: string;
          author_email: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          author_profile_id: string;
          author_name: string;
          author_email: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          author_profile_id?: string;
          author_name?: string;
          author_email?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_stage_history: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          changed_by_profile_id: string | null;
          old_stage: string | null;
          new_stage: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          changed_by_profile_id?: string | null;
          old_stage?: string | null;
          new_stage: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          changed_by_profile_id?: string | null;
          old_stage?: string | null;
          new_stage?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_stage_history_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_stage_history_changed_by_profile_id_fkey";
            columns: ["changed_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      lead_tasks: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          created_by_profile_id: string;
          assigned_to_profile_id: string | null;
          title: string;
          description: string | null;
          status: LeadTaskStatus;
          priority: LeadTaskPriority;
          due_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          created_by_profile_id: string;
          assigned_to_profile_id?: string | null;
          title: string;
          description?: string | null;
          status?: LeadTaskStatus;
          priority?: LeadTaskPriority;
          due_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          created_by_profile_id?: string;
          assigned_to_profile_id?: string | null;
          title?: string;
          description?: string | null;
          status?: LeadTaskStatus;
          priority?: LeadTaskPriority;
          due_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          status: PlanStatus;
          gateway: BillingGateway;
          gateway_plan_id: string | null;
          amount_cents: number;
          currency: string;
          interval_unit: BillingIntervalUnit;
          interval_count: number;
          trial_period_days: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          status?: PlanStatus;
          gateway?: BillingGateway;
          gateway_plan_id?: string | null;
          amount_cents?: number;
          currency?: string;
          interval_unit?: BillingIntervalUnit;
          interval_count?: number;
          trial_period_days?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          status?: PlanStatus;
          gateway?: BillingGateway;
          gateway_plan_id?: string | null;
          amount_cents?: number;
          currency?: string;
          interval_unit?: BillingIntervalUnit;
          interval_count?: number;
          trial_period_days?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          gateway: Exclude<BillingGateway, "internal">;
          external_id: string | null;
          customer_external_id: string | null;
          checkout_external_id: string | null;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          ended_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan_id: string;
          status?: SubscriptionStatus;
          gateway: Exclude<BillingGateway, "internal">;
          external_id?: string | null;
          customer_external_id?: string | null;
          checkout_external_id?: string | null;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          ended_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan_id?: string;
          status?: SubscriptionStatus;
          gateway?: Exclude<BillingGateway, "internal">;
          external_id?: string | null;
          customer_external_id?: string | null;
          checkout_external_id?: string | null;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          ended_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          id: string;
          organization_id: string;
          subscription_id: string | null;
          plan_id: string | null;
          gateway: Exclude<BillingGateway, "internal">;
          event_type: string;
          status: PaymentEventStatus;
          external_id: string | null;
          invoice_external_id: string | null;
          amount_cents: number | null;
          currency: string;
          occurred_at: string;
          payload: Json;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          subscription_id?: string | null;
          plan_id?: string | null;
          gateway: Exclude<BillingGateway, "internal">;
          event_type: string;
          status: PaymentEventStatus;
          external_id?: string | null;
          invoice_external_id?: string | null;
          amount_cents?: number | null;
          currency?: string;
          occurred_at?: string;
          payload?: Json;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          subscription_id?: string | null;
          plan_id?: string | null;
          gateway?: Exclude<BillingGateway, "internal">;
          event_type?: string;
          status?: PaymentEventStatus;
          external_id?: string | null;
          invoice_external_id?: string | null;
          amount_cents?: number | null;
          currency?: string;
          occurred_at?: string;
          payload?: Json;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      onboarding_states: {
        Row: {
          organization_id: string;
          completed_steps: string[];
          dismissed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          completed_steps?: string[];
          dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          completed_steps?: string[];
          dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "onboarding_states_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      allocate_credit_wallet_balance: {
        Args: {
          p_organization_id: string;
          p_from_wallet_id: string;
          p_to_wallet_id: string;
          p_amount: number;
          p_reason: string;
          p_actor_id: string;
          p_target_user_id?: string | null;
          p_metadata?: Json | null;
        };
        Returns: {
          from_wallet_balance: number;
          to_wallet_balance: number;
          transaction_id: string;
        }[];
      };
      accept_workspace_invite: {
        Args: { invite_token: string };
        Returns: {
          workspace_id: string;
          role: WorkspaceMemberRole;
        }[];
      };
      complete_profile_setup: {
        Args: { setup_mode: "solo" | "team" };
        Returns: {
          role: WorkspaceMemberRole;
          organization_id: string;
          redirect_path: string;
        }[];
      };
      create_workspace_invite: {
        Args: {
          requested_role_to_assign?: "admin" | "seller";
          target_email?: string | null;
        };
        Returns: {
          id: string;
          token: string;
          invite_url_path: string;
          expires_at: string;
          role_to_assign: "admin" | "seller";
          requires_approval: boolean;
          approval_status: InviteApprovalStatus;
          status: InviteStatus;
        }[];
      };
      update_workspace_member_role: {
        Args: { target_profile_id: string; next_role: "admin" | "seller" };
        Returns: {
          workspace_id: string;
          user_id: string;
          role: WorkspaceMemberRole;
        }[];
      };
      remove_workspace_member: {
        Args: { target_profile_id: string };
        Returns: {
          workspace_id: string;
          user_id: string;
          role: WorkspaceMemberRole;
        }[];
      };
      create_lead_webhook_integration: {
        Args: { target_organization_id: string; integration_label?: string | null };
        Returns: {
          id: string;
          organization_id: string;
          label: string | null;
          token: string;
          created_at: string;
        }[];
      };
      apply_ai_credit_change: {
        Args: {
          target_org_id: string;
          amount: number;
          p_type: string;
          p_user_id?: string | null;
          p_description?: string | null;
          p_metadata?: Json | null;
        };
        Returns: {
          new_balance: number;
          ledger_id: string;
        }[];
      };
      add_ai_credits: {
        Args: {
          amount: number;
          p_metadata?: Json | null;
          p_reason?: string | null;
          p_reference_id?: string | null;
          p_reference_type?: string | null;
          p_type?: string;
          p_user_id?: string | null;
          target_org_id: string;
        };
        Returns: {
          new_balance: number;
          ledger_id: string;
        }[];
      };
      consume_ai_credits: {
        Args: {
          amount: number;
          p_metadata?: Json | null;
          p_reason?: string | null;
          p_reference_id?: string | null;
          p_reference_type?: string | null;
          p_user_id?: string | null;
          target_org_id: string;
        };
        Returns: {
          new_balance: number;
          ledger_id: string;
        }[];
      };
      current_profile_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_profile_organization_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: ProfileRole;
      };
      finalize_ai_credit_order_payment: {
        Args: {
          p_metadata?: Json | null;
          p_paid_at?: string | null;
          p_provider_payment_id: string;
          p_provider_preference_id?: string | null;
          target_order_id: string;
        };
        Returns: {
          already_processed: boolean;
          ledger_id: string;
          new_balance: number;
          order_status: string;
        }[];
      };
      update_workspace_name: {
        Args: { workspace_name: string };
        Returns: undefined;
      };
      update_brokerage_name: {
        Args: { brokerage_name: string };
        Returns: undefined;
      };
      undo_csv_import_batch: {
        Args: { batch_id: string };
        Returns: number;
      };
    };
    Enums: {
      lead_source: LeadSource;
      lead_stage: LeadStage;
      lead_task_status: LeadTaskStatus;
      lead_task_priority: LeadTaskPriority;
    };
    CompositeTypes: Record<string, never>;
  };
};

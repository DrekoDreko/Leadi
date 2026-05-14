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
export type MetaConnectionStatus = "active" | "inactive" | "error" | "revoked";
export type LeadWebhookEventStatus = "processed" | "failed";
export type LeadStage = "new" | "qualification" | "proposal" | "negotiation" | "won" | "lost";
export type PlanStatus = "active" | "inactive" | "archived";
export type BillingProviderGateway = "asaas" | "mercado_pago" | "stripe";
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

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          organization_id: string;
          created_by_profile_id: string;
          status: CampaignStatus;
          connected_account_id: string | null;
          meta_page_id: string | null;
          meta_ad_account_id: string | null;
          meta_lead_form_id: string | null;
          publish_mode: CampaignPublishMode;
          publication_status: CampaignPublicationStatus;
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
          status?: CampaignStatus;
          connected_account_id?: string | null;
          meta_page_id?: string | null;
          meta_ad_account_id?: string | null;
          meta_lead_form_id?: string | null;
          publish_mode?: CampaignPublishMode;
          publication_status?: CampaignPublicationStatus;
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
          status?: CampaignStatus;
          connected_account_id?: string | null;
          meta_page_id?: string | null;
          meta_ad_account_id?: string | null;
          meta_lead_form_id?: string | null;
          publish_mode?: CampaignPublishMode;
          publication_status?: CampaignPublicationStatus;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: WorkspaceType;
          owner_profile_id?: string | null;
          slug?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: WorkspaceType;
          owner_profile_id?: string | null;
          slug?: string | null;
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
          id: string;
          org_id: string;
          user_id: string | null;
          type: "purchase" | "monthly_grant" | "usage" | "refund" | "adjustment";
          credits: number;
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id?: string | null;
          type: "purchase" | "monthly_grant" | "usage" | "refund" | "adjustment";
          credits: number;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string | null;
          type?: "purchase" | "monthly_grant" | "usage" | "refund" | "adjustment";
          credits?: number;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
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
          role_to_assign: "admin" | "seller";
          status: InviteStatus;
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
          role_to_assign?: "admin" | "seller";
          status?: InviteStatus;
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
          role_to_assign?: "admin" | "seller";
          status?: InviteStatus;
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
          meta_connected_account_id?: string | null;
          import_batch_id?: string | null;
          archived_at?: string | null;
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
          meta_connected_account_id?: string | null;
          import_batch_id?: string | null;
          archived_at?: string | null;
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
        Args: { requested_role_to_assign?: "admin" | "seller" };
        Returns: {
          token: string;
          invite_url_path: string;
          expires_at: string;
          role_to_assign: "admin" | "seller";
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
    };
    CompositeTypes: Record<string, never>;
  };
};

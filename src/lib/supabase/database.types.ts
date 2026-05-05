export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CampaignStatus = "generated" | "archived";
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
export type LeadWebhookEventStatus = "processed" | "failed";
export type LeadStage = "new" | "qualification" | "proposal" | "negotiation" | "won" | "lost";
export type WhatsAppStage = LeadStage;
export type ProfileRole = "owner" | "admin" | "seller" | "supervisor";
export type WorkspaceType = "solo" | "team";
export type WorkspaceMemberRole = "seller" | "supervisor";
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
          role_to_assign: "seller";
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
          role_to_assign?: "seller";
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
          role_to_assign?: "seller";
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
          import_batch_id: string | null;
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
          import_batch_id?: string | null;
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
          import_batch_id?: string | null;
          raw_payload?: Json;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
        Args: { setup_mode: "solo" | "supervisor" };
        Returns: {
          role: WorkspaceMemberRole;
          organization_id: string;
          redirect_path: string;
        }[];
      };
      create_workspace_invite: {
        Args: Record<PropertyKey, never>;
        Returns: {
          token: string;
          invite_url_path: string;
          expires_at: string;
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

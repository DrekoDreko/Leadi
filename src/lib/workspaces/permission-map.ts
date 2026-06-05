export type Permission =
  | "view_billing"
  | "buy_credits"
  | "request_credits"
  | "approve_purchases"
  | "view_team_credits"
  | "view_own_credits"
  | "view_all_leads"
  | "view_team_leads"
  | "view_own_leads"
  | "import_leads"
  | "export_leads"
  | "delete_archive_leads"
  | "distribute_leads"
  | "edit_own_lead"
  | "move_lead_stage"
  | "create_ad"
  | "approve_ad"
  | "publish_ad"
  | "view_running_ads"
  | "configure_meta_ads"
  | "invite_supervisor"
  | "invite_consultant"
  | "approve_consultant"
  | "remove_deactivate_user"
  | "view_org_reports"
  | "view_team_reports"
  | "use_ai_messages"
  | "use_ai_images"
  | "edit_company_profile";

export type WorkspaceRole = "owner" | "admin" | "seller";

export const PERMISSION_MAP: Record<Permission, WorkspaceRole[]> = {
  view_billing: ["owner"],
  buy_credits: ["owner"],
  request_credits: ["admin"],
  approve_purchases: ["owner"],
  view_team_credits: ["owner", "admin"],
  view_own_credits: ["owner", "admin", "seller"],
  view_all_leads: ["owner"],
  view_team_leads: ["owner", "admin"],
  view_own_leads: ["owner", "admin", "seller"],
  import_leads: ["owner", "admin"],
  export_leads: ["owner"],
  delete_archive_leads: ["owner"],
  distribute_leads: ["owner", "admin"],
  edit_own_lead: ["owner", "admin", "seller"],
  move_lead_stage: ["owner", "admin", "seller"],
  create_ad: ["owner", "admin"],
  approve_ad: ["owner"],
  publish_ad: ["owner"],
  view_running_ads: ["owner", "admin"],
  configure_meta_ads: ["owner"],
  invite_supervisor: ["owner"],
  invite_consultant: ["owner", "admin"],
  approve_consultant: ["owner"],
  remove_deactivate_user: ["owner", "admin"],
  view_org_reports: ["owner"],
  view_team_reports: ["owner", "admin"],
  use_ai_messages: ["owner", "admin", "seller"],
  use_ai_images: ["owner", "admin", "seller"],
  edit_company_profile: ["owner"],
};

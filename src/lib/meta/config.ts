import { getServerEnv } from "@/lib/env/server";

const DEFAULT_META_GRAPH_API_VERSION = "v22.0";
const DEFAULT_META_OAUTH_SCOPES = [
  "business_management",
  "leads_retrieval",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "ads_read",
  "ads_management"
] as const;

export function getMetaVerifyToken() {
  return getServerEnv("META_VERIFY_TOKEN");
}

export function getMetaAppId() {
  return getServerEnv("META_APP_ID");
}

export function getMetaAppSecret() {
  return getServerEnv("META_APP_SECRET");
}

export function getMetaRedirectUri() {
  const configuredRedirect = getServerEnv("META_REDIRECT_URI");
  if (configuredRedirect) {
    return configuredRedirect;
  }

  const appUrl = getServerEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
  return new URL("/api/integrations/meta/callback", appUrl).toString();
}

export function getMetaGraphApiVersion() {
  return getServerEnv("META_GRAPH_API_VERSION") || DEFAULT_META_GRAPH_API_VERSION;
}

export function getMetaOAuthScopes() {
  return [...DEFAULT_META_OAUTH_SCOPES];
}

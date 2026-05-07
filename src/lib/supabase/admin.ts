import { createClient } from "@supabase/supabase-js";
import { getServerEnv, isIntegrationConfigured, requireIntegrationEnv } from "@/lib/env/server";
import type { Database } from "./database.types";
import { getSupabaseConfig } from "./config";

export function hasSupabaseServiceRole() {
  return isIntegrationConfigured("supabase_admin");
}

export function createSupabaseAdminClient() {
  const { url } = getSupabaseConfig();
  requireIntegrationEnv("supabase_admin");
  const serviceRoleKey = getServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

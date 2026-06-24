import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type BillingAuthContext = {
  organizationId: string;
  profileId: string;
  displayName: string;
  brokerageName: string;
  email: string;
  role: "owner" | "admin" | "seller";
  adCreationEnabled: boolean;
};

export async function requireBillingAuthContext(): Promise<BillingAuthContext> {
  const context = await getBillingAuthContext();

  if (!context) {
    redirect("/login?next=/dashboard/perfil/creditos");
  }

  return context;
}

export async function getBillingAuthContext(): Promise<BillingAuthContext | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,organization_id,full_name,email,role,ad_creation_enabled")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  const displayName = profile.full_name ?? profile.email.split("@")[0] ?? "Usuario";
  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.organization_id)
    .single();

  return {
    organizationId: profile.organization_id,
    profileId: profile.id,
    displayName,
    brokerageName: getBrokerageName(organization?.name, displayName),
    email: profile.email,
    role: (profile.role as "owner" | "admin" | "seller") || "owner",
    adCreationEnabled: Boolean(profile.ad_creation_enabled)
  };
}

function getBrokerageName(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

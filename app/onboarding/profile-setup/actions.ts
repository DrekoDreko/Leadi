"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function completeProfileSetupAction(formData: FormData) {
  const setupMode = formData.get("setupMode") === "team" ? "team" : "solo";

  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .rpc("complete_profile_setup", { setup_mode: setupMode })
    .single();

  if (error || !data) {
    const errorCode = getSetupErrorCode(error);

    redirect(`/onboarding/profile-setup?error=${errorCode}`);
  }

  redirect(data.redirect_path);
}

function getSetupErrorCode(error: { code?: string; message?: string } | null) {
  if (
    error?.code === "PGRST202" ||
    error?.code === "42703" ||
    error?.message?.includes("complete_profile_setup") ||
    error?.message?.includes("profile_setup_completed") ||
    error?.message?.includes("organizations.type")
  ) {
    return "setup-schema-missing";
  }

  return "setup-failed";
}

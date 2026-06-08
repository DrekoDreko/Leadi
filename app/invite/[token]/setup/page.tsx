import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InviteSetupClient } from "./invite-setup-client";

type SetupPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InviteSetupPage({ params }: SetupPageProps) {
  const { token } = await params;

  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/invite/${encodeURIComponent(token)}&mode=signup`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profile?.full_name) {
    redirect("/dashboard");
  }

  const role = profile?.role ?? "seller";

  return <InviteSetupClient role={role} token={token} />;
}

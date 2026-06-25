"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updatePasswordAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/redefinir-senha?error=supabase-not-configured");
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8 || password.length > 200) {
    redirect("/redefinir-senha?error=weak-password");
  }

  if (password !== confirmPassword) {
    redirect("/redefinir-senha?error=password-mismatch");
  }

  const supabase = await createSupabaseServerClient();

  // Exige a sessao de recuperacao criada pelo link do e-mail.
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/redefinir-senha?error=reset-link-invalid");
  }

  const { error } = await supabase.auth
    .updateUser({ password })
    .catch(() => ({ error: { message: "auth-unavailable" } }));

  if (error) {
    const message = (error.message ?? "").toLowerCase();
    const code = message.includes("password") || message.includes("pwned")
      ? "weak-password"
      : "reset-update-failed";

    redirect(`/redefinir-senha?error=${code}`);
  }

  // Encerra a sessao de recuperacao e obriga login com a nova senha.
  await supabase.auth.signOut().catch(() => undefined);

  redirect("/login?notice=password-updated");
}

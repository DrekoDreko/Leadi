"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateBrokerageNameAction(formData: FormData) {
  const brokerageName = String(formData.get("brokerageName") ?? "").trim();

  if (!brokerageName) {
    redirect("/dashboard/perfil?brokerage=missing");
  }

  if (!isSupabaseConfigured()) {
    redirect("/dashboard/perfil?brokerage=updated");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_brokerage_name", {
    brokerage_name: brokerageName
  });

  if (error) {
    redirect(`/dashboard/perfil?brokerage=${getBrokerageErrorCode(error)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/whatsapp");
  revalidatePath("/dashboard/campanhas");

  redirect("/dashboard/perfil?brokerage=updated");
}

function getBrokerageErrorCode(error: { code?: string; message?: string } | null) {
  if (
    error?.code === "PGRST202" ||
    error?.message?.includes("update_brokerage_name") ||
    error?.message?.includes("brokerage_name")
  ) {
    return "schema-missing";
  }

  if (error?.message?.includes("permissao") || error?.message?.includes("permissão")) {
    return "permission";
  }

  return "failed";
}

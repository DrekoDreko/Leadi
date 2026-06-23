"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { normalizeWorkspaceRole } from "@/lib/workspaces/permissions";
import { getSafeExtensionForMime } from "@/lib/uploads/validation";

type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const brokerageSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da corretora.").max(160),
  phone: z.string().trim().max(40).nullable(),
  address_city: z.string().trim().max(120).nullable(),
  address_state: z.string().trim().max(60).nullable()
});

async function getOwnerProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("auth_user_id", user.id)
    .single();

  return profile ? { supabase, profile } : null;
}

export async function saveBrokerageAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/onboarding/equipe/corretora?done=1");
  }

  const auth = await getOwnerProfile();
  if (!auth) redirect("/login");

  if (normalizeWorkspaceRole(auth.profile.role) !== "owner") {
    redirect("/dashboard");
  }

  const parsed = brokerageSchema.safeParse({
    name: formData.get("name"),
    phone: (formData.get("phone") as string | null) || null,
    address_city: (formData.get("address_city") as string | null) || null,
    address_state: (formData.get("address_state") as string | null) || null
  });

  if (!parsed.success) {
    redirect("/onboarding/equipe/corretora?error=invalid");
  }

  const update: OrganizationUpdate = {
    name: parsed.data.name,
    phone: parsed.data.phone,
    address_city: parsed.data.address_city,
    address_state: parsed.data.address_state
  };

  // Upload opcional de logo (mesmo padrao do perfil da empresa).
  const file = formData.get("logo") as File | null;
  if (file && file.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      redirect("/onboarding/equipe/corretora?error=logo-type");
    }
    if (file.size > MAX_IMAGE_SIZE) {
      redirect("/onboarding/equipe/corretora?error=logo-size");
    }

    const ext = getSafeExtensionForMime(file.type);
    const storagePath = `${auth.profile.organization_id}/logo.${ext}`;

    const { error: uploadError } = await auth.supabase.storage
      .from("organization-logos")
      .upload(storagePath, file, { upsert: true, contentType: file.type });

    if (!uploadError) {
      const { data: publicUrlData } = auth.supabase.storage
        .from("organization-logos")
        .getPublicUrl(storagePath);
      update.logo_url = `${publicUrlData.publicUrl}?v=${Date.now()}`;
    }
  }

  const { error } = await auth.supabase
    .from("organizations")
    .update(update)
    .eq("id", auth.profile.organization_id);

  if (error) {
    console.error("[onboarding/equipe/corretora] update organizations falhou:", error);
    redirect("/onboarding/equipe/corretora?error=failed");
  }

  redirect("/onboarding/equipe/corretora?done=1");
}

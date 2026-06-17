"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeWorkspaceRole } from "@/lib/workspaces/permissions";
import { getSafeExtensionForMime } from "@/lib/uploads/validation";

const organizationProfileSchema = z.object({
  email: z.string().email("E-mail invalido.").max(160).nullable(),
  phone: z.string().max(40).nullable(),
  website: z.string().max(200).nullable(),
  cnpj: z.string().max(20).nullable(),
  description: z.string().max(2000).nullable(),
  instagram: z.string().max(200).nullable(),
  linkedin: z.string().max(200).nullable(),
  address_cep: z.string().max(20).nullable(),
  address_street: z.string().max(200).nullable(),
  address_number: z.string().max(20).nullable(),
  address_complement: z.string().max(200).nullable(),
  address_neighborhood: z.string().max(120).nullable(),
  address_city: z.string().max(120).nullable(),
  address_state: z.string().max(60).nullable()
});

const REVALIDATE_PATHS = [
  "/dashboard",
  "/dashboard/perfil",
  "/dashboard/perfil/empresa",
];

function revalidateAll() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

async function getAuthenticatedProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("auth_user_id", user.id)
    .single();

  return profile ? { supabase, user, profile } : null;
}

export async function updateOrganizationProfileAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard/perfil/empresa?feedback=demo");
  }

  const auth = await getAuthenticatedProfile();
  if (!auth) redirect("/login");

  const role = normalizeWorkspaceRole(auth.profile.role);
  if (role !== "owner") {
    redirect("/dashboard/perfil/empresa?feedback=permission");
  }

  const fields = {
    email: formData.get("email") as string | null,
    phone: formData.get("phone") as string | null,
    website: formData.get("website") as string | null,
    cnpj: formData.get("cnpj") as string | null,
    description: formData.get("description") as string | null,
    instagram: formData.get("instagram") as string | null,
    linkedin: formData.get("linkedin") as string | null,
    address_cep: formData.get("address_cep") as string | null,
    address_street: formData.get("address_street") as string | null,
    address_number: formData.get("address_number") as string | null,
    address_complement: formData.get("address_complement") as string | null,
    address_neighborhood: formData.get("address_neighborhood") as string | null,
    address_city: formData.get("address_city") as string | null,
    address_state: formData.get("address_state") as string | null,
  };

  const trimmed = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      const v = typeof value === "string" ? value.trim() : null;
      return [key, v || null];
    })
  ) as typeof fields;

  const parsed = organizationProfileSchema.safeParse(trimmed);
  if (!parsed.success) {
    redirect("/dashboard/perfil/empresa?feedback=invalid");
  }

  const { error } = await auth.supabase
    .from("organizations")
    .update(parsed.data)
    .eq("id", auth.profile.organization_id);

  if (error) {
    redirect("/dashboard/perfil/empresa?feedback=failed");
  }

  revalidateAll();
  redirect("/dashboard/perfil/empresa?feedback=updated");
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export async function uploadOrganizationLogoAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard/perfil/empresa?feedback=demo");
  }

  const auth = await getAuthenticatedProfile();
  if (!auth) redirect("/login");

  const role = normalizeWorkspaceRole(auth.profile.role);
  if (role !== "owner") {
    redirect("/dashboard/perfil/empresa?feedback=permission");
  }

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) {
    redirect("/dashboard/perfil/empresa?feedback=no-file");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    redirect("/dashboard/perfil/empresa?feedback=invalid-type");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    redirect("/dashboard/perfil/empresa?feedback=too-large");
  }

  const ext = getSafeExtensionForMime(file.type);
  const storagePath = `${auth.profile.organization_id}/logo.${ext}`;

  const { error: uploadError } = await auth.supabase.storage
    .from("organization-logos")
    .upload(storagePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    redirect("/dashboard/perfil/empresa?feedback=upload-failed");
  }

  const { data: publicUrlData } = auth.supabase.storage
    .from("organization-logos")
    .getPublicUrl(storagePath);

  const logoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  await auth.supabase
    .from("organizations")
    .update({ logo_url: logoUrl })
    .eq("id", auth.profile.organization_id);

  revalidateAll();
  redirect("/dashboard/perfil/empresa?feedback=logo-updated");
}

export async function uploadProfileAvatarAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard/perfil?avatar=demo");
  }

  const auth = await getAuthenticatedProfile();
  if (!auth) redirect("/login");

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    redirect("/dashboard/perfil?avatar=no-file");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    redirect("/dashboard/perfil?avatar=invalid-type");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    redirect("/dashboard/perfil?avatar=too-large");
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const storagePath = `${auth.profile.id}/avatar.${ext}`;

  const { error: uploadError } = await auth.supabase.storage
    .from("profile-avatars")
    .upload(storagePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    redirect("/dashboard/perfil?avatar=upload-failed");
  }

  const { data: publicUrlData } = auth.supabase.storage
    .from("profile-avatars")
    .getPublicUrl(storagePath);

  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await auth.supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", auth.profile.id);

  if (updateError) {
    redirect("/dashboard/perfil?avatar=upload-failed");
  }

  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  redirect("/dashboard/perfil?avatar=updated");
}

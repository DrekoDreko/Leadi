/**
 * Importa a foto de perfil do Google para o nosso bucket de avatares.
 *
 * Comportamento: so preenche quando o profile ainda nao tem avatar_url
 * (nunca sobrescreve um upload manual do cliente). A imagem do Google e
 * copiada para o bucket `profile-avatars`, do mesmo jeito que o upload
 * manual, para nao depender do CDN do Google. Falhas nunca bloqueiam o
 * login: qualquer erro e silenciado.
 */
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { UPLOAD_ALLOWED_TYPES, getSafeExtensionForMime } from "@/lib/uploads/validation";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function importGoogleAvatarIfMissing(
  supabase: SupabaseServerClient
): Promise<void> {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const remoteUrl =
      typeof metadata.avatar_url === "string"
        ? metadata.avatar_url
        : typeof metadata.picture === "string"
          ? metadata.picture
          : null;
    if (!remoteUrl) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, avatar_url")
      .eq("auth_user_id", user.id)
      .single();

    // So preenche se vazio: nunca sobrescreve uma foto que o cliente ja tem.
    if (!profile || profile.avatar_url) return;

    const response = await fetch(remoteUrl);
    if (!response.ok) return;

    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    const allowed = UPLOAD_ALLOWED_TYPES.IMAGE as readonly string[];
    if (!allowed.includes(contentType)) return;

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_AVATAR_BYTES) return;

    const ext = getSafeExtensionForMime(contentType);
    const storagePath = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(storagePath, bytes, { upsert: true, contentType });
    if (uploadError) return;

    const { data: publicUrlData } = supabase.storage
      .from("profile-avatars")
      .getPublicUrl(storagePath);

    await supabase
      .from("profiles")
      .update({ avatar_url: `${publicUrlData.publicUrl}?v=${Date.now()}` })
      .eq("id", profile.id);
  } catch {
    // Importar o avatar e best-effort: nunca bloquear o login por falha aqui.
  }
}

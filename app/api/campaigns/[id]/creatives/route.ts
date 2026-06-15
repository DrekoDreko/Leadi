import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import {
  validateCreativeRequestAttachment,
  resolveCreativeRequestAttachmentMimeType,
  sanitizeCreativeRequestAttachmentName
} from "@/lib/creative-requests/attachments";
import { PayloadTooLargeError, validateFilePayloadSize } from "@/lib/payload-limits";
import { assertRouteRateLimit, assertSameOrigin } from "@/lib/api/route-security";

const BUCKET = "campaign-creatives";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params;
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-campaign-creatives",
      suffix: campaignId,
      limit: 20,
      windowMs: 60 * 1000
    });

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sessao expirada." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Perfil nao encontrado." }, { status: 403 });
    }

    const campaignClient = hasSupabaseServiceRole()
      ? createSupabaseAdminClient()
      : supabase;

    const { data: campaign } = await campaignClient
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });
    }

    validateFilePayloadSize(file, "ATTACHMENT");

    const validationError = validateCreativeRequestAttachment(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const mimeType = resolveCreativeRequestAttachmentMimeType(file) || file.type;
    const safeName = sanitizeCreativeRequestAttachmentName(file.name);
    const fileId = crypto.randomUUID();
    const storagePath = `${profile.organization_id}/${campaignId}/${fileId}-${safeName}`;
    const fileBuffer = await file.arrayBuffer();

    const storageClient = hasSupabaseServiceRole()
      ? createSupabaseAdminClient()
      : supabase;

    const { error: uploadError } = await storageClient.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        cacheControl: "3600",
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Nao foi possivel salvar o criativo. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        creative: {
          id: fileId,
          name: file.name,
          path: storagePath,
          mimeType,
          sizeBytes: file.size
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: "Arquivo excede o limite permitido." }, { status: 413 });
    }

    const message = error instanceof Error ? error.message : "Erro ao enviar criativo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sessao expirada." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Perfil nao encontrado." }, { status: 403 });
    }

    const storageClient = hasSupabaseServiceRole()
      ? createSupabaseAdminClient()
      : supabase;

    const folder = `${profile.organization_id}/${campaignId}`;
    const { data: files } = await storageClient.storage
      .from(BUCKET)
      .list(folder, { limit: 50 });

    if (!files || files.length === 0) {
      return NextResponse.json({ creatives: [] });
    }

    const creatives = await Promise.all(
      files
        .filter((file) => file.name && !file.name.startsWith("."))
        .map(async (file) => {
          const path = `${folder}/${file.name}`;
          const { data: urlData } = await storageClient.storage
            .from(BUCKET)
            .createSignedUrl(path, 3600);

          return {
            name: file.name.replace(/^[a-f0-9-]+-/, ""),
            path,
            url: urlData?.signedUrl ?? null,
            mimeType: file.metadata?.mimetype ?? null
          };
        })
    );

    return NextResponse.json({
      creatives: creatives.filter((c) => c.url)
    });
  } catch {
    return NextResponse.json({ creatives: [] });
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteCampaignForCurrentUser } from "@/lib/campaigns/repository.server";

const campaignIdSchema = z.string().uuid();

export async function deleteCampaignAction(campaignId: string): Promise<{ error?: string }> {
  const parsed = campaignIdSchema.safeParse(campaignId);
  if (!parsed.success) {
    return { error: "Campanha invalida." };
  }

  try {
    await deleteCampaignForCurrentUser(parsed.data);
    revalidatePath("/dashboard/anuncios");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao excluir campanha." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { deleteCampaignForCurrentUser } from "@/lib/campaigns/repository.server";

export async function deleteCampaignAction(campaignId: string): Promise<{ error?: string }> {
  try {
    await deleteCampaignForCurrentUser(campaignId);
    revalidatePath("/dashboard/anuncios");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao excluir campanha." };
  }
}

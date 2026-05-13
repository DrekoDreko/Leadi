import "server-only";
import { getLeadsCountForCurrentUser } from "@/lib/leads/repository.server";
import { getCampaignsCountForCurrentUser } from "@/lib/campaigns/repository.server";
import { getWhatsAppMessagesCountForCurrentUser } from "@/lib/whatsapp/repository.server";
import { getCreativeRequestsCountForCurrentUser } from "@/lib/creative-requests/repository.server";

export type ActivationSignals = {
  leadsCount: number;
  campaignsCount: number;
  messagesCount: number;
  ordersCount: number;
};

/**
 * Calcula sinais de ativacao baseados em dados reais do banco de dados.
 * Ativacao: lead criado, campanha gerada, mensagem salva e pedido (creative request) enviado.
 */
export async function getActivationSignalsForCurrentUser(): Promise<ActivationSignals> {
  const [leadsCount, campaignsCount, messagesCount, ordersCount] = await Promise.all([
    getLeadsCountForCurrentUser(),
    getCampaignsCountForCurrentUser(),
    getWhatsAppMessagesCountForCurrentUser(),
    getCreativeRequestsCountForCurrentUser()
  ]);

  return {
    leadsCount,
    campaignsCount,
    messagesCount,
    ordersCount
  };
}

export type ActivationStatus = {
  isActivated: boolean;
  progress: number;
  signals: ActivationSignals;
};

export async function getActivationStatusForCurrentUser(): Promise<ActivationStatus> {
  const signals = await getActivationSignalsForCurrentUser();
  const steps = [
    signals.leadsCount > 0,
    signals.campaignsCount > 0,
    signals.messagesCount > 0,
    signals.ordersCount > 0
  ];
  
  const completed = steps.filter(Boolean).length;
  const total = steps.length;

  return {
    isActivated: completed === total,
    progress: Math.round((completed / total) * 100),
    signals
  };
}

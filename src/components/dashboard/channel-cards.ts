import type { AiCreditBalance, AiUsageThisPeriodSummary } from "@/lib/ai/credits";
import type { WhatsAppDeliveryStatusSummary } from "@/lib/whatsapp/repository.server";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type ChannelCard = {
  label: string;
  value: string;
  note: string;
  tone: "blue" | "yellow" | "teal" | "dark";
};

export function formatDayMonth(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function buildChannelCards({
  aiBalance,
  aiBalanceDetails,
  aiUsage,
  whatsappDelivery,
  whatsappMessagesCount
}: {
  aiBalance: number;
  aiBalanceDetails: AiCreditBalance | null;
  aiUsage: AiUsageThisPeriodSummary;
  whatsappDelivery: WhatsAppDeliveryStatusSummary;
  whatsappMessagesCount: number;
}): ChannelCard[] {
  const totalMessages = whatsappDelivery.total || whatsappMessagesCount;
  const balanceValue = aiBalanceDetails?.availableCredits ?? aiBalance;
  const includedCredits = aiBalanceDetails?.includedCredits ?? 0;
  const purchasedCredits = aiBalanceDetails?.purchasedCredits ?? 0;
  const renewLabel = formatDayMonth(aiUsage.periodEnd);

  return [
    {
      label: "Mensagens WhatsApp",
      value: String(totalMessages),
      note:
        totalMessages > 0
          ? `${whatsappDelivery.sent} enviadas`
          : "nenhuma mensagem gerada",
      tone: "blue"
    },
    {
      label: "Envios com falha",
      value: String(whatsappDelivery.failed),
      note: whatsappDelivery.failed > 0 ? "precisam reenvio" : "nenhuma falha de envio",
      tone: "yellow"
    },
    {
      label: "Saldo de IA",
      value: balanceValue.toLocaleString("pt-BR"),
      note:
        aiBalanceDetails && (includedCredits > 0 || purchasedCredits > 0)
          ? `${includedCredits.toLocaleString("pt-BR")} inclusos • ${purchasedCredits.toLocaleString("pt-BR")} comprados`
          : balanceValue > 0
            ? "créditos de IA disponíveis"
            : "seu saldo de IA acabou",
      tone: "teal"
    },
    {
      label: "Créditos usados no ciclo",
      value: aiUsage.usedCredits.toLocaleString("pt-BR"),
      note: renewLabel ? `renova em ${renewLabel}` : "consumo do período atual",
      tone: "dark"
    }
  ];
}

export function getPreviewWhatsAppDeliverySummary(): WhatsAppDeliveryStatusSummary {
  return { total: 42, sent: 38, failed: 3 };
}

export function getPreviewAiBalanceDetails(): AiCreditBalance {
  return {
    orgId: "preview",
    availableCredits: 48,
    includedCredits: 30,
    purchasedCredits: 18,
    currentPeriodStart: null,
    currentPeriodEnd: new Date(Date.now() + 12 * DAY_IN_MS).toISOString(),
    createdAt: null,
    updatedAt: null
  };
}

export function getPreviewAiUsageSummary(): AiUsageThisPeriodSummary {
  return {
    usedCredits: 52,
    periodEnd: new Date(Date.now() + 12 * DAY_IN_MS).toISOString()
  };
}

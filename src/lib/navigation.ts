import {
  Coins,
  Import,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound
} from "lucide-react";
import type { DashboardNavVariant } from "@/lib/workspaces/context";

export function getDashboardNavItems(variant: DashboardNavVariant) {
  if (variant === "supervisor-team") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Leads da Equipe", href: "/dashboard/leads", icon: UsersRound },
      { label: "Campanhas", href: "/dashboard/campanhas", icon: Sparkles },
      { label: "Mensagens WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },
      { label: "Créditos", href: "/dashboard/creditos", icon: Coins },
      { label: "Compliance", href: "/dashboard/compliance", icon: ShieldCheck },
      { label: "Importar Leads", href: "/dashboard/importar", icon: Import },
      { label: "Equipe", href: "/team/setup", icon: UserPlus }
    ];
  }

  if (variant === "seller-team") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Meus Leads", href: "/dashboard/leads", icon: UsersRound },
      { label: "Campanhas IA", href: "/dashboard/campanhas", icon: Sparkles },
      { label: "Mensagens WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },
      { label: "Créditos", href: "/dashboard/creditos", icon: Coins },
      { label: "Compliance", href: "/dashboard/compliance", icon: ShieldCheck },
    ];
  }

  return [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Leads", href: "/dashboard/leads", icon: UsersRound },
    { label: "Campanhas IA", href: "/dashboard/campanhas", icon: Sparkles },
    { label: "Mensagens WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },
    { label: "Créditos", href: "/dashboard/creditos", icon: Coins },
    { label: "Compliance", href: "/dashboard/compliance", icon: ShieldCheck },
    { label: "Importar Leads", href: "/dashboard/importar", icon: Import },
    { label: "Criar Equipe", href: "/dashboard/criar-equipe", icon: UserPlus }
  ];
}

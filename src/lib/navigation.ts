import {
  Import,
  LayoutDashboard,
  UserPlus,
  UsersRound
} from "lucide-react";
import type { DashboardNavVariant } from "@/lib/workspaces/context";

export function getDashboardNavItems(variant: DashboardNavVariant) {
  if (variant === "owner-team") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Leads da Equipe", href: "/dashboard/leads", icon: UsersRound },
      { label: "Importar Leads", href: "/dashboard/importar", icon: Import },
      { label: "Equipe", href: "/team/setup", icon: UserPlus }
    ];
  }

  if (variant === "seller-team") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Meus Leads", href: "/dashboard/leads", icon: UsersRound },
    ];
  }

  return [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Leads", href: "/dashboard/leads", icon: UsersRound },
    { label: "Importar Leads", href: "/dashboard/importar", icon: Import },
    { label: "Criar Equipe", href: "/dashboard/criar-equipe", icon: UserPlus }
  ];
}

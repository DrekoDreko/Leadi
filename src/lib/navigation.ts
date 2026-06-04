import {
  BarChart,
  Calculator,
  Coins,
  Filter,
  Import,
  LayoutDashboard,
  Megaphone,
  Settings,
  Share2,
  UserPlus,
  UsersRound
} from "lucide-react";
import type { DashboardNavVariant } from "@/lib/workspaces/context";

export function getDashboardNavItems(variant: DashboardNavVariant) {
  if (variant === "owner-team") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Leads", href: "/dashboard/leads", icon: UsersRound },
      { label: "Equipes", href: "/team/setup", icon: UserPlus },
      { label: "Campanhas", href: "/dashboard/campanhas/aprovacoes", icon: Megaphone },
      { label: "Créditos", href: "/dashboard/perfil/creditos", icon: Coins },
      { label: "Relatórios", href: "/dashboard/relatorios", icon: BarChart },
      { label: "Simulador", href: "/dashboard/simulador", icon: Calculator }
    ];
  }

  if (variant === "supervisor-team") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Leads da Equipe", href: "/dashboard/leads", icon: UsersRound },
      { label: "Distribuir Leads", href: "/dashboard/leads/distribuir", icon: Share2 },
      { label: "Campanhas", href: "/dashboard/campanhas/aprovacoes", icon: Megaphone },
      { label: "Créditos da Equipe", href: "/dashboard/perfil/creditos", icon: Coins },
      { label: "Simulador", href: "/dashboard/simulador", icon: Calculator }
    ];
  }

  if (variant === "consultant-team") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Meus Leads", href: "/dashboard/leads", icon: UsersRound },
      { label: "Funil de Vendas", href: "/dashboard/funil", icon: Filter },
      { label: "Créditos", href: "/dashboard/perfil/creditos", icon: Coins },
      { label: "Simulador", href: "/dashboard/simulador", icon: Calculator }
    ];
  }

  return [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Leads", href: "/dashboard/leads", icon: UsersRound },
    { label: "Importar Leads", href: "/dashboard/importar", icon: Import },
    { label: "Criar Equipe", href: "/dashboard/criar-equipe", icon: UserPlus },
    { label: "Créditos", href: "/dashboard/perfil/creditos", icon: Coins },
    { label: "Simulador", href: "/dashboard/simulador", icon: Calculator }
  ];
}

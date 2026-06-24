import {
  BarChart,
  Calculator,
  Coins,
  Filter,
  Import,
  LayoutDashboard,
  Megaphone,
  Network,
  UserPlus,
  UsersRound
} from "lucide-react";
import type { DashboardNavVariant } from "@/lib/workspaces/context";

export function getDashboardNavItems(variant: DashboardNavVariant, canCreateAd = false) {
  if (variant === "owner-team") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Leads", href: "/dashboard/leads", icon: UsersRound },
      { label: "Equipes", href: "/dashboard/equipes", icon: Network },
      { label: "Campanhas", href: "/dashboard/desempenho", icon: Megaphone },
      { label: "Créditos", href: "/dashboard/perfil/creditos", icon: Coins },
      { label: "Relatórios", href: "/dashboard/relatorios", icon: BarChart },
      { label: "Simulador", href: "/dashboard/simulador", icon: Calculator }
    ];
  }

  if (variant === "supervisor-team") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Leads da Equipe", href: "/dashboard/leads", icon: UsersRound },
      { label: "Créditos da Equipe", href: "/dashboard/perfil/creditos", icon: Coins },
      { label: "Simulador", href: "/dashboard/simulador", icon: Calculator }
    ];
  }

  if (variant === "consultant-team") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Meus Leads", href: "/dashboard/leads", icon: UsersRound },
      { label: "Funil de Vendas", href: "/dashboard/funil", icon: Filter },
      // Consultor liberado pelo owner cria anúncios com IA na própria conta Meta.
      ...(canCreateAd
        ? [{ label: "Criar Anúncio", href: "/dashboard/criacoes", icon: Megaphone }]
        : []),
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

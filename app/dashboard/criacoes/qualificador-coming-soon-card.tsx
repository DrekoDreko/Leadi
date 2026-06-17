"use client";

import { BarChart3, MessageSquareText, Target } from "lucide-react";
import { ComingSoonCard } from "@/components/dashboard/coming-soon-card";

/**
 * Card "em breve" do Qualificador de Leads. Mantém os ícones (componentes do
 * lucide-react, que são funções) dentro de um Client Component — funções não
 * podem ser passadas como props de um Server Component para um Client Component.
 */
export function QualificadorComingSoonCard() {
  return (
    <ComingSoonCard
      title="Qualificador de Leads com IA"
      description="Triagem automatica do lead (cidade, vidas, interesse) com pontuacao e proxima acao sugerida."
      icon={Target}
      modal={{
        title: "Qualificador de Leads com IA",
        icon: Target,
        description: (
          <>
            Estamos validando o interesse nesta funcionalidade antes do lancamento
            oficial. Sua participacao e fundamental!
          </>
        ),
        features: [
          {
            icon: Target,
            title: "Triagem automatica",
            description:
              "A IA le as respostas do formulario e pontua o lead por cidade, numero de vidas e interesse."
          },
          {
            icon: MessageSquareText,
            title: "Primeira mensagem pronta",
            description:
              "Recebe uma mensagem de WhatsApp de qualificacao ja escrita e dentro das regras de compliance."
          },
          {
            icon: BarChart3,
            title: "Proxima acao sugerida",
            description:
              "O lead volta para o funil com score, o que falta qualificar e a recomendacao de follow-up."
          }
        ]
      }}
    />
  );
}

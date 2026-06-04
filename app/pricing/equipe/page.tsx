import Link from "next/link";
import { ArrowLeft, Shield, Users, Zap, LayoutDashboard, Target, MessageSquare, Check, X, CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TeamPlanHero } from "@/components/landing/team-plan-hero";

const benefits = [
  {
    icon: Target,
    title: "Controle de leads",
    description: "Veja quem está atendendo cada lead, em qual etapa está e onde existem gargalos."
  },
  {
    icon: Users,
    title: "Distribuição inteligente",
    description: "Distribua oportunidades entre consultores sem perder histórico ou duplicar atendimento."
  },
  {
    icon: LayoutDashboard,
    title: "Supervisão de performance",
    description: "Acompanhe conversão, produtividade e evolução da equipe em um painel central."
  },
  {
    icon: MessageSquare,
    title: "IA em toda a equipe",
    description: "Consultores usam IA para criar mensagens, ideias de anúncios e materiais de venda."
  },
  {
    icon: Shield,
    title: "Aprovação de anúncios",
    description: "Supervisores podem criar campanhas, mas a publicação passa pela validação do Gestor."
  },
  {
    icon: Zap,
    title: "Créditos centralizados",
    description: "Compre créditos para a equipe e distribua conforme a necessidade de cada operação."
  }
];

const roles = [
  {
    name: "Gestor",
    description: "Dono da corretora. Tem acesso total, faz pagamentos, compra e distribui créditos, aprova campanhas e vê os indicadores da operação inteira.",
    highlight: true,
  },
  {
    name: "Supervisor",
    description: "Gerencia consultores. Distribui leads, acompanha performance, cria campanhas para aprovação e pode solicitar créditos ao Gestor.",
    highlight: false,
  },
  {
    name: "Consultor",
    description: "Atende leads e registra conversas. Usa IA conforme créditos liberados e acompanha seu próprio funil. Não acessa pagamentos nem dados estratégicos.",
    highlight: false,
  }
];

const comparison = [
  {
    title: "Plano Solo",
    description: "Ideal para quem trabalha sozinho.",
    features: [
      { text: "Controle individual de leads", included: true },
      { text: "Créditos próprios", included: true },
      { text: "Sem hierarquia", included: false },
      { text: "Sem aprovação de campanhas", included: false },
      { text: "Sem distribuição por equipe", included: false },
    ]
  },
  {
    title: "Plano Equipe",
    description: "Feito para corretoras com operação comercial.",
    highlight: true,
    features: [
      { text: "Gestor, supervisor e consultor", included: true },
      { text: "Distribuição de leads", included: true },
      { text: "Créditos centralizados", included: true },
      { text: "Aprovação de anúncios", included: true },
      { text: "Relatórios por responsável e funis compartilhados", included: true },
    ]
  }
];

export default function PricingEquipePage() {
  return (
    <main className="min-h-screen bg-background pb-12">
      <div className="fixed top-0 w-full z-50">
        <div className="mx-auto max-w-7xl px-4 pt-4 md:px-8">
          <header className="glass flex items-center justify-between rounded-full border border-black/10 bg-white/80 px-4 py-3 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-black/40">
            <BrandMark />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" asChild className="rounded-full gap-2 px-4 hover:bg-black/5 dark:hover:bg-white/10">
                <Link href="/pricing">
                  <ArrowLeft size={16} aria-hidden="true" />
                  Voltar
                </Link>
              </Button>
            </div>
          </header>
        </div>
      </div>

      <TeamPlanHero
        badge="Leadi para Equipes"
        title={
          <>
            Organize sua corretora <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#B4A9D6] bg-clip-text text-transparent drop-shadow-sm dark:from-[#8B5CF6] dark:to-[#B4A9D6]">
              e escale suas vendas
            </span>
          </>
        }
        subtitle="Distribua leads, acompanhe consultores, aprove anúncios e centralize créditos em uma operação comercial mais organizada."
        actions={
          <>
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full bg-[#8B5CF6] px-8 text-base font-semibold !text-white shadow-lg transition-all hover:scale-105 hover:bg-[#7c3aed] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
            >
              <Link href="/login?mode=signup&next=%2Fcheckout%3Fplan%3Dequipe%26cycle%3Dmonthly" className="!text-white">
                Começar com Plano Equipe
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 rounded-full border-black/10 bg-white/50 px-8 text-base font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <a href="#recursos">Ver recursos do plano</a>
            </Button>
          </>
        }
      />

      {/* Benefits */}
      <section id="recursos" className="relative z-10 py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Tudo que sua operação precisa
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-lg text-muted-foreground">
              Tenha o controle total da sua corretora com ferramentas criadas para organizar e escalar o seu time comercial.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="group relative rounded-3xl border border-black/5 bg-white/40 p-8 shadow-sm backdrop-blur-md transition-all hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="mb-6 inline-flex rounded-2xl bg-[#8B5CF6]/10 p-4 text-[#8B5CF6] transition-transform group-hover:scale-110 dark:bg-[#8B5CF6]/20">
                    <Icon size={24} />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="relative z-10 py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Papéis claros, permissões seguras
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-lg text-muted-foreground">
              Três níveis de acesso para garantir que cada um veja apenas o que precisa.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {roles.map((role) => (
              <div 
                key={role.name} 
                className={cn(
                  "relative flex transition-all duration-300",
                  role.highlight && "md:scale-105 z-10"
                )}
              >
                {role.highlight && (
                  <div className="absolute -inset-1 rounded-[32px] bg-[#8B5CF6]/40 blur-2xl animate-pulse" />
                )}
                <Card
                  className={cn(
                    "relative w-full overflow-hidden rounded-[32px] transition-all duration-300",
                    role.highlight
                      ? "border-[#8B5CF6]/50 bg-white dark:bg-[linear-gradient(180deg,rgba(18,23,33,0.98),rgba(25,35,55,0.96))]"
                      : "border-black/5 bg-white/60 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                  )}
                >
                  <CardHeader className="p-8 pb-4">
                    <h3
                      className={cn(
                        "text-2xl font-bold",
                        role.highlight ? "text-[#8B5CF6]" : "text-foreground"
                      )}
                    >
                      {role.name}
                    </h3>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <p
                      className={cn(
                        "leading-relaxed",
                        role.highlight ? "text-foreground/90 dark:text-white/80" : "text-muted-foreground"
                      )}
                    >
                      {role.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="relative z-10 py-20 md:py-32">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Por que sair do Plano Solo?
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-lg text-muted-foreground">
              Veja a diferença entre gerenciar leads por conta própria e ter uma operação comercial colaborativa e escalável.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {comparison.map((plan) => (
              <div
                key={plan.title}
                className={cn(
                  "rounded-[32px] border p-8 sm:p-10",
                  plan.highlight
                    ? "border-transparent bg-[#1C172B] shadow-2xl"
                    : "border-black/10 bg-white dark:border-white/10 dark:bg-white/5"
                )}
              >
                <h3 className={cn("text-2xl font-bold", plan.highlight ? "text-white" : "text-foreground")}>{plan.title}</h3>
                <p className={cn("mt-2", plan.highlight ? "text-[#B4A9D6]" : "text-muted-foreground")}>{plan.description}</p>
                <div className="mt-8 space-y-5">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        plan.highlight ? (
                          <CheckCircle2 className="mt-0.5 shrink-0 text-[#8B5CF6]" size={20} />
                        ) : (
                          <Check className="mt-0.5 shrink-0 text-emerald-500" size={20} />
                        )
                      ) : (
                        <X className="mt-0.5 shrink-0 text-muted-foreground/50" size={20} />
                      )}
                      <span
                        className={cn(
                          "text-base font-medium",
                          feature.included
                            ? plan.highlight ? "text-white/90" : "text-foreground"
                            : plan.highlight ? "text-white/50" : "text-muted-foreground"
                        )}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 pb-20 pt-10 md:pb-32">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <div className="rounded-[40px] border border-black/5 bg-gradient-to-b from-white to-slate-50 p-10 text-center shadow-2xl dark:border-white/10 dark:from-white/10 dark:to-white/5 md:p-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Pronto para estruturar sua equipe comercial?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Saia das planilhas, reduza retrabalho e centralize leads, créditos, campanhas e performance em um só lugar.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center">
              <Button
                asChild
                size="lg"
                className="h-14 rounded-full bg-[#8B5CF6] px-10 text-lg font-bold !text-white transition-all hover:scale-105 hover:bg-[#7c3aed] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
              >
                <Link href="/login?mode=signup&next=%2Fcheckout%3Fplan%3Dequipe%26cycle%3Dmonthly" className="!text-white">
                  Começar com Plano Equipe
                </Link>
              </Button>
              <p className="mt-6 text-sm text-muted-foreground">
                Você pode começar com até 3 usuários e adicionar novos consultores conforme sua operação crescer.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Footer Card */}
      <footer className="relative z-10 pb-8 pt-4">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-[32px] border border-black/5 bg-white/40 p-8 text-sm text-muted-foreground backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-4">
              <span>&copy; {new Date().getFullYear()} Leadi. Todos os direitos reservados.</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
              <Link href="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

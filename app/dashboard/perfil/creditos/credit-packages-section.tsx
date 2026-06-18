"use client";

import { useRouter } from "next/navigation";
import { useState, startTransition } from "react";
import { ArrowRight, Coins, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type AiCreditPackageSlug,
  buildAiCreditsCheckoutPath,
  formatAiCreditPackagePrice,
  getAiCreditPackagePresentation,
  type AiCreditPackageDefinition
} from "@/lib/ai/credit-packages";
import { buildPlanCheckoutPath } from "@/lib/billing/checkout-flow";
import { cn } from "@/lib/utils";
import { RequestCreditsModal } from "./request-credits-modal";

type CreditPackagesSectionProps = {
  packages: Array<
    AiCreditPackageDefinition & {
      id: string | null;
    }
  >;
  canPurchase: boolean;
  disabledMessage?: string | null;
  isOwner: boolean;
};

export function CreditPackagesSection({
  packages,
  canPurchase,
  disabledMessage,
  isOwner
}: CreditPackagesSectionProps) {
  const router = useRouter();
  const [loadingSlug, setLoadingSlug] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleCheckout(slug: string) {
    setErrorMessage("");
    setLoadingSlug(slug);

    const targetPath = canPurchase
      ? buildAiCreditsCheckoutPath(slug as AiCreditPackageSlug)
      : buildPlanCheckoutPath("profissional");

    startTransition(() => {
      try {
        router.push(targetPath);
      } catch {
        setLoadingSlug("");
        setErrorMessage(
          canPurchase
            ? "Não foi possível abrir o pagamento agora. Tente novamente em instantes."
            : "Não foi possível abrir a assinatura agora. Tente novamente em instantes."
        );
      }
    });
  }
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState<number>(100);

  function handleAction(slug: string, credits: number) {
    if (isOwner) {
      handleCheckout(slug);
    } else {
      setSelectedCredits(credits);
      setIsModalOpen(true);
    }
  }

  const referencePackage = getReferencePackage(packages);

  return (
    <section className="glass-strong rounded-[34px] p-5 md:p-6" id="ai-credit-packages">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cobalt">Pacotes de créditos</p>
          <h2 className="mt-2 text-2xl font-semibold">Compre só a quantidade que precisa</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/64">
            Os pacotes avulsos servem como saldo adicional quando os créditos inclusos do plano
            terminarem. Quanto maior o volume, menor o valor por crédito.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-cobalt/14 bg-cobalt/8 px-3 py-2 text-sm font-semibold text-cobalt">
          <Coins size={16} aria-hidden="true" />
          Compra avulsa
        </span>
      </div>

      {isOwner && canPurchase ? (
        <div className="mt-5 rounded-[24px] border border-white/44 bg-white/38 p-4 text-sm leading-6 text-ink/72 dark:bg-white/5 dark:text-cloud/78">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-cobalt" size={18} aria-hidden="true" />
            <p>
              Os créditos extras entram automaticamente no saldo da organização após a confirmação
              do pagamento.
            </p>
          </div>
        </div>
      ) : null}

      {isOwner && disabledMessage ? (
        <div className="mt-3 rounded-[24px] border border-signal/28 bg-signal/12 p-4 text-sm leading-6 text-ink dark:text-cloud">
          {disabledMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-3 rounded-[24px] border border-red-200/70 bg-red-50/80 p-4 text-sm leading-6 text-red-800">
          {errorMessage}
        </div>
      ) : null}

      {packages.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard
              canPurchase={isOwner ? canPurchase : true}
              isLoading={loadingSlug === pkg.slug}
              isOwner={isOwner}
              key={pkg.slug}
              onAction={() => handleAction(pkg.slug, pkg.credits)}
              pkg={pkg}
              referencePackage={referencePackage}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-border bg-white/28 p-4 text-sm leading-6 text-ink/64">
          Nenhum pacote de créditos está disponível agora. Recarregue a página em instantes.
        </div>
      )}
      
      <RequestCreditsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultCredits={selectedCredits}
      />
    </section>
  );
}

function PackageCard({
  pkg,
  canPurchase,
  isLoading,
  isOwner,
  onAction,
  referencePackage
}: {
  pkg: AiCreditPackageDefinition & { id: string | null };
  canPurchase: boolean;
  isLoading: boolean;
  isOwner: boolean;
  onAction: () => void;
  referencePackage: AiCreditPackageDefinition & { id: string | null } | null;
}) {
  const presentation = getAiCreditPackagePresentation(pkg);
  const packageNoteId = `${pkg.slug}-purchase-note`;
  const savingsLabel = getSavingsLabel(pkg, referencePackage);

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[30px] p-5 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(18,34,61,0.12)] motion-reduce:hover:translate-y-0",
        pkg.featured ? "border-cobalt/24 bg-cobalt/[0.08] shadow-soft" : "surface-card-strong"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              {presentation.badge ? (
                <span className="inline-flex rounded-full bg-cobalt px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                  {presentation.badge}
                </span>
              ) : null}
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink/42">Pacote</p>
              <h3 className="mt-2 text-2xl font-semibold text-ink dark:text-cloud">{presentation.name}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/64 dark:text-cloud/74">{presentation.description}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
              <p className="text-4xl font-semibold tracking-tight text-ink dark:text-cloud md:text-[2.6rem]">
                {formatAiCreditPackagePrice(pkg.priceCents)}
              </p>
              <span className="pb-1 text-base font-medium text-ink/54 dark:text-cloud/62">à vista</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/72 px-3 py-1.5 text-xs font-semibold text-ink/72 dark:bg-white/12 dark:text-cloud/78">
                {presentation.costPerCreditLabel}
              </span>
              {savingsLabel ? (
                <span className="rounded-full bg-cobalt/10 px-3 py-1.5 text-xs font-semibold text-cobalt">
                  {savingsLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <p
          className="mt-6 text-sm leading-6 text-ink/68 dark:text-cloud/72"
          id={packageNoteId}
        >
          {!isOwner
            ? "Solicite estes créditos ao gestor para sua equipe."
            : canPurchase
              ? presentation.purchaseNote
              : "Disponível para compra após ativar a assinatura da organização."}
        </p>

        <Button
          aria-busy={isLoading}
          aria-describedby={packageNoteId}
          className={cn("mt-5 w-full py-4 text-sm", pkg.featured && !isLoading ? "bg-cobalt text-white hover:bg-cobalt/92" : "")}
          disabled={isLoading || (!isOwner ? false : !canPurchase)}
          onClick={onAction}
          type="button"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <ArrowRight size={18} aria-hidden="true" />
          )}
          {isLoading
            ? (isOwner ? "Abrindo pagamento..." : "Abrindo solicitação...")
            : !isOwner
              ? "Solicitar créditos ao gestor"
              : canPurchase
                ? `Comprar ${pkg.credits} créditos`
                : "Ativar assinatura"}
        </Button>
      </div>
    </Card>
  );
}

function getReferencePackage(
  packages: Array<AiCreditPackageDefinition & { id: string | null }>
) {
  if (packages.length === 0) {
    return null;
  }

  return packages.reduce((selected, current) =>
    current.credits < selected.credits ? current : selected
  );
}

function getSavingsLabel(
  pkg: AiCreditPackageDefinition,
  referencePackage: AiCreditPackageDefinition | null
) {
  if (!referencePackage || referencePackage.slug === pkg.slug) {
    return null;
  }

  const referenceUnitCost = referencePackage.priceCents / referencePackage.credits;
  const packageUnitCost = pkg.priceCents / pkg.credits;

  if (!Number.isFinite(referenceUnitCost) || !Number.isFinite(packageUnitCost) || packageUnitCost >= referenceUnitCost) {
    return null;
  }

  const savingsPercent = Math.round((1 - packageUnitCost / referenceUnitCost) * 100);

  return `${savingsPercent}% mais econômico por crédito`;
}

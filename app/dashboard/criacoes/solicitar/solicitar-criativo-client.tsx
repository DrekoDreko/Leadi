"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  RefreshCcw,
  Sparkles,
  Upload,
  Wand2,
  X
} from "lucide-react";
import { InfiniteGridHero } from "@/components/ui/the-infinite-grid";
import { AI_CREDIT_COSTS } from "@/lib/ai/credit-costs";
import { validateCreativeRequestAttachment } from "@/lib/creative-requests/attachments";
import { AD_IMAGE_STYLE_PRESETS } from "@/lib/creatives/ad-image-presets";
import { OPERATORS, getOperator } from "@/lib/creatives/operator-config";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";

const IMAGE_COST = AI_CREDIT_COSTS.generate_ad_image_set;
const MAX_REFERENCES = 4;
const REFERENCE_ACCEPT = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";

const contractTypeOptions = ["PME", "Familiar", "Individual", "Adesão"];

type FormState = {
  title: string;
  subtitle: string;
  briefing: string;
  carrier: string;
  contractType: string;
  discount: string;
  offer: string;
  phone: string;
  brandName: string;
  style: string;
  stylePreset: string;
};

const initialForm: FormState = {
  title: "",
  subtitle: "",
  briefing: "",
  carrier: "",
  contractType: "",
  discount: "",
  offer: "",
  phone: "",
  brandName: "",
  style: "",
  stylePreset: ""
};

type ReferenceFile = {
  id: string;
  file: File;
  previewUrl: string;
};

type GeneratedAssets = {
  feed: string;
  vertical: string;
};

export function SolicitarCriativoClient({ availableCredits }: { availableCredits: number }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [references, setReferences] = useState<ReferenceFile[]>([]);
  const [brokerLogo, setBrokerLogo] = useState<ReferenceFile | null>(null);
  const [useStyleReference, setUseStyleReference] = useState(false);
  const [credits, setCredits] = useState(availableCredits);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedAssets | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brokerLogoInputRef = useRef<HTMLInputElement>(null);

  const hasEnoughCredits = credits >= IMAGE_COST;
  const isOfertaPreset = form.stylePreset === "oferta-desconto";
  const selectedOperator = form.carrier ? getOperator(form.carrier) : undefined;

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectPreset(presetId: string) {
    setForm((current) => ({
      ...current,
      stylePreset: current.stylePreset === presetId ? "" : presetId
    }));
  }

  function handleBrokerLogoChange(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("O logo deve ser uma imagem (PNG, JPG ou WebP).");
      return;
    }

    if (brokerLogo) {
      URL.revokeObjectURL(brokerLogo.previewUrl);
    }

    setBrokerLogo({
      id: `broker-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file)
    });
  }

  function removeBrokerLogo() {
    if (brokerLogo) {
      URL.revokeObjectURL(brokerLogo.previewUrl);
      setBrokerLogo(null);
    }
  }

  function handleReferenceChange(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (incoming.length === 0) return;

    setReferences((current) => {
      const next = [...current];

      for (const file of incoming) {
        if (next.length >= MAX_REFERENCES) {
          setError(`Você pode anexar no máximo ${MAX_REFERENCES} referências.`);
          break;
        }

        const validationError = validateCreativeRequestAttachment({
          name: file.name,
          size: file.size,
          type: file.type
        });

        if (validationError) {
          setError(validationError);
          continue;
        }

        if (!file.type.startsWith("image/")) {
          setError("As referências para a IA devem ser imagens (PNG, JPG ou WebP).");
          continue;
        }

        next.push({
          id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
          file,
          previewUrl: URL.createObjectURL(file)
        });
      }

      return next;
    });
  }

  function removeReference(id: string) {
    setReferences((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.stylePreset) {
      setError("Selecione um padrão de arte antes de gerar.");
      return;
    }

    if (!form.title.trim() || !form.briefing.trim()) {
      setError("Informe pelo menos o título e o briefing da arte.");
      return;
    }

    if (!form.carrier) {
      setError("Selecione uma operadora.");
      return;
    }

    if (isOfertaPreset && !form.discount.trim()) {
      setError("O desconto em destaque é obrigatório para o estilo Oferta / Desconto.");
      return;
    }

    if (isOfertaPreset && !form.offer.trim()) {
      setError("A oferta / condição é obrigatória para o estilo Oferta / Desconto.");
      return;
    }

    if (!hasEnoughCredits) {
      setError(`Você precisa de ${IMAGE_COST} créditos de IA para gerar a arte.`);
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("subtitle", form.subtitle);
      formData.append("briefing", form.briefing);
      formData.append("carrier", form.carrier);
      formData.append("contractType", form.contractType);
      formData.append("discount", form.discount);
      formData.append("offer", form.offer);
      formData.append("phone", form.phone);
      formData.append("brandName", form.brandName);
      formData.append("style", form.style);
      formData.append("stylePreset", form.stylePreset);
      formData.append("useStyleReference", String(useStyleReference && Boolean(form.stylePreset)));

      if (brokerLogo) {
        formData.append("brokerLogo", brokerLogo.file, brokerLogo.file.name);
      }

      for (const reference of references) {
        formData.append("references", reference.file, reference.file.name);
      }

      const response = await fetch("/api/creatives/generate-image", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            assets?: {
              feed: { b64: string; mimeType: string };
              vertical: { b64: string; mimeType: string };
            };
            remainingCredits?: number;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.assets?.feed?.b64 || !payload.assets.vertical?.b64) {
        setError(payload?.error ?? "Não foi possível gerar as artes. Tente novamente.");
        return;
      }

      setResult({
        feed: `data:${payload.assets.feed.mimeType};base64,${payload.assets.feed.b64}`,
        vertical: `data:${payload.assets.vertical.mimeType};base64,${payload.assets.vertical.b64}`
      });

      if (typeof payload.remainingCredits === "number") {
        setCredits(payload.remainingCredits);
      }
    } catch (submitError) {
      setError(getFriendlyErrorMessage(submitError).message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <InfiniteGridHero
        eyebrow={
          <>
            <Sparkles size={14} aria-hidden="true" />
            Arte com IA
          </>
        }
        title="Gere sua arte de plano de saúde com IA"
        subtitle="Preencha o briefing, escolha a operadora e receba duas artes profissionais (Feed e Vertical) prontas para publicar."
      >
        <span className="text-muted-soft inline-flex items-center gap-2 rounded-full bg-surface-elevated px-4 py-2 text-sm font-medium ring-1 ring-border/70">
          <Wand2 size={16} aria-hidden="true" />
          {IMAGE_COST} créditos por geração · {credits} disponíveis
        </span>
      </InfiniteGridHero>

      {/* Seção 1 — Padrão de arte */}
      <section className="surface-card space-y-4 rounded-[34px] p-6">
        <div className="flex items-center gap-3">
          <span className="text-cobalt flex h-10 w-10 items-center justify-center rounded-[16px] bg-surface-elevated ring-1 ring-border/70">
            <LayoutTemplate size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Padrão de arte</h2>
            <p className="text-muted-soft text-sm leading-6">
              Escolha o estilo visual da arte. A IA seguirá este modelo como base.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AD_IMAGE_STYLE_PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              label={preset.label}
              description={preset.description}
              previewImage={preset.previewImage}
              selected={form.stylePreset === preset.id}
              onSelect={() => selectPreset(preset.id)}
            />
          ))}
        </div>

        {form.stylePreset ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-[20px] bg-surface-elevated/60 px-4 py-3 ring-1 ring-border/70">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-cobalt"
              checked={useStyleReference}
              onChange={(event) => setUseStyleReference(event.target.checked)}
            />
            <span className="text-sm leading-6">
              <span className="font-semibold text-foreground">
                Usar este padrão como referência visual
              </span>
              <span className="text-muted-soft block">
                A IA recebe a imagem do padrão como base, deixando o resultado mais fiel ao
                exemplo.
              </span>
            </span>
          </label>
        ) : null}
      </section>

      <form className="grid gap-4 lg:grid-cols-[1.4fr_1fr]" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Seção 2 — Sobre a arte */}
          <FieldGroup title="Sobre a arte" description="O que a peça precisa comunicar.">
            <TextField
              label="Título / Chamada principal"
              placeholder="Ex: Plano de saúde para sua empresa"
              value={form.title}
              onChange={(value) => updateField("title", value)}
              required
            />
            <TextField
              label="Subtítulo"
              placeholder="Ex: Cuidado completo para sua equipe"
              value={form.subtitle}
              onChange={(value) => updateField("subtitle", value)}
            />
            <TextAreaField
              label="Objetivo ou Briefing"
              placeholder={
                "Descreva o que a arte precisa comunicar.\n\nExemplos:\n• Rede de atendimento em São Paulo\n• Promoção para empresas da região\n• Plano com coparticipação para PME\n• Destaque para hospitais credenciados\n• Campanha Copa do Mundo 2026"
              }
              value={form.briefing}
              onChange={(value) => updateField("briefing", value)}
              required
            />
          </FieldGroup>

          {/* Seção 3 — Plano e oferta */}
          <FieldGroup title="Plano e oferta" description="Detalhes comerciais em destaque.">
            <div className="space-y-4">
              <div className="space-y-2">
                <SelectField
                  label="Operadora"
                  value={form.carrier}
                  onChange={(value) => updateField("carrier", value)}
                  required
                >
                  <option value="">Selecione a operadora</option>
                  {OPERATORS.map((op) => (
                    <option key={op.slug} value={op.slug}>
                      {op.name}
                    </option>
                  ))}
                  <option value="outra">Outra</option>
                </SelectField>

                {selectedOperator ? (
                  <div className="flex items-center gap-2 rounded-[16px] bg-surface-elevated/60 px-3 py-2 ring-1 ring-border/70">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: selectedOperator.primaryColor }}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {selectedOperator.name}
                    </span>
                    <span className="text-muted-soft text-xs">
                      — cor primária {selectedOperator.primaryColor}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Tipo de contratação"
                  value={form.contractType}
                  onChange={(value) => updateField("contractType", value)}
                >
                  <option value="">Selecione (opcional)</option>
                  {contractTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={`Desconto em destaque${isOfertaPreset ? "" : " (opcional)"}`}
                  placeholder="Ex: 40% ou R$ 810,73"
                  value={form.discount}
                  onChange={(value) => updateField("discount", value)}
                  required={isOfertaPreset}
                />
                <TextField
                  label={`Oferta / condição${isOfertaPreset ? "" : " (opcional)"}`}
                  placeholder="Ex: A partir de R$ 810,73 por pessoa"
                  value={form.offer}
                  onChange={(value) => updateField("offer", value)}
                  required={isOfertaPreset}
                />
              </div>

              {isOfertaPreset ? (
                <p className="text-muted-soft text-xs leading-5">
                  No estilo Oferta / Desconto, o desconto e a condição são obrigatórios para
                  gerar a arte.
                </p>
              ) : null}
            </div>
          </FieldGroup>

          {/* Seção 4 — Contato */}
          <FieldGroup
            title="Contato"
            description="Campos opcionais. Se não preenchidos, não aparecerão na arte."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="WhatsApp"
                placeholder="Ex: (11) 95424-1062"
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
              />
              <TextField
                label="Nome / Corretora"
                placeholder="Ex: MGA Vieira Planos de Saúde"
                value={form.brandName}
                onChange={(value) => updateField("brandName", value)}
              />
            </div>

            <div className="space-y-2">
              <span className="text-muted-soft text-sm font-semibold">
                Logo da corretora (opcional)
              </span>
              <input
                ref={brokerLogoInputRef}
                type="file"
                accept={REFERENCE_ACCEPT}
                className="hidden"
                onChange={handleBrokerLogoChange}
              />

              {brokerLogo ? (
                <div className="flex items-center gap-3 rounded-[20px] bg-surface-elevated/60 px-4 py-3 ring-1 ring-border/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brokerLogo.previewUrl}
                    alt="Logo da corretora"
                    className="h-12 w-12 rounded-[12px] object-contain ring-1 ring-border/70"
                  />
                  <span className="flex-1 truncate text-sm text-foreground">
                    {brokerLogo.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={removeBrokerLogo}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-elevated text-muted-foreground ring-1 ring-border/70 transition hover:bg-ink/10"
                    aria-label="Remover logo"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => brokerLogoInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-border/70 bg-surface-elevated/60 px-4 py-4 text-center transition hover:border-cobalt/40 hover:bg-surface-elevated"
                >
                  <Upload size={16} aria-hidden="true" className="text-cobalt" />
                  <span className="text-sm font-medium text-foreground">
                    Enviar logo da corretora
                  </span>
                </button>
              )}
            </div>
          </FieldGroup>

          {/* Seção 5 — Estilo visual */}
          <FieldGroup
            title="Estilo visual"
            description="Cada geração entrega duas artes: Feed (4:5) e Vertical (9:16) para Stories e Reels."
          >
            <div className="space-y-2">
              <TextField
                label="Estilo visual (observações)"
                placeholder="Ex: moderno, com elementos médicos, fundo azul"
                value={form.style}
                onChange={(value) => updateField("style", value)}
              />
              <p className="text-muted-soft text-xs leading-5">
                A cor principal é definida automaticamente pela operadora selecionada. Use
                este campo para observações adicionais sobre o visual.
              </p>
            </div>
          </FieldGroup>
        </div>

        <div className="space-y-4">
          {/* Seção 6 — Referências */}
          <FieldGroup
            title="Referências"
            description="Envie até 4 imagens de exemplo para a IA seguir o estilo."
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={REFERENCE_ACCEPT}
              multiple
              className="hidden"
              onChange={handleReferenceChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={references.length >= MAX_REFERENCES}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-border/70 bg-surface-elevated/60 px-4 py-8 text-center transition hover:border-cobalt/40 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-cobalt flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-border/70">
                <ImagePlus size={22} aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-foreground">
                Adicionar referências
              </span>
              <span className="text-muted-soft text-xs">
                PNG, JPG ou WebP · {references.length}/{MAX_REFERENCES}
              </span>
            </button>

            {references.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {references.map((reference) => (
                  <div
                    key={reference.id}
                    className="group relative overflow-hidden rounded-[20px] ring-1 ring-border/70"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reference.previewUrl}
                      alt={reference.file.name}
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeReference(reference.id)}
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white transition hover:bg-ink"
                      aria-label={`Remover ${reference.file.name}`}
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </FieldGroup>

          {/* Botão de gerar + resultado */}
          <div className="surface-card space-y-4 rounded-[34px] p-6">
            {error ? (
              <p className="surface-alert-danger flex items-start gap-2 rounded-[20px] px-4 py-3 text-sm">
                <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                {error}
              </p>
            ) : null}

            {!hasEnoughCredits ? (
              <p className="text-muted-soft text-sm">
                Você tem {credits} créditos. São necessários {IMAGE_COST} para gerar a arte.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isGenerating || !hasEnoughCredits}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} aria-hidden="true" className="animate-spin" />
                  Gerando arte...
                </>
              ) : (
                <>
                  <Sparkles size={18} aria-hidden="true" />
                  Gerar arte com IA
                </>
              )}
            </button>
          </div>

          {result ? (
            <div className="surface-card space-y-4 rounded-[34px] p-6">
              <div>
                <h3 className="text-lg font-semibold">Artes geradas</h3>
                <p className="text-muted-soft text-sm leading-6">
                  Cada formato já sai otimizado para os posicionamentos da Meta, com as zonas
                  de segurança respeitadas.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <GeneratedAssetCard
                  title="Feed (Facebook/Instagram)"
                  hint="4:5 · 1080×1350"
                  dataUrl={result.feed}
                  downloadName="arte-leadi-feed.png"
                />
                <GeneratedAssetCard
                  title="Stories e Reels"
                  hint="9:16 · 1080×1920"
                  dataUrl={result.vertical}
                  downloadName="arte-leadi-vertical.png"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || !hasEnoughCredits}
                className="text-foreground inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface-elevated px-5 py-3 text-sm font-semibold ring-1 ring-border/70 transition hover:bg-surface-elevated/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw size={17} aria-hidden="true" />
                Gerar novamente
              </button>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function GeneratedAssetCard({
  title,
  hint,
  dataUrl,
  downloadName
}: {
  title: string;
  hint: string;
  dataUrl: string;
  downloadName: string;
}) {
  return (
    <div className="space-y-3 rounded-[24px] bg-surface-elevated/40 p-4 ring-1 ring-border/70">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="text-muted-soft text-xs">{hint}</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={`Arte ${title}`}
        className="mx-auto max-h-[420px] w-auto rounded-[18px] ring-1 ring-border/70"
      />
      <a
        href={dataUrl}
        download={downloadName}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/90"
      >
        <Download size={17} aria-hidden="true" />
        Baixar
      </a>
    </div>
  );
}

function PresetCard({
  label,
  description,
  previewImage,
  selected,
  onSelect
}: {
  label: string;
  description: string;
  previewImage?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const showPreview = Boolean(previewImage) && !previewFailed;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col overflow-hidden rounded-[24px] text-left ring-1 transition ${
        selected
          ? "ring-2 ring-cobalt"
          : "ring-border/70 hover:ring-cobalt/40"
      }`}
    >
      <div className="relative aspect-[4/3] w-full bg-surface-elevated">
        {showPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewImage}
            alt={label}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <span className="text-muted-foreground flex h-full w-full items-center justify-center">
            <LayoutTemplate size={28} aria-hidden="true" />
          </span>
        )}
        {selected ? (
          <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-cobalt text-white shadow-soft">
            <Check size={15} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-4">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-muted-soft text-xs leading-5">{description}</p>
      </div>
    </button>
  );
}

function FieldGroup({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-card space-y-4 rounded-[34px] p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-soft mt-1 text-sm leading-6">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
  required
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-muted-soft text-sm font-semibold">{label}</span>
      <input
        className="liquid-input border-border/70 bg-surface-elevated/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
        required={required}
      />
    </label>
  );
}

function TextAreaField({
  label,
  placeholder,
  value,
  onChange,
  required
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-muted-soft text-sm font-semibold">{label}</span>
      <textarea
        className="liquid-input min-h-[120px] resize-y border-border/70 bg-surface-elevated/88 leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
        required={required}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-muted-soft text-sm font-semibold">{label}</span>
      <select
        className="liquid-input border-border/70 bg-surface-elevated/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        required={required}
      >
        {children}
      </select>
    </label>
  );
}

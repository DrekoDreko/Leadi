"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  Palette,
  RefreshCcw,
  Sparkles,
  Wand2,
  X
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { InfiniteGridHero } from "@/components/ui/the-infinite-grid";
import { AI_CREDIT_COSTS } from "@/lib/ai/credit-costs";
import { validateCreativeRequestAttachment } from "@/lib/creative-requests/attachments";
import { AD_IMAGE_STYLE_PRESETS } from "@/lib/creatives/ad-image-presets";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";

const IMAGE_COST = AI_CREDIT_COSTS.generate_ad_image;
const MAX_REFERENCES = 4;
const REFERENCE_ACCEPT = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";

const carrierOptions = [
  "Amil",
  "Hapvida",
  "SulAmérica",
  "Unimed",
  "Bradesco Saúde",
  "NotreDame Intermédica",
  "Porto Seguro",
  "Outra"
];

const contractTypeOptions = ["Empresarial (CNPJ)", "Familiar", "Individual", "Adesão"];

const formatOptions = [
  { value: "story", label: "Story / Reels (9:16)" },
  { value: "feed", label: "Feed quadrado (1:1)" },
  { value: "portrait", label: "Retrato (4:5)" },
  { value: "landscape", label: "Paisagem (16:9)" }
];

type FormState = {
  title: string;
  objective: string;
  briefing: string;
  carrier: string;
  contractType: string;
  discount: string;
  offer: string;
  phone: string;
  brandName: string;
  format: string;
  style: string;
  stylePreset: string;
};

const initialForm: FormState = {
  title: "",
  objective: "",
  briefing: "",
  carrier: "",
  contractType: "",
  discount: "",
  offer: "",
  phone: "",
  brandName: "",
  format: "feed",
  style: "",
  stylePreset: ""
};

type ReferenceFile = {
  id: string;
  file: File;
  previewUrl: string;
};

type GeneratedImage = {
  dataUrl: string;
};

export function SolicitarCriativoClient({ availableCredits }: { availableCredits: number }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [references, setReferences] = useState<ReferenceFile[]>([]);
  const [useStyleReference, setUseStyleReference] = useState(false);
  const [credits, setCredits] = useState(availableCredits);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasEnoughCredits = credits >= IMAGE_COST;

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectPreset(presetId: string) {
    setForm((current) => ({
      ...current,
      stylePreset: current.stylePreset === presetId ? "" : presetId
    }));
  }

  function handleReferenceChange(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (incoming.length === 0) {
      return;
    }

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

    if (!form.title.trim() || !form.briefing.trim()) {
      setError("Informe pelo menos o título e o briefing da arte.");
      return;
    }

    if (!hasEnoughCredits) {
      setError(`Você precisa de ${IMAGE_COST} créditos de IA para gerar uma arte.`);
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("objective", form.objective);
      formData.append("briefing", form.briefing);
      formData.append("carrier", form.carrier);
      formData.append("contractType", form.contractType);
      formData.append("discount", form.discount);
      formData.append("offer", form.offer);
      formData.append("phone", form.phone);
      formData.append("brandName", form.brandName);
      formData.append("format", form.format);
      formData.append("style", form.style);
      formData.append("stylePreset", form.stylePreset);
      formData.append("useStyleReference", String(useStyleReference && Boolean(form.stylePreset)));
      for (const reference of references) {
        formData.append("references", reference.file, reference.file.name);
      }

      const response = await fetch("/api/creatives/generate-image", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            image?: { b64: string; mimeType: string };
            remainingCredits?: number;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.image?.b64) {
        setError(payload?.error ?? "Não foi possível gerar a arte. Tente novamente.");
        return;
      }

      setResult({
        dataUrl: `data:${payload.image.mimeType};base64,${payload.image.b64}`
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
      <PageHeading
        eyebrow="Criar"
        title="Solicitação de criativo"
        description="Descreva a arte do seu plano de saúde, anexe referências e deixe a IA gerar o criativo."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-signal px-5 py-3 text-sm font-semibold text-accent-foreground shadow-soft">
          <Palette size={18} aria-hidden="true" />
          Novo pedido
        </span>
      </PageHeading>

      <InfiniteGridHero
        eyebrow={
          <>
            <Sparkles size={14} aria-hidden="true" />
            Arte com IA
          </>
        }
        title="Gere sua arte de plano de saúde com IA"
        subtitle="Preencha o briefing, envie exemplos de referência e receba uma arte pronta para publicar em segundos."
      >
        <span className="text-muted-soft inline-flex items-center gap-2 rounded-full bg-surface-elevated px-4 py-2 text-sm font-medium ring-1 ring-border/70">
          <Wand2 size={16} aria-hidden="true" />
          {IMAGE_COST} créditos por arte · {credits} disponíveis
        </span>
      </InfiniteGridHero>

      <section className="surface-card space-y-4 rounded-[34px] p-6">
        <div className="flex items-center gap-3">
          <span className="text-cobalt flex h-10 w-10 items-center justify-center rounded-[16px] bg-surface-elevated ring-1 ring-border/70">
            <LayoutTemplate size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Padrão de arte</h2>
            <p className="text-muted-soft text-sm leading-6">
              Escolha um modelo para a IA seguir, ou gere a partir do briefing livre.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PresetCard
            label="Sem padrão"
            description="Briefing livre — a IA cria do zero a partir dos campos preenchidos."
            selected={form.stylePreset === ""}
            onSelect={() => selectPreset("")}
          />
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
          <FieldGroup title="Sobre a arte" description="O que a peça precisa comunicar.">
            <TextField
              label="Título / chamada principal"
              placeholder="Ex: Plano de saúde para sua família"
              value={form.title}
              onChange={(value) => updateField("title", value)}
            />
            <TextField
              label="Objetivo"
              placeholder="Ex: gerar contatos no WhatsApp"
              value={form.objective}
              onChange={(value) => updateField("objective", value)}
            />
            <TextAreaField
              label="Briefing detalhado"
              placeholder="Descreva o que deve aparecer na arte: mensagem, clima, elementos, público..."
              value={form.briefing}
              onChange={(value) => updateField("briefing", value)}
            />
          </FieldGroup>

          <FieldGroup title="Plano e oferta" description="Detalhes comerciais em destaque.">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Operadora / plano"
                value={form.carrier}
                onChange={(value) => updateField("carrier", value)}
              >
                <option value="">Selecione (opcional)</option>
                {carrierOptions.map((carrier) => (
                  <option key={carrier} value={carrier}>
                    {carrier}
                  </option>
                ))}
              </SelectField>
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
              <TextField
                label="Desconto em destaque"
                placeholder="Ex: 40%"
                value={form.discount}
                onChange={(value) => updateField("discount", value)}
              />
              <TextField
                label="Oferta / condição"
                placeholder="Ex: 20% de desconto nas 3 primeiras parcelas"
                value={form.offer}
                onChange={(value) => updateField("offer", value)}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Contato e marca" description="O que assina e como falar com você.">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Telefone / WhatsApp"
                placeholder="Ex: (81) 98704-7809"
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
              />
              <TextField
                label="Marca / consultor"
                placeholder="Ex: Fernando Cunha — Planos de Saúde"
                value={form.brandName}
                onChange={(value) => updateField("brandName", value)}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Formato e estilo" description="Como a arte deve sair.">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Formato"
                value={form.format}
                onChange={(value) => updateField("format", value)}
              >
                {formatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Estilo visual"
                placeholder="Ex: moderno, azul, com família sorrindo"
                value={form.style}
                onChange={(value) => updateField("style", value)}
              />
            </div>
          </FieldGroup>
        </div>

        <div className="space-y-4">
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

          <div className="surface-card space-y-4 rounded-[34px] p-6">
            {error ? (
              <p className="surface-alert-danger flex items-start gap-2 rounded-[20px] px-4 py-3 text-sm">
                <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                {error}
              </p>
            ) : null}

            {!hasEnoughCredits ? (
              <p className="text-muted-soft text-sm">
                Você tem {credits} créditos. São necessários {IMAGE_COST} para gerar uma arte.
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
              <h3 className="text-lg font-semibold">Arte gerada</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.dataUrl}
                alt="Arte gerada por IA"
                className="w-full rounded-[24px] ring-1 ring-border/70"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={result.dataUrl}
                  download="arte-leadi.png"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/90"
                >
                  <Download size={17} aria-hidden="true" />
                  Baixar arte
                </a>
                <button
                  type="submit"
                  disabled={isGenerating || !hasEnoughCredits}
                  className="text-foreground inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-surface-elevated px-5 py-3 text-sm font-semibold ring-1 ring-border/70 transition hover:bg-surface-elevated/80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw size={17} aria-hidden="true" />
                  Gerar novamente
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </form>
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
  onChange
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-muted-soft text-sm font-semibold">{label}</span>
      <input
        className="liquid-input border-border/70 bg-surface-elevated/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  label,
  placeholder,
  value,
  onChange
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-muted-soft text-sm font-semibold">{label}</span>
      <textarea
        className="liquid-input min-h-[120px] resize-y border-border/70 bg-surface-elevated/88 leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-muted-soft text-sm font-semibold">{label}</span>
      <select
        className="liquid-input border-border/70 bg-surface-elevated/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

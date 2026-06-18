"use client";

import { Building2, Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadOrganizationLogoAction } from "./actions";

export function CompanyLogoUpload({
  currentLogoUrl,
  canEdit,
}: {
  currentLogoUrl: string | null;
  canEdit: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.set("logo", file);

    startTransition(async () => {
      await uploadOrganizationLogoAction(formData);
    });
  }

  const displayUrl = preview ?? currentLogoUrl;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-surface-elevated border border-border">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Logo da empresa"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink/30">
            <Building2 size={32} />
          </span>
        )}
        {isPending && (
          <span className="absolute inset-0 flex items-center justify-center bg-surface-elevated">
            <Loader2 size={22} className="animate-spin text-cobalt" />
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">Logo da empresa</p>
        <p className="text-xs text-ink/50">JPG, PNG ou WebP. Máximo 2 MB.</p>
        {canEdit && (
          <>
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cobalt/10 px-4 py-2 text-xs font-semibold text-cobalt transition hover:bg-cobalt/18"
              onClick={() => inputRef.current?.click()}
              disabled={isPending}
            >
              <Camera size={14} />
              {currentLogoUrl ? "Trocar logo" : "Enviar logo"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

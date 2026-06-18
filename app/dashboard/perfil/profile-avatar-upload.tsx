"use client";

import { Camera, Loader2, User } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadProfileAvatarAction } from "./empresa/actions";

export function ProfileAvatarUpload({
  currentAvatarUrl,
  displayName,
}: {
  currentAvatarUrl: string | null;
  displayName: string;
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
    formData.set("avatar", file);

    startTransition(async () => {
      await uploadProfileAvatarAction(formData);
    });
  }

  const displayUrl = preview ?? currentAvatarUrl;

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface-elevated border border-border transition hover:border-cobalt/30"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={displayName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink/30">
            <User size={24} />
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
          {isPending ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Camera
              size={16}
              className="text-white opacity-0 transition group-hover:opacity-100"
            />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

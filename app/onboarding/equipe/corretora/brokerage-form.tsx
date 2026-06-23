"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { ArrowRight, Building2, CheckCircle2, ImagePlus, PartyPopper } from "lucide-react";
import { saveBrokerageAction } from "./actions";

type BrokerageSummary = {
  name: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
};

type BrokerageFormProps = {
  defaultName: string;
  defaultPhone: string;
  defaultCity: string;
  defaultState: string;
  logoUrl: string | null;
  done: boolean;
  summary: BrokerageSummary;
};

export function BrokerageForm({
  defaultName,
  defaultPhone,
  defaultCity,
  defaultState,
  logoUrl,
  done,
  summary
}: BrokerageFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (done && mounted) {
      const duration = 3000;
      const end = Date.now() + duration;

      const interval = setInterval(() => {
        if (Date.now() > end) {
          return clearInterval(interval);
        }

        confetti({
          particleCount: 15,
          angle: 270,
          spread: 90,
          origin: { x: Math.random(), y: 0 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
          zIndex: 999999,
          startVelocity: 20,
          gravity: 0.8,
          ticks: 300
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [done, mounted]);

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  const locationLabel = [summary.city, summary.state].filter(Boolean).join(" · ");

  return (
    <>
      <form action={saveBrokerageAction} className="mt-8 space-y-5">
        <div>
          <label className="text-sm font-semibold text-muted-strong" htmlFor="name">
            Nome da corretora
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={defaultName}
            placeholder="Ex.: Corretora Horizonte"
            className="liquid-input mt-2 w-full"
          />
        </div>

        <div>
          <span className="text-sm font-semibold text-muted-strong">Logo da corretora</span>
          <div className="mt-2 flex items-center gap-4">
            <span className="surface-card-muted flex h-16 w-16 items-center justify-center overflow-hidden rounded-[18px]">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="text-muted-soft" size={22} aria-hidden="true" />
              )}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="surface-action-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <ImagePlus size={16} aria-hidden="true" />
              Enviar logo
            </button>
            <input
              ref={fileInputRef}
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
          <p className="mt-2 text-xs text-muted-soft">PNG, JPG ou WEBP, ate 2MB.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-muted-strong" htmlFor="phone">
              Telefone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={defaultPhone}
              placeholder="(11) 90000-0000"
              className="liquid-input mt-2 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-strong" htmlFor="address_city">
              Cidade
            </label>
            <input
              id="address_city"
              name="address_city"
              type="text"
              defaultValue={defaultCity}
              placeholder="Sao Paulo"
              className="liquid-input mt-2 w-full"
            />
          </div>
        </div>

        <div className="sm:w-1/2 sm:pr-2.5">
          <label className="text-sm font-semibold text-muted-strong" htmlFor="address_state">
            Estado (UF)
          </label>
          <input
            id="address_state"
            name="address_state"
            type="text"
            maxLength={2}
            defaultValue={defaultState}
            placeholder="SP"
            className="liquid-input mt-2 w-full uppercase"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-8 py-4 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-cobalt/90"
          >
            Salvar e continuar
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </form>

      {done && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm" aria-hidden="true" />
          <div className="surface-modal relative z-10 w-full max-w-md rounded-[30px] p-7 text-center shadow-soft">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/16 text-success">
              <PartyPopper size={28} aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold">Corretora configurada!</h2>
            <p className="mt-2 leading-7 text-muted-soft">
              Tudo pronto para montar sua equipe. Aqui esta o resumo:
            </p>

            <div className="surface-card-muted mt-6 rounded-[22px] p-5 text-left">
              <div className="flex items-center gap-4">
                <span className="surface-card flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px]">
                  {summary.logoUrl ? (
                    <Image
                      src={summary.logoUrl}
                      alt={summary.name}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Building2 className="text-muted-soft" size={22} aria-hidden="true" />
                  )}
                </span>
                <div>
                  <p className="text-lg font-semibold">{summary.name}</p>
                  {locationLabel ? (
                    <p className="text-sm text-muted-soft">{locationLabel}</p>
                  ) : null}
                </div>
              </div>
              {summary.phone ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-soft">
                  <CheckCircle2 size={15} className="text-lagoon" aria-hidden="true" />
                  {summary.phone}
                </p>
              ) : null}
            </div>

            <Link
              href="/onboarding/equipe/convites"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cobalt px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-cobalt/90"
            >
              Continuar para os convites
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

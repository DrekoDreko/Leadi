"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Mail,
  MessageCircle,
  PhoneCall,
  UserRound,
  X
} from "lucide-react";
import type { Lead } from "@/data/mock";

export function LeadDetailsPopup({
  lead,
  onClose
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!lead) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lead, onClose]);

  if (!lead) {
    return null;
  }

  const profileItems = [
    { icon: UserRound, label: "Nome", value: lead.name },
    { icon: PhoneCall, label: "Telefone", value: lead.phone },
    { icon: Mail, label: "Email", value: lead.email }
  ];

  return (
    <div
      aria-labelledby="lead-popup-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
      onClick={onClose}
      role="dialog"
    >
      <section
        className="mx-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-white/70 bg-cloud/95 p-4 shadow-glass sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                {lead.id}
              </span>
              <span className="rounded-full bg-white/64 px-3 py-1.5 text-xs font-semibold">
                {lead.stage}
              </span>
              <span className="rounded-full bg-cobalt px-3 py-1.5 text-xs font-semibold text-white">
                {lead.score}% fit
              </span>
            </div>
            <h2 className="text-2xl font-semibold sm:text-3xl" id="lead-popup-title">
              {lead.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/62 sm:text-base">
              {lead.interest}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button className="icon-button" type="button" title="Enviar e-mail">
              <Mail size={18} aria-hidden="true" />
            </button>
            <Link
              className="icon-button"
              href={`/dashboard/whatsapp?lead=${lead.id}`}
              title={`Abrir sugestões de mensagem para ${lead.name}`}
            >
              <MessageCircle size={18} aria-hidden="true" />
            </Link>
            <button className="icon-button" type="button" title="Ligar">
              <PhoneCall size={18} aria-hidden="true" />
            </button>
            <button className="icon-button" onClick={onClose} type="button" title="Fechar">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 pt-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {profileItems.map((item) => (
                <div className="rounded-[24px] bg-white/44 p-4" key={item.label}>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/68">
                    <item.icon size={18} aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-ink/42">
                    {item.label}
                  </p>
                  <p className="mt-1 font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-[28px] bg-white/42 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lagoon text-white">
                  <CheckCircle2 size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-ink/54">Última interação</p>
                  <h3 className="font-semibold">Resumo comercial</h3>
                </div>
              </div>
              <p className="text-sm leading-6 text-ink/68">{lead.lastInteraction}</p>
              <p className="mt-4 rounded-[20px] bg-white/52 p-4 text-sm leading-6 text-ink/68">
                {lead.notes}
              </p>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[28px] bg-ink p-5 text-white">
              <p className="text-sm text-white/62">Próximo contato</p>
              <h3 className="mt-2 text-2xl font-semibold">{lead.nextContact}</h3>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <span>WhatsApp</span>
                  <span className="font-semibold">{lead.phone}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <span>Email</span>
                  <span className="max-w-[180px] truncate font-semibold">{lead.email}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] bg-white/44 p-5">
              <h3 className="font-semibold">Contato</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink/54">Nome</dt>
                  <dd className="max-w-[170px] truncate font-semibold">{lead.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink/54">Telefone</dt>
                  <dd className="font-semibold">{lead.phone}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink/54">Email</dt>
                  <dd className="max-w-[170px] truncate font-semibold">{lead.email}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

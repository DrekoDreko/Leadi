"use client";

import { useEffect, useState } from "react";
import { Building2, Clock3, Globe, MessageCircle, X } from "lucide-react";
import { FirmamentLogo } from "./firmament-logo";

// Firmament Assessoria Contábil — WhatsApp (11) 98952-8103
const WHATSAPP_NUMBER = "5511989528103";

type ContabilidadeCardProps = {
  consultantName: string;
  companyName: string;
};

const FIRMAMENT_SITE = "https://firmamentcontabil.com/";

const highlights = [
  { icon: Clock3, label: "Abertura em 3 a 7 dias úteis" },
  { icon: Clock3, label: "Alteração empresarial em 10 a 15 dias" },
  { icon: Building2, label: "MEI, ME, LTDA, SLU e SA" }
];

export function ContabilidadeCard({ consultantName, companyName }: ContabilidadeCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <section className="surface-card rounded-[34px] p-6 md:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-col gap-3">
              <FirmamentLogo className="h-14 w-auto shrink-0 self-start text-foreground" />
              <div>
                <p className="text-sm font-medium text-cobalt">Contabilidade parceira</p>
                <h2 className="text-2xl font-semibold leading-tight text-foreground">
                  Firmament Assessoria Contábil
                </h2>
              </div>
            </div>
            <ul className="flex flex-wrap gap-2">
              {highlights.map((item) => (
                <li
                  key={item.label}
                  className="surface-pill text-muted-soft inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
                >
                  <item.icon size={15} aria-hidden="true" />
                  {item.label}
                </li>
              ))}
              <li>
                <a
                  href={FIRMAMENT_SITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="surface-pill text-cobalt inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition hover:bg-surface-elevated"
                >
                  <Globe size={15} aria-hidden="true" />
                  firmamentcontabil.com
                </a>
              </li>
            </ul>
          </div>

          <button
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-cobalt px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-cobalt/90"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            Entrar em contato
          </button>
        </div>
      </section>

      <ContabilidadeModal
        consultantName={consultantName}
        companyName={companyName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

type ContabilidadeModalProps = ContabilidadeCardProps & {
  isOpen: boolean;
  onClose: () => void;
};

function ContabilidadeModal({
  consultantName,
  companyName,
  isOpen,
  onClose
}: ContabilidadeModalProps) {
  const [name, setName] = useState(consultantName);
  const [company, setCompany] = useState(companyName);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setName(consultantName);
      setCompany(companyName);
      setNotes("");
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
  }, [isOpen, onClose, consultantName, companyName]);

  if (!isOpen) return null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedNotes = notes.trim();
    const message =
      `Olá, Firmament Assessoria Contábil! Sou ${name.trim()}, da ${company.trim()}. ` +
      `Vendi um plano de saúde para um cliente que ainda não possui empresa e gostaria de ` +
      `solicitar a abertura da empresa dele.` +
      (trimmedNotes ? `\n\nObservações: ${trimmedNotes}` : "");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <div
      aria-labelledby="contabilidade-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
      onClick={onClose}
      role="dialog"
    >
      <section
        className="surface-modal mx-auto w-full max-w-lg rounded-[32px] p-4 shadow-glass sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
          <div>
            <FirmamentLogo className="h-9 w-auto text-foreground" />
            <p className="mt-3 text-sm font-medium text-cobalt">Contabilidade</p>
            <h2
              className="mt-2 text-2xl font-semibold sm:text-3xl"
              id="contabilidade-modal-title"
            >
              Solicitar abertura de empresa
            </h2>
            <p className="text-muted-soft mt-2 text-sm leading-6">
              Confira seus dados e envie a solicitação para a Firmament. Você será redirecionado para
              o WhatsApp com a mensagem já preenchida.
            </p>
          </div>
          <button className="icon-button shrink-0" onClick={onClose} type="button" title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-5">
          <label className="block space-y-2">
            <span className="text-muted-soft block text-sm font-medium">Seu nome</span>
            <input
              className="liquid-input"
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do consultor"
              required
              type="text"
              value={name}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-muted-soft block text-sm font-medium">Empresa</span>
            <input
              className="liquid-input"
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Empresa em que você trabalha"
              required
              type="text"
              value={company}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-muted-soft block text-sm font-medium">
              Observações <span className="text-muted-foreground">(opcional)</span>
            </span>
            <textarea
              className="liquid-input min-h-[120px] resize-y"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Detalhes adicionais para a contabilidade (ex.: nome do cliente)..."
              rows={4}
              value={notes}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
            <button
              className="surface-action-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cobalt to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              type="submit"
            >
              <MessageCircle size={18} aria-hidden="true" />
              Enviar pelo WhatsApp
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

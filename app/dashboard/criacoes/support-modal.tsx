"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, X, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511920595133";

const categories = [
  { value: "problema_tecnico", label: "Problema tecnico" },
  { value: "duvida", label: "Duvida sobre funcionalidade" },
  { value: "solicitacao_recurso", label: "Solicitacao de recurso" },
  { value: "financeiro", label: "Financeiro / Cobranca" },
  { value: "outro", label: "Outro" },
];

type SupportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [category, setCategory] = useState(categories[0].value);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setCategory(categories[0].value);
      setMessage("");
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categoryLabel = categories.find((c) => c.value === category)?.label ?? category;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const text = [
      `*Central de Ajuda — Leadi*`,
      ``,
      `*Categoria:* ${categoryLabel}`,
      ``,
      `*Mensagem:*`,
      message.trim(),
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
    onClose();
  }

  return (
    <div
      aria-labelledby="support-modal-title"
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
            <p className="text-sm font-medium text-cobalt">Suporte</p>
            <h2
              className="mt-2 flex items-center gap-2 text-2xl font-semibold sm:text-3xl"
              id="support-modal-title"
            >
              <LifeBuoy size={24} className="text-cobalt" aria-hidden="true" />
              Central de Ajuda
            </h2>
            <p className="text-muted-soft mt-2 text-sm leading-6">
              Escolha a categoria e descreva sua solicitacao. Voce sera redirecionado para o WhatsApp
              da equipe.
            </p>
          </div>
          <button className="icon-button shrink-0" onClick={onClose} type="button" title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-5">
          <label className="block space-y-2">
            <span className="text-muted-soft block text-sm font-medium">Categoria</span>
            <select
              className="liquid-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-muted-soft block text-sm font-medium">Mensagem</span>
            <textarea
              className="liquid-input min-h-[120px] resize-y"
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva como podemos ajudar..."
              required
              minLength={10}
              rows={4}
              value={message}
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
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1ebe57]"
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

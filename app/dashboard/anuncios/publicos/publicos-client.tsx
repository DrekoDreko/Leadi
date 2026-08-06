"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  XCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";

type AudienceListItem = {
  id: string;
  metaAdAccountId: string;
  customAudienceId: string;
  lookalikeId: string | null;
  sourceCount: number;
  status: "ready" | "lookalike_unavailable" | "processing" | "failed";
  createdAt: string;
};

type ParsedContact = { email?: string; phone?: string };

const MAX_CONTACTS = 50000;

// Parser simples de CSV: detecta cabeçalho (email / telefone) ou, na ausência,
// adivinha por conteúdo (token com "@" = e-mail; só dígitos = telefone).
function parseCsv(text: string): ParsedContact[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const splitCells = (line: string) =>
    line.split(/[;,\t]/).map((cell) => cell.trim().replace(/^"|"$/g, ""));

  const header = splitCells(lines[0]).map((cell) => cell.toLowerCase());
  const emailIdx = header.findIndex((cell) => cell.includes("email") || cell.includes("e-mail"));
  const phoneIdx = header.findIndex(
    (cell) => cell.includes("phone") || cell.includes("telefone") || cell.includes("celular") || cell.includes("fone")
  );
  const hasHeader = emailIdx >= 0 || phoneIdx >= 0;
  const rows = hasHeader ? lines.slice(1) : lines;

  const contacts: ParsedContact[] = [];
  for (const line of rows) {
    const cells = splitCells(line);
    let email: string | undefined;
    let phone: string | undefined;

    if (hasHeader) {
      email = emailIdx >= 0 ? cells[emailIdx] : undefined;
      phone = phoneIdx >= 0 ? cells[phoneIdx] : undefined;
    } else {
      for (const cell of cells) {
        if (cell.includes("@")) email = cell;
        else if (/\d{8,}/.test(cell.replace(/\D/g, ""))) phone = cell;
      }
    }

    if ((email && email.includes("@")) || (phone && phone.replace(/\D/g, "").length >= 8)) {
      contacts.push({ email: email || undefined, phone: phone || undefined });
    }
    if (contacts.length >= MAX_CONTACTS) break;
  }
  return contacts;
}

function statusLabel(status: AudienceListItem["status"], hasLookalike: boolean) {
  if (status === "lookalike_unavailable") return "Público criado · Semelhante indisponível";
  if (status === "failed") return "Falhou";
  if (status === "processing") return "Processando";
  return hasLookalike ? "Público + Semelhante prontos" : "Público pronto";
}

export function PublicosClient({
  adAccounts,
  initialAudiences
}: {
  adAccounts: Array<{ id: string; name: string }>;
  initialAudiences: AudienceListItem[];
}) {
  const [adAccountId, setAdAccountId] = useState(adAccounts[0]?.id ?? "");
  const [audienceName, setAudienceName] = useState("");
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [audiences, setAudiences] = useState<AudienceListItem[]>(initialAudiences);
  const [result, setResult] = useState<{ lookalikeId: string | null; count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = useMemo(
    () => Boolean(adAccountId) && contacts.length > 0 && !isSubmitting,
    [adAccountId, contacts.length, isSubmitting]
  );

  async function handleFile(file: File | null) {
    setError("");
    setResult(null);
    if (!file) {
      setContacts([]);
      setFileName("");
      return;
    }
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setError("Não encontramos e-mails ou telefones no arquivo. Verifique o CSV.");
      }
      setContacts(parsed);
    } catch {
      setError("Não foi possível ler o arquivo. Envie um CSV válido.");
      setContacts([]);
    }
  }

  async function handleSubmit() {
    setError("");
    setResult(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/meta/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountId,
          audienceName: audienceName.trim() || undefined,
          identifiers: contacts
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { audience?: { lookalikeId: string | null; sourceCount: number; status: AudienceListItem["status"]; customAudienceId: string }; error?: string }
        | null;

      if (!response.ok || !payload?.audience) {
        setError(payload?.error ?? "Não foi possível criar o público agora.");
        return;
      }

      const created = payload.audience;
      setResult({ lookalikeId: created.lookalikeId, count: created.sourceCount });
      setAudiences((prev) => [
        {
          id: `${created.customAudienceId}-${Date.now()}`,
          metaAdAccountId: adAccountId.replace(/^act_/, ""),
          customAudienceId: created.customAudienceId,
          lookalikeId: created.lookalikeId,
          sourceCount: created.sourceCount,
          status: created.status,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
      // Limpa o arquivo da memória do navegador após o envio.
      setContacts([]);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Não foi possível criar o público agora. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (adAccounts.length === 0) {
    return (
      <Card className="surface-card rounded-[28px] p-6">
        <p className="text-sm text-muted-foreground">
          Nenhuma conta de anúncio conectada. Conecte a Meta em Perfil &gt; Minha conexão Meta para
          criar públicos personalizados.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="space-y-4 lg:col-span-2">
        <Card className="surface-card rounded-[28px] p-6">
          <div className="flex items-center gap-2">
            <Users className="text-cobalt" size={18} aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">Enviar carteira</h2>
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-3 rounded-[16px] surface-danger p-3 text-sm">
              <XCircle className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
              <p>{error}</p>
            </div>
          ) : null}

          {result ? (
            <div className="mt-4 flex items-start gap-3 rounded-[16px] surface-alert-success p-3 text-sm">
              <CheckCircle2 className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
              <div>
                <p className="font-semibold">Público criado com {result.count.toLocaleString("pt-BR")} contatos.</p>
                <p className="mt-0.5">
                  {result.lookalikeId
                    ? "Público Semelhante (Lookalike) criado — novas campanhas passam a usá-lo automaticamente."
                    : "O Semelhante não foi liberado (planos de saúde são Categoria Especial na Meta). Seguimos com o público da carteira."}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <Field label="Conta de anúncio">
              <select
                className="w-full rounded-[14px] border border-border bg-surface-elevated p-3 text-sm text-foreground outline-none focus:border-cobalt/40"
                onChange={(e) => setAdAccountId(e.target.value)}
                value={adAccountId}
              >
                {adAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name || account.id}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nome do público (opcional)">
              <input
                className="w-full rounded-[14px] border border-border bg-surface-elevated p-3 text-sm text-foreground outline-none focus:border-cobalt/40"
                onChange={(e) => setAudienceName(e.target.value)}
                placeholder="Ex.: Clientes 2026"
                value={audienceName}
              />
            </Field>

            <Field label="Arquivo da carteira (CSV com e-mail e/ou telefone)">
              <label className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-dashed border-border bg-surface-elevated p-4 text-sm text-muted-foreground transition-colors hover:border-cobalt/40">
                <Upload size={18} className="text-cobalt" aria-hidden="true" />
                <span className="flex-1">
                  {fileName ? (
                    <span className="text-foreground">{fileName}</span>
                  ) : (
                    "Clique para selecionar um arquivo .csv"
                  )}
                  {contacts.length > 0 ? (
                    <span className="ml-2 text-cobalt">{contacts.length.toLocaleString("pt-BR")} contatos válidos</span>
                  ) : null}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </Field>
          </div>

          <button
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Criar público e semelhante
          </button>
        </Card>

        <Card className="surface-card-muted rounded-[24px] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-cobalt" size={18} aria-hidden="true" />
            <div className="text-sm text-muted-soft">
              <p className="font-semibold text-foreground">Privacidade e consentimento</p>
              <p className="mt-1">
                Os e-mails e telefones são convertidos em código (hash SHA-256) antes de irem para a
                Meta — o Leadi não guarda a lista bruta. Envie apenas contatos que consentiram em receber
                comunicações da sua corretora.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <Card className="surface-card rounded-[28px] p-6">
          <h2 className="text-lg font-semibold text-foreground">Públicos criados</h2>
          {audiences.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum público criado ainda. Envie sua primeira carteira ao lado.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {audiences.map((audience) => (
                <li key={audience.id} className="surface-card-muted rounded-[16px] p-3 text-sm">
                  <p className="font-semibold text-foreground">
                    {statusLabel(audience.status, Boolean(audience.lookalikeId))}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {audience.sourceCount.toLocaleString("pt-BR")} contatos · conta {audience.metaAdAccountId}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  FileText,
  Loader2,
  Copy,
  RefreshCcw,
  Undo2,
  Sparkles,
  Upload
} from "lucide-react";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import { normalizeEmail, normalizePhone, stringOrNull } from "@/lib/leads/normalization";
import { type LeadDataMode } from "@/lib/leads/repository";
import {
  buildSuggestedLeadImportMapping,
  FIXED_CSV_SOURCE_VALUE,
  FIXED_META_SOURCE_VALUE,
  leadImportFieldMeta,
  isLikelyMetaLeadAdsExport,
  parseCsvText,
  type LeadImportFieldKey,
  type LeadImportMapping,
  type ParsedCsvFile
} from "@/lib/imports/csv";
import { validateFilePayloadSize } from "@/lib/payload-limits";

type ImportPreviewRow = {
  index: number;
  values: Record<LeadImportFieldKey, string>;
  issues: string[];
  payload: {
    name: string;
    email?: string;
    phone?: string;
    city?: string;
    source: string;
    interest?: string;
    notes?: string;
    stage: "new";
    raw_payload: Record<string, string>;
  } | null;
};

type ImportRunSummary = {
  created: number;
  duplicates: Array<{ index: number; reason: string }>;
  ignored: Array<{ index: number; reason: string }>;
  errors: Array<{ index: number; reason: string }>;
  mode: LeadDataMode;
  batchId: string | null;
  undone: boolean;
};

const previewFields: LeadImportFieldKey[] = ["name", "email", "phone", "city", "source", "interest", "notes"];

export function CsvImportWorkspace({
  canCreateMetaAdsLeads,
  createLeadAccess,
  metaConnectedAccountId
}: {
  canCreateMetaAdsLeads: boolean;
  createLeadAccess: ResourceAccessSummary;
  metaConnectedAccountId: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedFile, setParsedFile] = useState<ParsedCsvFile | null>(null);
  const [mapping, setMapping] = useState<LeadImportMapping>(() =>
    buildSuggestedLeadImportMapping([])
  );
  const [isParsing, setIsParsing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [importSummary, setImportSummary] = useState<ImportRunSummary | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [undoStatus, setUndoStatus] = useState<string | null>(null);
  const isMetaLeadAdsImport = useMemo(
    () => (parsedFile ? isLikelyMetaLeadAdsExport(parsedFile.headers) : false),
    [parsedFile]
  );

  const previewRows = useMemo(() => {
    if (!parsedFile) {
      return [];
    }

    return parsedFile.rows.map((row, index) => mapPreviewRow(parsedFile, mapping, row, index));
  }, [mapping, parsedFile]);

  const validRows = previewRows.filter((row) => row.payload !== null);
  const invalidRows = previewRows.filter((row) => row.payload === null);
  const mappedFieldsCount = leadImportFieldMeta.filter(
    (field) => mapping[field.key].trim().length > 0
  ).length;
  const canImport =
    !isParsing &&
    !isImporting &&
    createLeadAccess.allowed &&
    parsedFile !== null &&
    validRows.length > 0 &&
    mapping.name.trim().length > 0;

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      validateFilePayloadSize(file, "CSV_IMPORT");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Arquivo muito grande.");
      return;
    }

    setIsParsing(true);
    setLoadError(null);
    setImportSummary(null);
    setReportStatus(null);
    setUndoStatus(null);

    try {
      const text = await file.text();
      const parsed = parseCsvText(text);

      if (parsed.headers.length === 0) {
        throw new Error("O CSV precisa ter uma linha de cabeçalho.");
      }

      if (parsed.rows.length === 0) {
        throw new Error("O CSV nao tem linhas de dados para importar.");
      }

      const suggestedMapping = buildSuggestedLeadImportMapping(parsed.headers);

      setFileName(file.name);
      setParsedFile(parsed);
      setMapping({
        ...suggestedMapping,
        source:
          !canCreateMetaAdsLeads && suggestedMapping.source === FIXED_META_SOURCE_VALUE
            ? FIXED_CSV_SOURCE_VALUE
            : suggestedMapping.source
      });
    } catch (error) {
      setParsedFile(null);
      setFileName(file.name);
      setLoadError(
        error instanceof Error ? error.message : "Nao foi possivel ler o arquivo CSV."
      );
      setMapping(buildSuggestedLeadImportMapping([]));
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  }

  function updateMapping(field: LeadImportFieldKey, value: string) {
    setMapping((current) => ({
      ...current,
      [field]: value
    }));
    setImportSummary(null);
    setReportStatus(null);
    setUndoStatus(null);
  }

  async function handleImport() {
    if (!createLeadAccess.allowed) {
      setReportStatus(createLeadAccess.message);
      return;
    }

    if (!parsedFile || validRows.length === 0) {
      return;
    }

    setIsImporting(true);
    setImportSummary(null);
    setReportStatus(null);
    setUndoStatus(null);
    setImportProgress({ current: 0, total: validRows.length });

    const duplicates: Array<{ index: number; reason: string }> = [];
    const errors: Array<{ index: number; reason: string }> = [];
    const ignored = invalidRows.map((row) => ({
      index: row.index,
      reason: row.issues.join(" • ")
    }));
    let created = 0;
    let detectedMode: LeadDataMode = "supabase";
    const importBatchId = globalThis.crypto.randomUUID();

    try {
      for (let index = 0; index < validRows.length; index += 1) {
        const row = validRows[index];
        setImportProgress({ current: index + 1, total: validRows.length });

        try {
          const response = await fetch("/api/leads", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ...row.payload,
              meta_connected_account_id:
                row.payload?.source === "meta_lead_ads" ? metaConnectedAccountId : undefined,
              import_batch_id: importBatchId
            })
          });
          const data = (await response.json()) as {
            lead?: unknown;
            mode?: LeadDataMode;
            status?: "created" | "duplicate";
            error?: string;
          };

          if (!response.ok || !data.lead) {
            throw new Error(getImportErrorMessage(data.error));
          }

          if (data.status === "duplicate") {
            duplicates.push({
              index: row.index,
              reason: "Já existia na base e foi atualizado."
            });
          } else {
            created += 1;
          }

          detectedMode = data.mode ?? detectedMode;
        } catch (error) {
          errors.push({
            index: row.index,
            reason:
              error instanceof Error
                ? error.message
                : "Nao foi possivel importar esta linha."
          });
        }
      }

      setImportSummary({
        created,
        duplicates,
        ignored,
        errors,
        mode: detectedMode,
        batchId: importBatchId,
        undone: false
      });

      if (created > 0 && errors.length === 0 && detectedMode === "supabase") {
        router.push("/dashboard/leads");
        router.refresh();
      }
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  }

  async function handleUndoImport() {
    if (!importSummary || !importSummary.batchId || importSummary.undone) {
      return;
    }

    const confirmed = window.confirm(
      "Isso vai remover apenas os leads criados neste lote. Deseja continuar?"
    );

    if (!confirmed) {
      return;
    }

    setIsUndoing(true);
    setUndoStatus(null);
    setReportStatus(null);

    try {
      const response = await fetch(
        `/api/leads/import-batches/${encodeURIComponent(importSummary.batchId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      const data = (await response.json()) as {
        ok?: boolean;
        deletedCount?: number;
        error?: string;
      };

      if (!response.ok || data.ok === false) {
        throw new Error(data.error ?? "Nao foi possivel desfazer a importacao.");
      }

      const deletedCount = typeof data.deletedCount === "number" ? data.deletedCount : 0;

      setImportSummary((current) =>
        current
          ? {
              ...current,
              undone: true
            }
          : current
      );
      setUndoStatus(
        deletedCount > 0
          ? `Importação desfeita. ${deletedCount} lead(s) removidos.`
          : "Importação desfeita. Nenhum lead foi removido."
      );
    } catch (error) {
      setUndoStatus(
        error instanceof Error ? error.message : "Nao foi possivel desfazer a importacao."
      );
    } finally {
      setIsUndoing(false);
    }
  }

  function resetWorkspace() {
    setParsedFile(null);
    setFileName(null);
    setLoadError(null);
    setImportSummary(null);
    setReportStatus(null);
    setUndoStatus(null);
    setImportProgress(null);
    setMapping(buildSuggestedLeadImportMapping([]));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function copyImportReport() {
    if (!importSummary || !parsedFile) {
      return;
    }

    const report = buildImportReport(fileName, parsedFile, importSummary);

    try {
      await navigator.clipboard.writeText(report);
      setReportStatus("Relatório copiado.");
    } catch {
      setReportStatus("Nao foi possivel copiar o relatorio.");
    }
  }

  function downloadImportReport() {
    if (!importSummary || !parsedFile) {
      return;
    }

    const report = buildImportReport(fileName, parsedFile, importSummary);
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${sanitizeReportFileName(fileName ?? "importacao-csv")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setReportStatus("Relatório baixado.");
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[34px] border border-white/66 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(27,121,222,0.88))] p-6 text-white shadow-glass md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              Fluxo CSV
            </p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Upload, preview e mapeamento</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 md:text-base">
              Envie um CSV (máximo 10MB) com cabeçalho, ajuste o mapeamento das colunas e confirme a importação
              somente depois de revisar a prévia dos leads.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-cloud px-5 py-3 text-sm font-semibold text-slate-950 shadow-soft transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/12"
              disabled={isParsing || isImporting}
              onClick={openFilePicker}
              type="button"
            >
              {isParsing ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
              {parsedFile ? "Trocar arquivo" : "Selecionar CSV"}
            </button>

            {parsedFile ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/24 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isParsing || isImporting}
                onClick={resetWorkspace}
                type="button"
              >
                <RefreshCcw size={18} aria-hidden="true" />
                Limpar
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <input
        accept=".csv,text/csv"
        aria-label="Selecionar arquivo CSV"
        className="sr-only"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      {loadError ? (
        <p className="flex items-start gap-3 rounded-[24px] bg-signal/30 px-5 py-4 text-sm font-medium text-ink dark:text-cloud">
          <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <span>{loadError}</span>
        </p>
      ) : null}

      {parsedFile ? (
        <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
          <section className="glass-strong rounded-[34px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cobalt">Arquivo carregado</p>
                <h3 className="mt-2 text-2xl font-semibold">{fileName ?? "CSV"}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Delimitador detectado: <strong>{delimiterLabel(parsedFile.delimiter)}</strong>.
                </p>
                {isMetaLeadAdsImport ? (
                  <p className="mt-3 inline-flex rounded-full bg-cobalt/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cobalt">
                    Meta Lead Ads detectado
                  </p>
                ) : null}
              </div>
              <div className="rounded-full bg-cobalt/10 p-3 text-cobalt">
                <FileText size={20} aria-hidden="true" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ImportStat label="Linhas" value={String(parsedFile.rows.length)} note="antes da validação" />
              <ImportStat label="Campos" value={String(parsedFile.headers.length)} note="cabeçalhos detectados" />
              <ImportStat label="Prontos" value={String(validRows.length)} note="serão importados" />
              <ImportStat label="Ignorados" value={String(invalidRows.length)} note="precisam de ajuste" />
            </div>

            <div className="mt-6 rounded-[28px] border border-white/50 bg-white/42 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink/56">Campos encontrados</p>
                  <p className="mt-1 text-sm leading-6 text-ink/64">
                    O mapeamento abaixo usa estes cabeçalhos como sugestão.
                  </p>
                </div>
                <span className="rounded-full bg-white/72 px-3 py-1 text-xs font-semibold text-ink/64">
                  {mappedFieldsCount} mapeados
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {parsedFile.headers.map((header) => (
                  <span
                    className="rounded-full bg-white/82 px-3 py-1 text-xs font-semibold text-ink/70"
                    key={header}
                  >
                    {header || "Sem título"}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {leadImportFieldMeta.map((field) => (
                <label className="block space-y-2" key={field.key}>
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-ink">
                    <span>
                      {field.label}
                      {field.required ? <span className="ml-1 text-signal">*</span> : null}
                    </span>
                    <span className="text-xs font-medium text-ink/50">{field.helpText}</span>
                  </span>

                  <select
                    className="liquid-input text-sm"
                    onChange={(event) => updateMapping(field.key, event.target.value)}
                    value={mapping[field.key]}
                  >
                    <option value="">Não mapear</option>
                    {field.key === "source"
                      ? [
                          <option key="fixed-csv" value={FIXED_CSV_SOURCE_VALUE}>
                            Fixo: CSV importado
                          </option>,
                          canCreateMetaAdsLeads ? (
                            <option key="fixed-meta" value={FIXED_META_SOURCE_VALUE}>
                              Fixo: Meta Lead Ads
                            </option>
                          ) : null
                        ]
                      : null}
                    {parsedFile.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <section className="glass-strong rounded-[34px] p-5">
            <div className="flex flex-col gap-3 border-b border-ink/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-cobalt">Prévia</p>
                <h3 className="mt-2 text-2xl font-semibold">Leads que serão criados</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
                  Confira a saída final do mapeamento antes de disparar a importação.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/68 px-3 py-1 text-xs font-semibold text-ink/68">
                  {validRows.length} válidos
                </span>
                <span className="rounded-full bg-white/68 px-3 py-1 text-xs font-semibold text-ink/68">
                  {invalidRows.length} inválidos
                </span>
                {isMetaLeadAdsImport ? (
                  <span className="rounded-full bg-cobalt/12 px-3 py-1 text-xs font-semibold text-cobalt">
                    Origem sugerida: {canCreateMetaAdsLeads ? "Meta Lead Ads" : "CSV importado"}
                  </span>
                ) : null}
              </div>
            </div>

            {isMetaLeadAdsImport && !canCreateMetaAdsLeads ? (
              <div className="mt-5 rounded-[28px] border border-cobalt/18 bg-cobalt/8 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 shrink-0 text-cobalt" size={18} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-ink">CSV do Meta detectado</p>
                    <p className="mt-1 text-sm leading-6 text-ink/64">
                      Como a conta Meta ainda nao esta conectada, a importacao vai salvar esses
                      registros com origem <strong>CSV importado</strong> para concluir sem bloqueio.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-[28px] border border-white/52 bg-white/28">
              <div className="grid grid-cols-[56px_minmax(180px,1.25fr)_180px_150px_130px_150px_minmax(180px,1.4fr)_1.1fr] gap-3 border-b border-ink/8 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/42">
                <span>Linha</span>
                <span>Nome</span>
                <span>Email</span>
                <span>Telefone</span>
                <span>Cidade</span>
                <span>Origem</span>
                <span>Interesse</span>
                <span>Observações</span>
              </div>

              <div className="max-h-[520px] overflow-y-auto">
                {previewRows.slice(0, 8).map((row) => (
                  <div
                    className={`grid grid-cols-[56px_minmax(180px,1.25fr)_180px_150px_130px_150px_minmax(180px,1.4fr)_1.1fr] gap-3 border-b border-ink/8 px-4 py-4 text-sm last:border-0 ${
                      row.issues.length > 0 ? "bg-signal/12" : "bg-transparent"
                    }`}
                    key={row.index}
                  >
                    <span className="font-semibold text-ink/54">{row.index}</span>
                    {previewFields.map((field) => (
                      <span className="min-w-0 truncate text-ink/82" key={field}>
                        {row.values[field] || "—"}
                      </span>
                    ))}
                    <span className="min-w-0">
                      {row.issues.length > 0 ? (
                        <span className="inline-flex rounded-full bg-signal/28 px-2.5 py-1 text-xs font-semibold text-ink dark:text-cloud">
                          Revisar
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-lagoon/18 px-2.5 py-1 text-xs font-semibold text-ink">
                          Pronto
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {invalidRows.length > 0 ? (
              <div className="mt-5 rounded-[28px] border border-signal/30 bg-signal/12 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 shrink-0 text-ink" size={18} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-ink">Linhas que precisam de ajuste</p>
                    <p className="mt-1 text-sm leading-6 text-ink/64">
                      Essas linhas ficam de fora até que o nome e pelo menos um contato sejam
                      válidos.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {invalidRows.slice(0, 5).map((row) => (
                    <div
                      className="flex flex-col gap-1 rounded-[20px] bg-white/52 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                      key={row.index}
                    >
                      <span className="font-semibold text-ink">Linha {row.index}</span>
                      <span className="text-ink/66">{row.issues.join(" • ")}</span>
                    </div>
                  ))}
                  {invalidRows.length > 5 ? (
                    <p className="text-xs font-medium text-ink/52">
                      + {invalidRows.length - 5} linha(s) adicionais com problema.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {importSummary ? (
              <div
                className={`mt-5 rounded-[28px] p-4 ${
                  importSummary.errors.length > 0 ? "surface-alert-warning" : "surface-alert-success"
                }`}
              >
                <div className="flex items-start gap-3">
                  {importSummary.errors.length > 0 ? (
                    <AlertCircle className="mt-0.5 shrink-0 text-ink" size={18} aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 shrink-0 text-lagoon" size={18} aria-hidden="true" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {importSummary.errors.length > 0
                        ? "Importação concluída com alguns alertas"
                        : "Importação concluída"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink/66">
                      {importSummary.created} lead(s) criado(s)
                      {importSummary.duplicates.length > 0
                        ? `, ${importSummary.duplicates.length} duplicado(s)`
                        : ""}
                      {importSummary.ignored.length > 0
                        ? `, ${importSummary.ignored.length} linha(s) ignorada(s)`
                        : ""}
                      {importSummary.errors.length > 0
                        ? `, ${importSummary.errors.length} erro(s)`
                        : ""}
                      {importSummary.mode === "not-configured"
                        ? ". Os dados foram criados em modo demonstracao."
                        : ". Os dados foram salvos no Supabase."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <ReportStat label="Criados" value={String(importSummary.created)} />
                  <ReportStat label="Duplicados" value={String(importSummary.duplicates.length)} />
                  <ReportStat label="Ignorados" value={String(importSummary.ignored.length)} />
                  <ReportStat label="Erros" value={String(importSummary.errors.length)} />
                </div>

                {importSummary.duplicates.length > 0 ? (
                  <div className="mt-4 rounded-[24px] bg-white/56 p-4">
                    <p className="text-sm font-semibold text-ink">Duplicados detectados</p>
                    <div className="mt-3 space-y-2">
                      {importSummary.duplicates.slice(0, 5).map((duplicate) => (
                        <div className="text-sm text-ink/72" key={duplicate.index}>
                          <strong>Linha {duplicate.index}:</strong> {duplicate.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {importSummary.ignored.length > 0 ? (
                  <div className="mt-4 rounded-[24px] bg-white/56 p-4">
                    <p className="text-sm font-semibold text-ink">Linhas ignoradas</p>
                    <div className="mt-3 space-y-2">
                      {importSummary.ignored.slice(0, 5).map((ignoredRow) => (
                        <div className="text-sm text-ink/72" key={ignoredRow.index}>
                          <strong>Linha {ignoredRow.index}:</strong> {ignoredRow.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {importSummary.errors.length > 0 ? (
                  <div className="mt-4 rounded-[24px] bg-white/56 p-4">
                    <p className="text-sm font-semibold text-ink">Erros da importação</p>
                    <div className="mt-3 space-y-2">
                      {importSummary.errors.slice(0, 5).map((failure) => (
                        <div className="text-sm text-ink/72" key={failure.index}>
                          <strong>Linha {failure.index}:</strong> {failure.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/74 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/92"
                    onClick={copyImportReport}
                    type="button"
                  >
                    <Copy size={16} aria-hidden="true" />
                    Copiar relatório
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/74 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/92"
                    onClick={downloadImportReport}
                    type="button"
                  >
                    <CheckSquare size={16} aria-hidden="true" />
                    Baixar relatório
                  </button>
                  {importSummary.mode === "supabase" &&
                  importSummary.batchId &&
                  importSummary.created > 0 &&
                  !importSummary.undone ? (
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-signal/20 px-4 py-2 text-sm font-semibold text-ink dark:text-cloud transition hover:bg-signal/32 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isUndoing}
                      onClick={handleUndoImport}
                      type="button"
                    >
                      {isUndoing ? (
                        <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                      ) : (
                        <Undo2 size={16} aria-hidden="true" />
                      )}
                      {isUndoing ? "Desfazendo importação" : "Desfazer importação"}
                    </button>
                  ) : null}
                </div>

                {reportStatus ? (
                  <p className="mt-3 text-xs font-medium text-ink/58">{reportStatus}</p>
                ) : null}
                {undoStatus ? <p className="mt-3 text-xs font-medium text-ink/58">{undoStatus}</p> : null}
                {importSummary.mode === "supabase" && importSummary.created > 0 && !importSummary.undone ? (
                  <p className="mt-3 text-xs font-medium text-ink/52">
                    O desfazer remove apenas os leads criados neste lote. Leads já existentes e
                    atualizados no processo permanecem como estavam.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 md:flex-row md:items-center md:justify-between">
              <p className="text-sm leading-6 text-ink/58">
                Leads importados entram com etapa <strong>Novo lead</strong> e origem
                <strong> CSV importado</strong>. Exportações do Meta usam
                <strong> Meta Lead Ads</strong> quando a conta Meta estiver conectada.
              </p>

              <div className="flex flex-wrap gap-2">
                <Link
                  className="surface-action-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                  href="/dashboard/leads"
                >
                  Ver leads
                </Link>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/90 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!canImport}
                  onClick={handleImport}
                  type="button"
                >
                  {isImporting ? (
                    <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                  ) : (
                    <Sparkles size={18} aria-hidden="true" />
                  )}
                  {isImporting
                    ? `Importando${importProgress ? ` ${importProgress.current}/${importProgress.total}` : ""}`
                    : `Importar ${validRows.length} lead(s)`}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <section className="glass-strong rounded-[34px] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px] lg:items-center">
            <div>
              <p className="text-sm font-medium text-cobalt">Comece por aqui</p>
              <h3 className="mt-2 text-2xl font-semibold md:text-3xl">
                Suba o CSV e revise o mapeamento antes de importar
              </h3>
              <p className="mt-4 max-w-2xl leading-7 text-ink/62">
                O importador aceita CSV com cabeçalho, lida com aspas e vírgulas no conteúdo e
                permite mapear os campos principais para manter os dados coerentes no CRM.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MiniStep title="1. Upload" text="Escolha um CSV com cabeçalho." />
                <MiniStep title="2. Mapeamento" text="Ajuste as colunas sugeridas." />
                <MiniStep title="3. Confirmação" text="Revise a prévia e importe." />
              </div>
            </div>

            <div className="rounded-[28px] border border-dashed border-cobalt/24 bg-white/46 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <Upload size={20} aria-hidden="true" />
              </div>
              <p className="mt-4 text-lg font-semibold">Enviar arquivo CSV</p>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Clique para escolher um arquivo e abrir a tela de mapeamento.
              </p>
              <button
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 dark:border dark:border-white/12 dark:bg-cloud dark:text-slate-950 dark:hover:bg-white"
                onClick={openFilePicker}
                type="button"
              >
                <Upload size={18} aria-hidden="true" />
                Selecionar CSV
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ImportStat({
  label,
  value,
  note
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[24px] bg-white/48 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink/46">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs font-medium text-ink/52">{note}</p>
    </div>
  );
}

function MiniStep({
  title,
  text
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] bg-white/48 px-4 py-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink/60">{text}</p>
    </div>
  );
}

function ReportStat({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-white/68 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/46">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function mapPreviewRow(
  parsedFile: ParsedCsvFile,
  mapping: LeadImportMapping,
  row: string[],
  index: number
): ImportPreviewRow {
  const record = Object.fromEntries(
    parsedFile.headers.map((header, headerIndex) => [header, row[headerIndex] ?? ""])
  );

  const values: Record<LeadImportFieldKey, string> = {
    name: getMappedValue(mapping.name, record),
    email: getMappedValue(mapping.email, record),
    phone: getMappedValue(mapping.phone, record),
    city: getMappedValue(mapping.city, record),
    source: getSourceDisplayValue(mapping.source),
    interest: getMappedValue(mapping.interest, record),
    notes: getMappedValue(mapping.notes, record)
  };

  const issues: string[] = [];
  const name = values.name.trim();
  const email = normalizeEmail(values.email);
  const phone = normalizePhone(values.phone);

  if (!name) {
    issues.push("Nome obrigatório.");
  }

  if (!email && !phone.display) {
    issues.push("Informe email ou telefone.");
  }

  if (values.email.trim() && !email) {
    issues.push("Email inválido.");
  }

  if (values.phone.trim()) {
    const digits = values.phone.replace(/\D/g, "");

    if (digits.length < 8) {
      issues.push("Telefone muito curto.");
    }
  }

  return {
    index: index + 2,
    values,
    issues,
    payload:
      issues.length === 0
        ? {
            name,
            email: email ?? undefined,
            phone: phone.display ?? undefined,
            city: stringOrNull(values.city) ?? undefined,
            source: resolveImportSource(mapping.source),
            interest: stringOrNull(values.interest) ?? undefined,
            notes: stringOrNull(values.notes) ?? undefined,
            stage: "new",
            raw_payload: {
              row_number: String(index + 2),
              ...record
            }
          }
        : null
  };
}

function getMappedValue(mappingValue: string, record: Record<string, string>) {
  if (!mappingValue || mappingValue === FIXED_CSV_SOURCE_VALUE) {
    return "";
  }

  return record[mappingValue]?.trim() ?? "";
}

function getSourceDisplayValue(mappingValue: string) {
  return mappingValue === FIXED_META_SOURCE_VALUE ? "Meta Lead Form" : "CSV importado";
}

function resolveImportSource(mappingValue: string) {
  return mappingValue === FIXED_META_SOURCE_VALUE ? "meta_lead_ads" : "csv_import";
}

function getImportErrorMessage(error?: string) {
  if (!error) {
    return "Nao foi possivel importar esta linha.";
  }

  if (error.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para concluir a importacao.";
  }

  if (error.includes("Supabase nao configurado")) {
    return "Configure o Supabase ou use o modo demonstracao do dashboard.";
  }

  if (error.includes("Conecte uma conta Meta ativa")) {
    return "Conecte uma conta Meta ativa para importar registros com esta origem.";
  }

  return error;
}

function delimiterLabel(delimiter: string) {
  if (delimiter === "\t") {
    return "tab";
  }

  return delimiter === "|" ? "pipe" : delimiter;
}

function buildImportReport(
  fileName: string | null,
  parsedFile: ParsedCsvFile,
  summary: ImportRunSummary
) {
  const sections: string[] = [
    "Relatorio de importacao CSV",
    `Arquivo: ${fileName ?? "CSV"}`,
    `Delimitador: ${delimiterLabel(parsedFile.delimiter)}`,
    summary.batchId ? `Lote: ${summary.batchId}` : null,
    `Criados: ${summary.created}`,
    `Duplicados: ${summary.duplicates.length}`,
    `Ignorados: ${summary.ignored.length}`,
    `Erros: ${summary.errors.length}`,
    ""
  ].filter((line): line is string => line !== null);

  if (summary.duplicates.length > 0) {
    sections.push("Duplicados detectados:");
    summary.duplicates.forEach((item) => {
      sections.push(`- Linha ${item.index}: ${item.reason}`);
    });
    sections.push("");
  }

  if (summary.ignored.length > 0) {
    sections.push("Linhas ignoradas:");
    summary.ignored.forEach((item) => {
      sections.push(`- Linha ${item.index}: ${item.reason}`);
    });
    sections.push("");
  }

  if (summary.errors.length > 0) {
    sections.push("Erros:");
    summary.errors.forEach((item) => {
      sections.push(`- Linha ${item.index}: ${item.reason}`);
    });
    sections.push("");
  }

  return sections.join("\n").trimEnd();
}

function sanitizeReportFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

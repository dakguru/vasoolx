"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/primitives";
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useStore, type ImportRow } from "@/lib/data/store";
import { ALL_LINES } from "@/lib/data/selectors";
import { inr } from "@/lib/format";

// Template column headers (also used to match uploaded columns, case-insensitive).
const HEADERS = [
  "Customer Name",
  "Phone",
  "Area",
  "Address",
  "Loan Amount",
  "Interest Amount",
  "Processing Fees",
  "Installments",
  "Issued Date (YYYY-MM-DD)",
  "Collected So Far",
  "Payment Method (cash/online/bank)",
];

const EXAMPLE = [
  ["Ramesh Kumar", "9840012345", "North Area", "12 Gandhi St", 20000, 2000, 400, 20, "2026-03-01", 8000, "cash"],
  ["Priya S", "9840067890", "Market Street", "", 15000, 1500, 0, 15, "2026-05-15", 3000, "online"],
];

function num(s: string): number {
  const n = Number(String(s).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function normMethod(s: string): ImportRow["method"] {
  const v = s.trim().toLowerCase();
  return v === "online" || v === "bank" ? v : "cash";
}
function toIso(s: string): string {
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(+d) ? "" : d.toISOString();
}

export function ImportSheet({
  open,
  onClose,
  lineId,
  lineName,
}: {
  open: boolean;
  onClose: () => void;
  lineId: string | null | undefined;
  lineName?: string;
}) {
  const { t } = useI18n();
  const { importLoans } = useStore();

  const [rows, setRows] = useState<ImportRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ customers: number; loans: number } | null>(null);

  const canImport = !!lineId && lineId !== ALL_LINES;

  function reset() {
    setRows([]);
    setSkipped(0);
    setFileName("");
    setResult(null);
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...EXAMPLE]);
    ws["!cols"] = HEADERS.map((h) => ({ wch: Math.max(14, h.length + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "vasoolx-import-template.xlsx");
  }

  async function onFile(file: File) {
    setResult(null);
    setFileName(file.name);
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

    const pick = (row: Record<string, unknown>, cands: string[]): string => {
      for (const k of Object.keys(row)) {
        const nk = k.trim().toLowerCase();
        if (cands.some((c) => nk.includes(c))) {
          const v = row[k];
          return v == null ? "" : v instanceof Date ? v.toISOString() : String(v).trim();
        }
      }
      return "";
    };

    const parsed: ImportRow[] = [];
    let skip = 0;
    for (const r of json) {
      const name = pick(r, ["customer name", "name"]);
      if (!name) { skip++; continue; }
      parsed.push({
        name,
        phone: pick(r, ["phone", "mobile"]),
        area: pick(r, ["area"]),
        address: pick(r, ["address"]),
        amount: num(pick(r, ["loan amount", "principal", "amount"])),
        interest: num(pick(r, ["interest"])),
        processing: num(pick(r, ["processing"])),
        installments: num(pick(r, ["installment"])),
        issuedDate: toIso(pick(r, ["issued", "date"])),
        collected: num(pick(r, ["collected"])),
        method: normMethod(pick(r, ["method", "payment"])),
      });
    }
    setRows(parsed);
    setSkipped(skip);
  }

  async function doImport() {
    if (!canImport || !rows.length) return;
    setImporting(true);
    const res = await importLoans(lineId!, rows);
    setImporting(false);
    setResult(res);
    setRows([]);
    setSkipped(0);
  }

  const withLoan = rows.filter((r) => (r.amount ?? 0) > 0).length;

  return (
    <Sheet
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={t("imp.title")}
      footer={
        result ? (
          <Button full size="lg" onClick={() => { reset(); onClose(); }}>{t("common.done")}</Button>
        ) : (
          <Button full size="lg" onClick={doImport} disabled={!canImport || !rows.length || importing}>
            {importing ? t("imp.importing") : t("imp.doImport", { n: rows.length })}
          </Button>
        )
      }
    >
      <p className="text-[13px] text-[color:var(--text-soft)] mb-4">{t("imp.desc")}</p>

      {!canImport && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 bg-[color:var(--warn)]/10 text-[13px] text-[color:var(--text)] mb-4">
          <AlertTriangle size={16} className="text-[color:var(--warn)] mt-0.5 shrink-0" />
          <span>{t("imp.needLine")}</span>
        </div>
      )}

      {result ? (
        <div className="flex flex-col items-center text-center gap-3 py-10">
          <span className="w-14 h-14 rounded-2xl grid place-items-center bg-[color:var(--ok)]/12 text-[color:var(--ok)]"><CheckCircle2 size={28} /></span>
          <div className="text-lg font-bold text-[color:var(--text)]">{t("imp.done", { c: result.customers, l: result.loans })}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Step 1 */}
          <div>
            <div className="text-[13px] font-semibold text-[color:var(--text)] mb-1">{t("imp.step1")}</div>
            <div className="text-[12px] text-[color:var(--text-soft)] mb-2">{t("imp.step1desc")}</div>
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download size={16} /> {t("imp.downloadTemplate")}
            </Button>
          </div>

          {/* Step 2 */}
          <div>
            <div className="text-[13px] font-semibold text-[color:var(--text)] mb-1">{t("imp.step2")}</div>
            {lineName && <div className="text-[12px] text-[color:var(--text-soft)] mb-2">{t("imp.into", { line: lineName })}</div>}
            <label className={`flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed cursor-pointer ${canImport ? "border-[color:var(--brand)]/40 hover:bg-[color:var(--brand)]/5" : "border-[color:var(--line)] opacity-50 pointer-events-none"}`}>
              <Upload size={22} className="text-[color:var(--brand)]" />
              <span className="text-[13px] text-[color:var(--text-soft)]">{fileName || t("imp.chooseFile")}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
              />
            </label>
          </div>

          {/* Preview */}
          {(rows.length > 0 || skipped > 0) && (
            <div className="rounded-2xl border border-[color:var(--line)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[color:var(--surface)] text-[13px]">
                <FileSpreadsheet size={15} className="text-[color:var(--brand)]" />
                <span className="font-semibold text-[color:var(--text)]">{t("imp.ready", { n: rows.length })}</span>
                <span className="text-[color:var(--text-soft)]">· {t("imp.withLoan", { n: withLoan })}</span>
                {skipped > 0 && <span className="ml-auto text-[color:var(--warn)]">{t("imp.skipped", { n: skipped })}</span>}
              </div>
              {rows.length > 0 && (
                <div className="max-h-52 overflow-y-auto divide-y divide-[color:var(--line)]">
                  {rows.slice(0, 20).map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2 text-[13px]">
                      <span className="font-medium text-[color:var(--text)] truncate flex-1">{r.name}</span>
                      <span className="text-[color:var(--text-soft)] tabular">{(r.amount ?? 0) > 0 ? inr(r.amount!) : "—"}</span>
                      <span className="text-[color:var(--ok)] tabular w-20 text-right">{(r.collected ?? 0) > 0 ? inr(r.collected!) : ""}</span>
                    </div>
                  ))}
                  {rows.length > 20 && <div className="px-4 py-2 text-[12px] text-[color:var(--text-faint)]">+{rows.length - 20} more…</div>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

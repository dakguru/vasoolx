"use client";

import { useState } from "react";

import { Panel } from "@/components/ui/erp";
import { toDateInput } from "@/lib/format";
import { daysAgoISO, startOfMonthISO } from "@/lib/report";
import { useI18n } from "@/lib/i18n/provider";

export function DateRangeBar({
  from,
  to,
  setFrom,
  setTo,
}: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
}) {
  const { t } = useI18n();
  const presets = [
    { label: t("rep.last7"), from: daysAgoISO(6) },
    { label: t("rep.last30"), from: daysAgoISO(29) },
    { label: t("rep.thisMonth"), from: startOfMonthISO() },
  ];
  return (
    <Panel className="p-3.5 print:hidden">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-[11px] font-semibold text-[color:var(--text-soft)] uppercase tracking-wide">{t("rep.from")}</label>
          <input
            type="date"
            value={toDateInput(from)}
            onChange={(e) => setFrom(new Date(e.target.value).toISOString())}
            className="field-erp h-9 px-3 text-[13px] block mt-1 tabular"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-[color:var(--text-soft)] uppercase tracking-wide">{t("rep.to")}</label>
          <input
            type="date"
            value={toDateInput(to)}
            onChange={(e) => setTo(new Date(e.target.value).toISOString())}
            className="field-erp h-9 px-3 text-[13px] block mt-1 tabular"
          />
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setFrom(p.from);
                setTo(new Date().toISOString());
              }}
              className="chip"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function StatTile({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: string;
  tone?: "brand" | "success" | "danger" | "ink";
}) {
  const colors: Record<string, string> = {
    brand: "var(--brand)",
    success: "var(--ok)",
    danger: "var(--crit)",
    ink: "var(--text)",
  };
  const c = colors[tone];
  return (
    <div className="panel kpi-accent p-3.5 pl-4" style={{ ["--kpi-color" as string]: c }}>
      <div className="text-[20px] font-extrabold tabular" style={{ color: c }}>{value}</div>
      <div className="text-[12px] text-[color:var(--text-soft)] mt-0.5">{label}</div>
    </div>
  );
}

const PAGE_SIZE = 25;

export function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const paged = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <Panel className="text-center py-10 text-[color:var(--text-soft)]">
        {empty}
      </Panel>
    );
  }
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="dt">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r, ri) => (
              <tr key={ri + page * PAGE_SIZE}>
                {r.map((c, ci) => (
                  <td key={ci} className="whitespace-nowrap">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[color:var(--line)]">
          <span className="text-[12px] text-[color:var(--text-soft)] tabular">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="chip disabled:opacity-40">← Prev</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="chip disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </Panel>
  );
}

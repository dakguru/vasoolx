"use client";

import { useState } from "react";

import { GlassCard } from "@/components/ui/primitives";
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
    <GlassCard className="p-4 print:hidden">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-[color:var(--text-soft)]">{t("rep.from")}</label>
          <input
            type="date"
            value={toDateInput(from)}
            onChange={(e) => setFrom(new Date(e.target.value).toISOString())}
            className="field h-11 px-3 text-[15px] block mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[color:var(--text-soft)]">{t("rep.to")}</label>
          <input
            type="date"
            value={toDateInput(to)}
            onChange={(e) => setTo(new Date(e.target.value).toISOString())}
            className="field h-11 px-3 text-[15px] block mt-1"
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
              className="h-9 px-3 rounded-full glass-strong text-sm font-medium text-[color:var(--text-soft)] hover:brightness-105"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
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
  const tones: Record<string, string> = {
    brand: "text-[color:var(--brand)]",
    success: "text-[color:var(--color-success)]",
    danger: "text-[color:var(--color-danger)]",
    ink: "text-[color:var(--text)]",
  };
  return (
    <GlassCard className="p-4">
      <div className={`text-2xl font-extrabold ${tones[tone]}`}>{value}</div>
      <div className="text-sm text-[color:var(--text-soft)] mt-0.5">{label}</div>
    </GlassCard>
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
      <GlassCard className="text-center py-10 text-[color:var(--text-soft)]">
        {empty}
      </GlassCard>
    );
  }
  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="text-left text-[color:var(--text-soft)] border-b border-[color:var(--glass-border)]">
              {headers.map((h, i) => (
                <th key={i} className="font-semibold px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r, ri) => (
              <tr
                key={ri + page * PAGE_SIZE}
                className="border-b border-[color:var(--glass-border)] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                {r.map((c, ci) => (
                  <td key={ci} className="px-4 py-3 whitespace-nowrap text-[color:var(--text)]">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[color:var(--glass-border)]">
          <span className="text-sm text-[color:var(--text-soft)]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 px-4 rounded-full glass-strong text-sm font-medium disabled:opacity-40 hover:brightness-105"
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 px-4 rounded-full glass-strong text-sm font-medium disabled:opacity-40 hover:brightness-105"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

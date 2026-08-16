"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Layers, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Button, EmptyState } from "@/components/ui/primitives";
import { Panel, PageHead, StatusBadge, Toolbar } from "@/components/ui/erp";
import { LineSheet } from "@/components/sheets/LineSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import type { Line } from "@/lib/data/types";

export default function LinesPage() {
  const { t } = useI18n();
  const { data, deleteLine } = useStore();
  const [sheet, setSheet] = useState(false);
  const [editing, setEditing] = useState<Line | null>(null);

  function openNew() { setEditing(null); setSheet(true); }
  function openEdit(l: Line) { setEditing(l); setSheet(true); }

  const custCount = (lineId: string) => data.customers.filter((c) => c.lineId === lineId).length;
  const activeLoans = (lineId: string) => data.loans.filter((l) => l.lineId === lineId && l.status === "active").length;

  return (
    <>
      <TopBar />
      <PageHead
        title={t("lns.title")}
        subtitle={t("lns.subtitle", { n: data.lines.length })}
        actions={
          <>
            <Link href="/settings" className="chip"><ChevronLeft size={15} /> {t("sb.settings")}</Link>
            <button className="btn-primary h-9 px-3.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5" onClick={openNew}>
              <Plus size={15} /> {t("line.addLine")}
            </button>
          </>
        }
      />

      <main className="px-4 md:px-6 py-4">
        {data.lines.length === 0 ? (
          <Panel className="py-4">
            <EmptyState icon={<Layers size={34} />} title={t("line.manageLines")}
              action={<Button full size="lg" onClick={openNew}>{t("line.addLine")}</Button>} />
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            <Toolbar>
              <span className="text-[13px] font-bold text-[color:var(--text)]">{t("lns.register")}</span>
              <span className="ml-auto text-[12px] text-[color:var(--text-faint)]">{t("lns.linesCount", { n: data.lines.length })}</span>
            </Toolbar>
            <div className="overflow-x-auto">
              <table className="dt">
                <thead>
                  <tr><th>{t("rep.line")}</th><th>{t("fin.thType")}</th><th className="text-right">{t("fld.thCustomers")}</th><th className="text-right">{t("sb.activeLoans")}</th><th className="text-right">{t("lns.thRate")}</th><th></th></tr>
                </thead>
                <tbody>
                  {data.lines.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg grid place-items-center bg-gradient-to-br from-[color:var(--brand)] to-[color:var(--brand-strong)] text-white font-bold text-[12px] shrink-0">{l.name.charAt(0)}</span>
                          <span className="font-semibold text-[color:var(--text)]">{l.name}</span>
                        </div>
                      </td>
                      <td><StatusBadge tone="info" dot={false}>{t(`line.${l.loanType}`)}</StatusBadge></td>
                      <td className="text-right tabular">{custCount(l.id)}</td>
                      <td className="text-right tabular font-semibold">{activeLoans(l.id)}</td>
                      <td className="text-right tabular text-[color:var(--text-soft)]">{l.interestRate}%</td>
                      <td>
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => openEdit(l)} className="w-7 h-7 rounded-md grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)]" aria-label="Edit"><Pencil size={14} /></button>
                          <button onClick={() => {
                            if (confirm(t("lns.deleteConfirm", { name: l.name }))) {
                              const success = deleteLine(l.id);
                              if (!success) alert(t("lns.deleteFail", { name: l.name }));
                            }
                          }} className="w-7 h-7 rounded-md grid place-items-center bg-[color:var(--crit)]/10 text-[color:var(--crit)]" aria-label="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </main>

      <LineSheet open={sheet} onClose={() => setSheet(false)} editing={editing} />
    </>
  );
}

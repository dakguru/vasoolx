"use client";

import { useMemo, useState } from "react";
import { Wallet, Plus, SlidersHorizontal, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import { GlassCard, Button, Segmented, EmptyState } from "@/components/ui/primitives";
import { FinanceSheet } from "@/components/sheets/FinanceSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inr, fmtDate } from "@/lib/format";
import { Pencil, Trash2 } from "lucide-react";
import type { Investment, Expense } from "@/lib/data/types";

type Tab = "investment" | "expense";

export default function FinancePage() {
  const { t } = useI18n();
  const { data, activeLine, deleteInvestment, deleteExpense } = useStore();
  const [tab, setTab] = useState<Tab>("investment");
  const [sheet, setSheet] = useState(false);
  const [editItem, setEditItem] = useState<Investment | Expense | null>(null);

  const items = useMemo(() => {
    if (!activeLine) return [];
    const src = tab === "investment" ? data.investments : data.expenses;
    return src
      .filter((x) => x.lineId === activeLine.id)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [data, activeLine, tab]);

  const total = items.reduce((s, x) => s + x.amount, 0);
  const isInv = tab === "investment";

  return (
    <>
      <PageHeader title={t("nav.finance")} subtitle={activeLine?.name} />

      <main className="px-4 md:px-8 pb-8 space-y-4">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "investment", label: t("fin.investment") },
            { value: "expense", label: t("fin.expense") },
          ]}
        />

        <div className="flex items-center gap-2">
          <GlassCard className="flex-1 py-3 px-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-[color:var(--text-soft)]">
                {isInv ? t("fin.totalInvestment") : t("fin.totalExpense")}
              </div>
              <div className={`text-xl font-extrabold ${isInv ? "text-[color:var(--color-success)]" : "text-[color:var(--color-danger)]"}`}>
                {inr(total)}
              </div>
            </div>
            <div className={`w-11 h-11 rounded-xl grid place-items-center ${isInv ? "bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]" : "bg-[color:var(--color-danger)]/12 text-[color:var(--color-danger)]"}`}>
              {isInv ? <ArrowUpRight /> : <ArrowDownRight />}
            </div>
          </GlassCard>
          <button className="w-12 h-12 rounded-full glass-strong grid place-items-center text-[color:var(--brand)]">
            <SlidersHorizontal size={20} />
          </button>
          <div className="flex gap-2">
            <Button
              className="h-12"
              onClick={() => {
                setEditItem(null);
                setSheet(true);
              }}
            >
              <Plus size={18} /> {t("common.add")}
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<Wallet size={34} />}
            title={isInv ? t("fin.noInvestments") : t("fin.noExpenses")}
            desc={t("fin.noItemsMatch")}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((x) => (
              <GlassCard key={x.id} className="p-4 flex items-center justify-between group">
                <div>
                  <div className="font-bold text-[color:var(--text)]">{x.type}</div>
                  <div className="text-sm text-[color:var(--text-soft)]">
                    {fmtDate(x.date)} · {t(`fin.${x.method}`)}
                    {x.note ? ` · ${x.note}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-lg font-extrabold ${isInv ? "text-[color:var(--color-success)]" : "text-[color:var(--color-danger)]"}`}>
                    {isInv ? "+" : "−"}
                    {inr(x.amount)}
                  </div>
                  <button
                    onClick={() => {
                      setEditItem(x);
                      setSheet(true);
                    }}
                    className="w-8 h-8 rounded-full grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)] opacity-0 group-hover:opacity-100 transition focus:opacity-100"
                    aria-label="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t("common.deleteConfirm") || "Are you sure you want to delete this entry?")) {
                        if (isInv) deleteInvestment(x.id);
                        else deleteExpense(x.id);
                      }
                    }}
                    className="w-8 h-8 rounded-full grid place-items-center bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] opacity-0 group-hover:opacity-100 transition focus:opacity-100"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>

      <FinanceSheet open={sheet} onClose={() => setSheet(false)} kind={tab} editItem={editItem} />
    </>
  );
}

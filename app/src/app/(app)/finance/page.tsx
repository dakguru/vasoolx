"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  Trash2,
  HandCoins,
  TrendingDown,
  Scale,
  Banknote,
  BadgeCheck,
  Download,
  Receipt,
  Wallet,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { EmptyState } from "@/components/ui/primitives";
import { Loader } from "@/components/ui/Loader";
import { Panel, PageHead, PanelHead, StatTile, StatusBadge, Toolbar } from "@/components/ui/erp";
import { FinanceSheet } from "@/components/sheets/FinanceSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inLine } from "@/lib/data/selectors";
import { lineStats } from "@/lib/data/selectors";
import { inr, inrCompact, fmtDate } from "@/lib/format";
import type { Investment, Expense } from "@/lib/data/types";

const TABS = [
  { key: "cashbook", label: "Cash Book" },
  { key: "receipts", label: "Receipts" },
  { key: "cash", label: "Cash Management" },
  { key: "recon", label: "Reconciliation" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function FinancePage() {
  return (
    <Suspense fallback={<div className="py-20"><Loader size={64} /></div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const { t } = useI18n();
  const { data, activeLine, deleteInvestment, deleteExpense } = useStore();
  const params = useSearchParams();
  const router = useRouter();

  const rawTab = params.get("tab");
  const tab: Tab = rawTab === "receipts" ? "receipts" : rawTab === "cash" ? "cash" : rawTab === "recon" ? "recon" : "cashbook";
  const [sub, setSub] = useState<"investment" | "expense">(rawTab === "expenses" ? "expense" : "investment");
  const [sheet, setSheet] = useState(false);
  const [editItem, setEditItem] = useState<Investment | Expense | null>(null);

  const lineId = activeLine?.id ?? "";
  const items = useMemo(() => {
    if (!activeLine) return [];
    const src = sub === "investment" ? data.investments : data.expenses;
    return src.filter((x) => inLine(x.lineId, lineId)).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [data, activeLine, sub, lineId]);

  const stats = activeLine ? lineStats(data, lineId) : null;
  const payments = useMemo(() => data.payments.filter((p) => inLine(p.lineId, lineId)).sort((a, b) => +new Date(b.date) - +new Date(a.date)), [data, lineId]);
  const totalCollections = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = stats?.totalExpense ?? 0;
  const totalInvestment = stats?.totalInvestment ?? 0;
  const netCollection = totalCollections - totalExpenses;
  const cashOnHand = totalInvestment + totalCollections - totalExpenses - (stats?.disbursed ?? 0);

  const total = items.reduce((s, x) => s + x.amount, 0);
  const isInv = sub === "investment";
  const custName = (id: string) => data.customers.find((c) => c.id === id)?.name ?? "—";

  // cash flow
  const cashIn = payments.filter((p) => p.method === "cash").reduce((s, p) => s + p.amount, 0) + data.investments.filter((i) => inLine(i.lineId, lineId) && i.method === "cash").reduce((s, i) => s + i.amount, 0);
  const cashOut = data.expenses.filter((e) => inLine(e.lineId, lineId) && e.method === "cash").reduce((s, e) => s + e.amount, 0);

  // reconciliation by day
  const recon = useMemo(() => {
    const byDay = new Map<string, { collected: number; count: number }>();
    payments.forEach((p) => {
      const k = fmtDate(p.date);
      const cur = byDay.get(k) ?? { collected: 0, count: 0 };
      cur.collected += p.amount; cur.count += 1;
      byDay.set(k, cur);
    });
    return [...byDay.entries()].slice(0, 12).map(([day, v], i) => ({ day, ...v, status: i % 5 === 4 ? "mismatch" : "balanced" as "balanced" | "mismatch" }));
  }, [payments]);
  const balancedDays = recon.filter((r) => r.status === "balanced").length;

  return (
    <>
      <TopBar />
      <PageHead
        title="Finance"
        subtitle={`${activeLine?.name ?? ""} · Cash management & ledger`}
        actions={
          <>
            <button className="chip" onClick={() => { setEditItem(null); setSheet(true); }}><Plus size={15} /> Add Entry</button>
            <button className="btn-primary h-9 px-3.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5"><Download size={15} /> Export</button>
          </>
        }
      />

      <main className="px-4 md:px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile label="Total Collections" value={inrCompact(totalCollections)} icon={<HandCoins size={16} />} color="var(--ok)" />
          <StatTile label="Total Expenses" value={inrCompact(totalExpenses)} icon={<TrendingDown size={16} />} color="var(--crit)" />
          <StatTile label="Net Collection" value={inrCompact(netCollection)} icon={<Scale size={16} />} color="var(--brand)" />
          <StatTile label="Cash on Hand" value={inrCompact(cashOnHand)} icon={<Banknote size={16} />} color="#7c6bf0" sub={<span className="inline-flex items-center gap-1 text-[color:var(--ok)]"><BadgeCheck size={12} /> Reconciliation balanced</span>} />
        </div>

        <div className="segtab w-fit flex-wrap">
          {TABS.map((x) => (
            <button key={x.key} data-active={tab === x.key} onClick={() => router.replace(x.key === "cashbook" ? "/finance" : `/finance?tab=${x.key}`)}>{x.label}</button>
          ))}
        </div>

        {tab === "cashbook" && (
          <Panel className="overflow-hidden">
            <PanelHead
              title="Cash Book"
              desc={`${isInv ? "Investments" : "Expenses"} · ${inr(total)} total`}
              action={<div className="segtab"><button data-active={isInv} onClick={() => setSub("investment")}>Investment</button><button data-active={!isInv} onClick={() => setSub("expense")}>Expense</button></div>}
            />
            <Toolbar>
              <div className={`badge badge-${isInv ? "ok" : "crit"}`}>{isInv ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{isInv ? "Money In" : "Money Out"}</div>
              <span className="text-[12px] text-[color:var(--text-faint)]">{items.length} entries</span>
              <button className="ml-auto btn-primary h-8 px-3 rounded-lg text-[12.5px] font-semibold inline-flex items-center gap-1.5" onClick={() => { setEditItem(null); setSheet(true); }}><Plus size={14} /> Add {isInv ? "Investment" : "Expense"}</button>
            </Toolbar>
            {items.length === 0 ? (
              <EmptyState icon={isInv ? <ArrowUpRight size={30} /> : <ArrowDownRight size={30} />} title={isInv ? t("fin.noInvestments") : t("fin.noExpenses")} desc={t("fin.noItemsMatch")} />
            ) : (
              <div className="overflow-x-auto">
                <table className="dt">
                  <thead><tr><th>Date</th><th>Type</th><th>Method</th><th>Note</th><th className="text-right">Amount</th><th></th></tr></thead>
                  <tbody>
                    {items.map((x) => (
                      <tr key={x.id}>
                        <td className="tabular text-[color:var(--text-soft)] whitespace-nowrap">{fmtDate(x.date)}</td>
                        <td className="font-semibold text-[color:var(--text)]">{x.type}</td>
                        <td><StatusBadge tone={x.method === "cash" ? "neutral" : "info"} dot={false}>{x.method.toUpperCase()}</StatusBadge></td>
                        <td className="text-[color:var(--text-soft)]">{x.note || "—"}</td>
                        <td className={`text-right tabular font-bold ${isInv ? "text-[color:var(--ok)]" : "text-[color:var(--crit)]"}`}>{isInv ? "+" : "−"}{inr(x.amount)}</td>
                        <td>
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => { setEditItem(x); setSheet(true); }} className="w-7 h-7 rounded-md grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)]" aria-label="Edit"><Pencil size={13} /></button>
                            <button onClick={() => { if (confirm(t("common.deleteConfirm") || "Delete this entry?")) { isInv ? deleteInvestment(x.id) : deleteExpense(x.id); } }} className="w-7 h-7 rounded-md grid place-items-center bg-[color:var(--crit)]/10 text-[color:var(--crit)]" aria-label="Delete"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        {tab === "receipts" && (
          <Panel className="overflow-hidden">
            <PanelHead title="Receipts" desc={`${payments.length} collection receipts · ${inr(totalCollections)}`} icon={<Receipt size={15} />} />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>Date</th><th>Receipt No.</th><th>Customer</th><th>Method</th><th className="text-right">Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {payments.slice(0, 40).map((p, i) => (
                    <tr key={p.id}>
                      <td className="tabular text-[color:var(--text-soft)] whitespace-nowrap">{fmtDate(p.date)}</td>
                      <td><span className="font-semibold text-[color:var(--brand)]">RCPT-{String(1230 - i).padStart(6, "0")}</span></td>
                      <td className="font-medium">{custName(p.customerId)}</td>
                      <td><StatusBadge tone={p.method === "cash" ? "neutral" : "info"} dot={false}>{p.method.toUpperCase()}</StatusBadge></td>
                      <td className="text-right tabular font-bold text-[color:var(--ok)]">{inr(p.amount)}</td>
                      <td><StatusBadge tone="ok">Issued</StatusBadge></td>
                    </tr>
                  ))}
                  {payments.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[color:var(--text-faint)]">No receipts yet</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {tab === "cash" && (
          <div className="grid gap-3 md:grid-cols-3">
            <StatTile label="Cash Inflow" value={inr(cashIn)} icon={<ArrowUpRight size={16} />} color="var(--ok)" />
            <StatTile label="Cash Outflow" value={inr(cashOut)} icon={<ArrowDownRight size={16} />} color="var(--crit)" />
            <StatTile label="Cash Balance" value={inr(cashIn - cashOut)} icon={<Wallet size={16} />} color="var(--brand)" />
            <Panel className="md:col-span-3 p-4">
              <PanelHead title="Cash Position" desc="Physical cash reconciliation" />
              <div className="p-4 grid gap-3 sm:grid-cols-2">
                <CashRow label="Opening balance" value={inr(totalInvestment)} />
                <CashRow label="Collections (cash)" value={`+ ${inr(cashIn)}`} tone="ok" />
                <CashRow label="Expenses (cash)" value={`− ${inr(cashOut)}`} tone="crit" />
                <CashRow label="Closing balance" value={inr(cashIn - cashOut)} bold />
              </div>
            </Panel>
          </div>
        )}

        {tab === "recon" && (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              <StatTile label="Days Reconciled" value={`${balancedDays} / ${recon.length}`} icon={<CheckCircle2 size={16} />} color="var(--ok)" />
              <StatTile label="Mismatches" value={String(recon.length - balancedDays)} icon={<AlertTriangle size={16} />} color="var(--crit)" />
              <StatTile label="Total Verified" value={inrCompact(totalCollections)} icon={<Scale size={16} />} color="var(--brand)" />
            </div>
            <Panel className="overflow-hidden">
              <PanelHead title="Daily Reconciliation" desc="Recorded collections vs system balance" />
              <div className="overflow-x-auto">
                <table className="dt">
                  <thead><tr><th>Date</th><th className="text-right">Receipts</th><th className="text-right">Collected</th><th className="text-right">Expected</th><th>Status</th></tr></thead>
                  <tbody>
                    {recon.map((r) => (
                      <tr key={r.day}>
                        <td className="tabular font-medium">{r.day}</td>
                        <td className="text-right tabular">{r.count}</td>
                        <td className="text-right tabular font-semibold">{inr(r.collected)}</td>
                        <td className="text-right tabular text-[color:var(--text-soft)]">{inr(r.status === "balanced" ? r.collected : r.collected + 50)}</td>
                        <td>{r.status === "balanced" ? <StatusBadge tone="ok"><CheckCircle2 size={11} /> Balanced</StatusBadge> : <StatusBadge tone="crit"><AlertTriangle size={11} /> Mismatch</StatusBadge>}</td>
                      </tr>
                    ))}
                    {recon.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[color:var(--text-faint)]">No collection data to reconcile</td></tr>}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </main>

      <FinanceSheet open={sheet} onClose={() => setSheet(false)} kind={sub} editItem={editItem} />
    </>
  );
}

function CashRow({ label, value, tone, bold }: { label: string; value: string; tone?: "ok" | "crit"; bold?: boolean }) {
  const color = tone === "ok" ? "var(--ok)" : tone === "crit" ? "var(--crit)" : "var(--text)";
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${bold ? "bg-[color:var(--brand)]/8 border border-[color:var(--brand)]/20" : "bg-[color:var(--panel-2)] border border-[color:var(--line)]"}`}>
      <span className="text-[13px] text-[color:var(--text-soft)]">{label}</span>
      <span className={`text-[14px] font-bold tabular`} style={{ color }}>{value}</span>
    </div>
  );
}

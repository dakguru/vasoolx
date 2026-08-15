"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Landmark,
  ListChecks,
  CalendarRange,
  BookOpen,
  Download,
  Check,
  X,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Loader } from "@/components/ui/Loader";
import { Panel, PageHead, PanelHead, StatTile, StatusBadge, ProgressBar } from "@/components/ui/erp";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inLine } from "@/lib/data/selectors";
import {
  loanPaid,
  loanOutstanding,
  loanTotalDue,
  loanSchedule,
  areaName,
} from "@/lib/data/selectors";
import { inr, inrCompact, fmtDate } from "@/lib/format";

const VIEWS = [
  { key: "active", label: "Active Loans", Icon: Landmark },
  { key: "installments", label: "Installments", Icon: ListChecks },
  { key: "schedule", label: "Payment Schedule", Icon: CalendarRange },
  { key: "register", label: "Loan Register", Icon: BookOpen },
] as const;
type View = (typeof VIEWS)[number]["key"];

export default function LoansPage() {
  return (
    <Suspense fallback={<div className="py-20"><Loader size={64} /></div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const { data, activeLine } = useStore();
  const { t } = useI18n();

  const view = (VIEWS.find((v) => v.key === params.get("view"))?.key ?? "active") as View;
  const lineId = activeLine?.id ?? "";

  const loans = useMemo(() => data.loans.filter((l) => inLine(l.lineId, lineId)), [data, lineId]);
  const active = loans.filter((l) => l.status === "active");
  const custName = (id: string) => data.customers.find((c) => c.id === id)?.name ?? "—";
  const custArea = (id: string) => areaName(data, data.customers.find((c) => c.id === id)?.areaId ?? null) ?? "—";

  const disbursed = loans.reduce((s, l) => s + l.disbursed, 0);
  const outstanding = active.reduce((s, l) => s + loanOutstanding(data, l), 0);
  const collected = loans.reduce((s, l) => s + loanPaid(data, l.id), 0);

  // upcoming installments (next unpaid per loan), sorted by due date
  const upcoming = useMemo(() => {
    const rows = active.map((l) => {
      const sched = loanSchedule(data, l);
      const next = sched.find((s) => s.status !== "paid");
      return next ? { loan: l, next } : null;
    }).filter(Boolean) as { loan: (typeof active)[number]; next: ReturnType<typeof loanSchedule>[number] }[];
    return rows.sort((a, b) => +new Date(a.next.dueDate) - +new Date(b.next.dueDate));
  }, [active, data]);

  return (
    <>
      <TopBar />
      <PageHead
        title="Loans & Accounts"
        subtitle={`${activeLine?.name ?? ""} · ${active.length} active loans`}
        actions={<button className="chip"><Download size={15} /> Export</button>}
      />

      <main className="px-4 md:px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile label="Active Loans" value={String(active.length)} icon={<Landmark size={16} />} color="var(--brand)" />
          <StatTile label="Total Disbursed" value={inrCompact(disbursed)} icon={<BookOpen size={16} />} color="#7c6bf0" />
          <StatTile label="Total Collected" value={inrCompact(collected)} icon={<Check size={16} />} color="var(--ok)" />
          <StatTile label="Outstanding" value={inrCompact(outstanding)} icon={<CalendarRange size={16} />} color="var(--warn)" />
        </div>

        <div className="segtab w-fit flex-wrap">
          {VIEWS.map((v) => (
            <button key={v.key} data-active={view === v.key} onClick={() => router.replace(`/loans?view=${v.key}`)}>{v.label}</button>
          ))}
        </div>

        {(view === "active" || view === "register") && (
          <Panel className="overflow-hidden">
            <PanelHead
              title={view === "active" ? "Active Loans" : "Loan Register"}
              desc={view === "active" ? `${active.length} loans currently active` : `${loans.length} total loans (all statuses)`}
            />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>Customer</th><th>Area</th><th>Type</th><th className="text-right">Principal</th><th className="text-right">Disbursed</th><th className="text-right">Outstanding</th><th>Status</th></tr></thead>
                <tbody>
                  {(view === "active" ? active : loans).map((l) => (
                    <tr key={l.id} className="cursor-pointer" onClick={() => router.push(`/customers/${l.customerId}`)}>
                      <td><div className="flex items-center gap-2.5"><span className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold text-[11px] shrink-0">{custName(l.customerId).charAt(0).toUpperCase()}</span><span className="font-semibold">{custName(l.customerId)}</span></div></td>
                      <td className="text-[color:var(--text-soft)]">{custArea(l.customerId)}</td>
                      <td><StatusBadge tone="info" dot={false}>{t(`line.${l.type}`)}</StatusBadge></td>
                      <td className="text-right tabular">{inr(l.principal)}</td>
                      <td className="text-right tabular text-[color:var(--text-soft)]">{inr(l.disbursed)}</td>
                      <td className="text-right tabular font-bold">{inr(loanOutstanding(data, l))}</td>
                      <td><StatusBadge tone={l.status === "bad" ? "crit" : l.status === "closed" ? "neutral" : "ok"}>{l.status === "bad" ? "Overdue" : l.status === "closed" ? "Closed" : "Active"}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {view === "installments" && (
          <Panel className="overflow-hidden">
            <PanelHead title="Installment Tracking" desc={`${active.length} active loans`} />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>Customer</th><th className="text-right">Installment</th><th className="text-right">Paid / Total</th><th>Progress</th><th className="text-right">Next Due</th></tr></thead>
                <tbody>
                  {active.map((l) => {
                    const sched = loanSchedule(data, l);
                    const paidCount = sched.filter((s) => s.status === "paid").length;
                    const next = sched.find((s) => s.status !== "paid");
                    const pct = sched.length ? paidCount / sched.length : 0;
                    return (
                      <tr key={l.id} className="cursor-pointer" onClick={() => router.push(`/customers/${l.customerId}`)}>
                        <td className="font-semibold">{custName(l.customerId)}</td>
                        <td className="text-right tabular">{inr(l.installmentAmount)} × {l.installments}</td>
                        <td className="text-right tabular">{paidCount} / {l.installments}</td>
                        <td><div className="flex items-center gap-2"><div className="w-20"><ProgressBar value={pct} color={pct >= 0.99 ? "var(--ok)" : "var(--brand)"} /></div><span className="text-[11px] tabular w-8">{Math.round(pct * 100)}%</span></div></td>
                        <td className="text-right tabular text-[color:var(--text-soft)]">{next ? fmtDate(next.dueDate) : "Completed"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {view === "schedule" && (
          <Panel className="overflow-hidden">
            <PanelHead title="Upcoming Payment Schedule" desc={`${upcoming.length} installments due next`} />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>Due Date</th><th>Customer</th><th>Area</th><th className="text-right">Installment #</th><th className="text-right">Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {upcoming.map(({ loan, next }) => {
                    const overdue = +new Date(next.dueDate) < Date.now();
                    return (
                      <tr key={loan.id} className="cursor-pointer" onClick={() => router.push(`/customers/${loan.customerId}`)}>
                        <td className="tabular font-medium">{fmtDate(next.dueDate)}</td>
                        <td className="font-semibold">{custName(loan.customerId)}</td>
                        <td className="text-[color:var(--text-soft)]">{custArea(loan.customerId)}</td>
                        <td className="text-right tabular">#{next.index} of {loan.installments}</td>
                        <td className="text-right tabular font-bold">{inr(next.amount - next.paidAmount)}</td>
                        <td>{overdue ? <StatusBadge tone="crit"><X size={11} /> Overdue</StatusBadge> : <StatusBadge tone="warn">Due</StatusBadge>}</td>
                      </tr>
                    );
                  })}
                  {upcoming.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[color:var(--text-faint)]">No upcoming installments</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </main>
    </>
  );
}

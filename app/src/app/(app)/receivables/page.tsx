"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  CalendarClock,
  AlertTriangle,
  PieChart,
  Undo2,
  Download,
  Phone,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Loader } from "@/components/ui/Loader";
import { Panel, PageHead, PanelHead, StatTile, StatusBadge, ProgressBar, BarList } from "@/components/ui/erp";
import { SegmentDonut } from "@/components/ui/erpcharts";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inLine } from "@/lib/data/selectors";
import {
  loanPaid,
  loanOutstanding,
  loanTotalDue,
  loanSchedule,
  agingBuckets,
  dueToday,
  areaName,
} from "@/lib/data/selectors";
import { inr, inrCompact, fmtDate } from "@/lib/format";

const VIEWS = [
  { key: "outstanding", label: "Outstanding", Icon: Wallet },
  { key: "due", label: "Due Today", Icon: CalendarClock },
  { key: "overdue", label: "Overdue", Icon: AlertTriangle },
  { key: "aging", label: "Aging Analysis", Icon: PieChart },
  { key: "recovery", label: "Recovery Tracking", Icon: Undo2 },
] as const;
type View = (typeof VIEWS)[number]["key"];

export default function ReceivablesPage() {
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
  useI18n();

  const view = (VIEWS.find((v) => v.key === params.get("view"))?.key ?? "outstanding") as View;
  const lineId = activeLine?.id ?? "";
  const now = Date.now();

  const activeLoans = useMemo(
    () => data.loans.filter((l) => inLine(l.lineId, lineId) && l.status === "active"),
    [data, lineId]
  );
  const custName = (id: string) => data.customers.find((c) => c.id === id)?.name ?? "—";
  const custArea = (id: string) => areaName(data, data.customers.find((c) => c.id === id)?.areaId ?? null) ?? "—";

  const rows = activeLoans.map((l) => {
    const sched = loanSchedule(data, l);
    const firstUnpaid = sched.find((s) => s.status !== "paid");
    const ageDays = firstUnpaid ? Math.floor((now - +new Date(firstUnpaid.dueDate)) / 86400000) : 0;
    return {
      loan: l,
      name: custName(l.customerId),
      area: custArea(l.customerId),
      outstanding: loanOutstanding(data, l),
      paid: loanPaid(data, l.id),
      total: loanTotalDue(l),
      due: firstUnpaid ? firstUnpaid.amount - firstUnpaid.paidAmount : 0,
      dueDate: firstUnpaid?.dueDate,
      ageDays,
    };
  });

  const outstandingRows = rows.filter((r) => r.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding);
  const dueRows = rows.filter((r) => r.dueDate && +new Date(r.dueDate) <= now && r.due > 0);
  const overdueRows = rows.filter((r) => r.ageDays > (r.loan.badLoanDays || 1)).sort((a, b) => b.ageDays - a.ageDays);
  const badLoans = data.loans.filter((l) => inLine(l.lineId, lineId) && l.status === "bad");

  const aging = agingBuckets(data, lineId);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const dueTotal = dueToday(data, lineId);

  const agingSegs = [
    { label: "Current", value: aging.current, color: "var(--ok)" },
    { label: "1 – 30 Days", value: aging.d1_30, color: "var(--brand)" },
    { label: "31 – 60 Days", value: aging.d31_60, color: "var(--warn)" },
    { label: "61 – 90 Days", value: aging.d61_90, color: "#f97316" },
    { label: "90+ Days", value: aging.d90p, color: "var(--crit)" },
  ];
  const agingTotal = Math.max(1, aging.total);

  return (
    <>
      <TopBar />
      <PageHead
        title="Receivables"
        subtitle={`${activeLine?.name ?? ""} · ${inr(totalOutstanding)} outstanding`}
        actions={<button className="chip"><Download size={15} /> Export</button>}
      />

      <main className="px-4 md:px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile label="Total Outstanding" value={inrCompact(totalOutstanding)} icon={<Wallet size={16} />} color="var(--brand)" />
          <StatTile label="Due Today" value={inrCompact(dueTotal)} icon={<CalendarClock size={16} />} color="var(--warn)" />
          <StatTile label="Overdue Accounts" value={String(overdueRows.length)} icon={<AlertTriangle size={16} />} color="var(--crit)" />
          <StatTile label="90+ Days" value={inrCompact(aging.d90p)} icon={<PieChart size={16} />} color="#f97316" />
        </div>

        <div className="segtab w-fit flex-wrap">
          {VIEWS.map((v) => (
            <button key={v.key} data-active={view === v.key} onClick={() => router.replace(`/receivables?view=${v.key}`)}>
              {v.label}
            </button>
          ))}
        </div>

        {view === "aging" ? (
          <Panel>
            <PanelHead title="Outstanding Aging Analysis" desc="Distribution of receivables by age bucket" />
            <div className="p-4 grid gap-6 md:grid-cols-[auto_1fr] items-center">
              <SegmentDonut segments={agingSegs} centerTop={inrCompact(aging.total)} centerSub="Total Outstanding" size={180} />
              <div className="space-y-3">
                {agingSegs.map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1 text-[13px]">
                      <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: s.color }} /> {s.label}</span>
                      <span className="tabular"><b>{inr(s.value)}</b> · {Math.round((s.value / agingTotal) * 100)}%</span>
                    </div>
                    <ProgressBar value={s.value / agingTotal} color={s.color} />
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        ) : view === "recovery" ? (
          <Panel className="overflow-hidden">
            <PanelHead title="Recovery Tracking" desc={`${badLoans.length} accounts under recovery`} />
            {badLoans.length === 0 ? (
              <Empty label="No accounts under recovery. All loans are healthy." />
            ) : (
              <TableWrap headers={["Customer", "Area", "Total Due", "Recovered", "Balance", "Recovery"]}>
                {badLoans.map((l) => {
                  const paid = loanPaid(data, l.id);
                  const total = loanTotalDue(l);
                  const out = loanOutstanding(data, l);
                  const pct = total ? paid / total : 0;
                  return (
                    <tr key={l.id}>
                      <NameCell name={custName(l.customerId)} />
                      <td className="text-[color:var(--text-soft)]">{custArea(l.customerId)}</td>
                      <td className="text-right tabular">{inr(total)}</td>
                      <td className="text-right tabular text-[color:var(--ok)]">{inr(paid)}</td>
                      <td className="text-right tabular font-bold text-[color:var(--crit)]">{inr(out)}</td>
                      <td><div className="flex items-center gap-2"><div className="w-16"><ProgressBar value={pct} color="var(--crit)" /></div><span className="text-[11px] tabular w-8">{Math.round(pct * 100)}%</span></div></td>
                    </tr>
                  );
                })}
              </TableWrap>
            )}
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            <PanelHead
              title={VIEWS.find((v) => v.key === view)!.label}
              desc={
                view === "outstanding" ? `${outstandingRows.length} active accounts with balance`
                : view === "due" ? `${dueRows.length} installments due`
                : `${overdueRows.length} overdue accounts`
              }
            />
            {(view === "outstanding" ? outstandingRows : view === "due" ? dueRows : overdueRows).length === 0 ? (
              <Empty label="Nothing to show here." />
            ) : (
              <TableWrap
                headers={
                  view === "outstanding" ? ["Customer", "Area", "Principal", "Paid", "Outstanding", "Progress"]
                  : view === "due" ? ["Customer", "Area", "Due Date", "Installment", "Action"]
                  : ["Customer", "Area", "Outstanding", "Days Overdue", "Status"]
                }
              >
                {view === "outstanding" && outstandingRows.map((r) => {
                  const pct = r.total ? r.paid / r.total : 0;
                  return (
                    <tr key={r.loan.id} className="cursor-pointer" onClick={() => router.push(`/customers/${r.loan.customerId}`)}>
                      <NameCell name={r.name} />
                      <td className="text-[color:var(--text-soft)]">{r.area}</td>
                      <td className="text-right tabular">{inr(r.loan.principal)}</td>
                      <td className="text-right tabular text-[color:var(--ok)]">{inr(r.paid)}</td>
                      <td className="text-right tabular font-bold">{inr(r.outstanding)}</td>
                      <td><div className="flex items-center gap-2"><div className="w-16"><ProgressBar value={pct} /></div><span className="text-[11px] tabular w-8">{Math.round(pct * 100)}%</span></div></td>
                    </tr>
                  );
                })}
                {view === "due" && dueRows.map((r) => (
                  <tr key={r.loan.id}>
                    <NameCell name={r.name} />
                    <td className="text-[color:var(--text-soft)]">{r.area}</td>
                    <td className="tabular text-[color:var(--text-soft)]">{r.dueDate ? fmtDate(r.dueDate) : "—"}</td>
                    <td className="text-right tabular font-bold">{inr(r.due)}</td>
                    <td><Link href={`/collect?mode=instant`} className="badge badge-info">Collect</Link></td>
                  </tr>
                ))}
                {view === "overdue" && overdueRows.map((r) => (
                  <tr key={r.loan.id} className="cursor-pointer" onClick={() => router.push(`/customers/${r.loan.customerId}`)}>
                    <NameCell name={r.name} />
                    <td className="text-[color:var(--text-soft)]">{r.area}</td>
                    <td className="text-right tabular font-bold text-[color:var(--crit)]">{inr(r.outstanding)}</td>
                    <td className="text-right tabular">{r.ageDays} days</td>
                    <td><StatusBadge tone={r.ageDays > 60 ? "crit" : "warn"}>{r.ageDays > 60 ? "Critical" : "Overdue"}</StatusBadge></td>
                  </tr>
                ))}
              </TableWrap>
            )}
          </Panel>
        )}
      </main>
    </>
  );
}

function TableWrap({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="dt">
        <thead><tr>{headers.map((h, i) => <th key={i} className={i >= 2 && i < headers.length - 1 ? "text-right" : ""}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function NameCell({ name }: { name: string }) {
  return (
    <td>
      <div className="flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold text-[11px] shrink-0">{name.charAt(0).toUpperCase()}</span>
        <span className="font-semibold text-[color:var(--text)]">{name}</span>
      </div>
    </td>
  );
}
function Empty({ label }: { label: string }) {
  return <div className="px-4 py-12 text-center text-[13px] text-[color:var(--text-faint)]">{label}</div>;
}

"use client";

import { Suspense, useMemo, useState } from "react";
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
  Search,
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
import { csvExport } from "@/lib/report";

const VIEWS = [
  { key: "outstanding", labelKey: "sb.outstanding", Icon: Wallet },
  { key: "due", labelKey: "sb.dueToday", Icon: CalendarClock },
  { key: "overdue", labelKey: "sb.overdue", Icon: AlertTriangle },
  { key: "aging", labelKey: "sb.agingAnalysis", Icon: PieChart },
  { key: "recovery", labelKey: "sb.recoveryTracking", Icon: Undo2 },
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
  const { t } = useI18n();

  const view = (VIEWS.find((v) => v.key === params.get("view"))?.key ?? "outstanding") as View;
  const lineId = activeLine?.id ?? "";
  const now = Date.now();

  const [q, setQ] = useState("");
  const [filterAreaId, setFilterAreaId] = useState("");

  const areas = data.areas.filter((a) => inLine(a.lineId, lineId));

  const activeLoans = useMemo(
    () => data.loans.filter((l) => {
      if (!inLine(l.lineId, lineId) || l.status !== "active") return false;
      const cust = data.customers.find((c) => c.id === l.customerId);
      if (!cust) return false;
      if (q && !cust.name.toLowerCase().includes(q.toLowerCase()) && !cust.phone.includes(q)) return false;
      if (filterAreaId && cust.areaId !== filterAreaId) return false;
      return true;
    }),
    [data, lineId, q, filterAreaId]
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

  function exportCsv() {
    if (view === "recovery") {
      csvExport("vasoolx-recovery", ["Customer", "Area", "Total due", "Recovered", "Balance"],
        badLoans.map((l) => [custName(l.customerId), custArea(l.customerId), loanTotalDue(l), loanPaid(data, l.id), loanOutstanding(data, l)]));
      return;
    }
    if (view === "aging") {
      csvExport("vasoolx-aging", ["Bucket", "Amount"], [
        ["Current", aging.current], ["1–30 days", aging.d1_30], ["31–60 days", aging.d31_60],
        ["61–90 days", aging.d61_90], ["90+ days", aging.d90p], ["Total", aging.total],
      ]);
      return;
    }
    const src = view === "due" ? dueRows : view === "overdue" ? overdueRows : outstandingRows;
    csvExport(`vasoolx-receivables-${view}`, ["Customer", "Area", "Principal", "Paid", "Outstanding", "Due", "Due date", "Days overdue"],
      src.map((r) => [r.name, r.area, r.loan.principal, r.paid, r.outstanding, r.due, r.dueDate ? fmtDate(r.dueDate) : "—", r.ageDays]));
  }

  const agingSegs = [
    { label: t("dash.agingCurrent"), value: aging.current, color: "var(--ok)" },
    { label: t("dash.aging1_30"), value: aging.d1_30, color: "var(--brand)" },
    { label: t("dash.aging31_60"), value: aging.d31_60, color: "var(--warn)" },
    { label: t("dash.aging61_90"), value: aging.d61_90, color: "#f97316" },
    { label: t("dash.aging90p"), value: aging.d90p, color: "var(--crit)" },
  ];
  const agingTotal = Math.max(1, aging.total);

  return (
    <>
      <TopBar />
      <PageHead
        title={t("sb.receivables")}
        subtitle={`${activeLine?.name ?? ""} · ${t("rec.subtitle", { amount: inr(totalOutstanding) })}`}
        actions={<button className="chip" onClick={exportCsv}><Download size={15} /> {t("common.export")}</button>}
      />

      <main className="px-4 md:px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile label={t("dash.totalOutstanding")} value={inrCompact(totalOutstanding)} icon={<Wallet size={16} />} color="var(--brand)" />
          <StatTile label={t("sb.dueToday")} value={inrCompact(dueTotal)} icon={<CalendarClock size={16} />} color="var(--warn)" />
          <StatTile label={t("rec.overdueAccounts")} value={String(overdueRows.length)} icon={<AlertTriangle size={16} />} color="var(--crit)" />
          <StatTile label={t("dash.aging90p")} value={inrCompact(aging.d90p)} icon={<PieChart size={16} />} color="#f97316" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("dash.searchCustomer")} className="field-erp w-full h-9 pl-9 pr-3 text-[13px]" />
          </div>
          <select value={filterAreaId} onChange={(e) => setFilterAreaId(e.target.value)} className="field-erp h-9 px-2.5 text-[13px] appearance-none cursor-pointer min-w-40">
            <option value="">{t("dash.allAreas")}</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="segtab w-fit flex-wrap">
          {VIEWS.map((v) => (
            <button key={v.key} data-active={view === v.key} onClick={() => router.replace(`/receivables?view=${v.key}`)}>
              {t(v.labelKey)}
            </button>
          ))}
        </div>

        {view === "aging" ? (
          <Panel>
            <PanelHead title={t("rec.agingTitle")} desc={t("rec.agingDesc")} />
            <div className="p-4 grid gap-6 md:grid-cols-[auto_1fr] items-center">
              <SegmentDonut segments={agingSegs} centerTop={inrCompact(aging.total)} centerSub={t("dash.totalOutstanding")} size={180} />
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
            <PanelHead title={t("sb.recoveryTracking")} desc={t("rec.recoveryDesc", { n: badLoans.length })} />
            {badLoans.length === 0 ? (
              <Empty label={t("rec.noRecovery")} />
            ) : (
              <TableWrap headers={[t("dash.customer"), t("dash.area"), t("rec.thTotalDue"), t("rec.thRecovered"), t("rec.thBalance"), t("rec.thRecovery")]}>
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
              title={t(VIEWS.find((v) => v.key === view)!.labelKey)}
              desc={
                view === "outstanding" ? t("rec.outstandingDesc", { n: outstandingRows.length })
                : view === "due" ? t("rec.dueDesc", { n: dueRows.length })
                : t("rec.overdueDesc", { n: overdueRows.length })
              }
            />
            {(view === "outstanding" ? outstandingRows : view === "due" ? dueRows : overdueRows).length === 0 ? (
              <Empty label={t("rec.nothingToShow")} />
            ) : (
              <TableWrap
                headers={
                  view === "outstanding" ? [t("dash.customer"), t("dash.area"), t("rec.thPrincipal"), t("cust.thPaid"), t("dash.outstanding"), t("rec.thProgress")]
                  : view === "due" ? [t("dash.customer"), t("dash.area"), t("rec.thDueDate"), t("rec.thInstallment"), t("col.action")]
                  : [t("dash.customer"), t("dash.area"), t("dash.outstanding"), t("rec.thDaysOverdue"), t("dash.thStatus")]
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
                    <td><Link href={`/collect?mode=instant`} className="badge badge-info">{t("col.collect")}</Link></td>
                  </tr>
                ))}
                {view === "overdue" && overdueRows.map((r) => (
                  <tr key={r.loan.id} className="cursor-pointer" onClick={() => router.push(`/customers/${r.loan.customerId}`)}>
                    <NameCell name={r.name} />
                    <td className="text-[color:var(--text-soft)]">{r.area}</td>
                    <td className="text-right tabular font-bold text-[color:var(--crit)]">{inr(r.outstanding)}</td>
                    <td className="text-right tabular">{t("rec.daysOverdue", { n: r.ageDays })}</td>
                    <td><StatusBadge tone={r.ageDays > 60 ? "crit" : "warn"}>{r.ageDays > 60 ? t("rec.critical") : t("common.overdue")}</StatusBadge></td>
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

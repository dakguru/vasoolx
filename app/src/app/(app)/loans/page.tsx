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
import { csvExport } from "@/lib/report";

const VIEWS = [
  { key: "active", labelKey: "sb.activeLoans", Icon: Landmark },
  { key: "installments", labelKey: "sb.installments", Icon: ListChecks },
  { key: "schedule", labelKey: "sb.paymentSchedule", Icon: CalendarRange },
  { key: "register", labelKey: "sb.loanRegister", Icon: BookOpen },
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

  function exportCsv() {
    const src = view === "active" ? active : loans;
    csvExport(
      `vasoolx-loans-${view}`,
      ["Customer", "Area", "Type", "Principal", "Disbursed", "Paid", "Outstanding", "Installment", "Installments", "Status"],
      src.map((l) => [
        custName(l.customerId),
        custArea(l.customerId),
        l.type,
        l.principal,
        l.disbursed,
        loanPaid(data, l.id),
        loanOutstanding(data, l),
        l.installmentAmount,
        l.installments,
        l.status,
      ])
    );
  }

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
        title={t("sb.loans")}
        subtitle={`${activeLine?.name ?? ""} · ${t("ln.subtitle", { n: active.length })}`}
        actions={<button className="chip" onClick={exportCsv}><Download size={15} /> {t("common.export")}</button>}
      />

      <main className="px-4 md:px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile label={t("sb.activeLoans")} value={String(active.length)} icon={<Landmark size={16} />} color="var(--brand)" />
          <StatTile label={t("ln.totalDisbursed")} value={inrCompact(disbursed)} icon={<BookOpen size={16} />} color="#7c6bf0" />
          <StatTile label={t("ln.totalCollected")} value={inrCompact(collected)} icon={<Check size={16} />} color="var(--ok)" />
          <StatTile label={t("dash.outstanding")} value={inrCompact(outstanding)} icon={<CalendarRange size={16} />} color="var(--warn)" />
        </div>

        <div className="segtab w-fit flex-wrap">
          {VIEWS.map((v) => (
            <button key={v.key} data-active={view === v.key} onClick={() => router.replace(`/loans?view=${v.key}`)}>{t(v.labelKey)}</button>
          ))}
        </div>

        {(view === "active" || view === "register") && (
          <Panel className="overflow-hidden">
            <PanelHead
              title={view === "active" ? t("sb.activeLoans") : t("sb.loanRegister")}
              desc={view === "active" ? t("ln.activeLoansDesc", { n: active.length }) : t("ln.registerDesc", { n: loans.length })}
            />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>{t("dash.customer")}</th><th>{t("dash.area")}</th><th>{t("fin.thType")}</th><th className="text-right">{t("rec.thPrincipal")}</th><th className="text-right">{t("ln.thDisbursed")}</th><th className="text-right">{t("dash.outstanding")}</th><th>{t("dash.thStatus")}</th></tr></thead>
                <tbody>
                  {(view === "active" ? active : loans).map((l) => (
                    <tr key={l.id} className="cursor-pointer" onClick={() => router.push(`/customers/${l.customerId}`)}>
                      <td><div className="flex items-center gap-2.5"><span className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold text-[11px] shrink-0">{custName(l.customerId).charAt(0).toUpperCase()}</span><span className="font-semibold">{custName(l.customerId)}</span></div></td>
                      <td className="text-[color:var(--text-soft)]">{custArea(l.customerId)}</td>
                      <td><StatusBadge tone="info" dot={false}>{t(`line.${l.type}`)}</StatusBadge></td>
                      <td className="text-right tabular">{inr(l.principal)}</td>
                      <td className="text-right tabular text-[color:var(--text-soft)]">{inr(l.disbursed)}</td>
                      <td className="text-right tabular font-bold">{inr(loanOutstanding(data, l))}</td>
                      <td><StatusBadge tone={l.status === "bad" ? "crit" : l.status === "closed" ? "neutral" : "ok"}>{l.status === "bad" ? t("common.overdue") : l.status === "closed" ? t("common.closed") : t("common.active")}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {view === "installments" && (
          <Panel className="overflow-hidden">
            <PanelHead title={t("ln.installmentTracking")} desc={t("ln.subtitle", { n: active.length })} />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>{t("dash.customer")}</th><th className="text-right">{t("rec.thInstallment")}</th><th className="text-right">{t("ln.thPaidTotal")}</th><th>{t("rec.thProgress")}</th><th className="text-right">{t("col.nextDue")}</th></tr></thead>
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
                        <td className="text-right tabular text-[color:var(--text-soft)]">{next ? fmtDate(next.dueDate) : t("ln.completed")}</td>
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
            <PanelHead title={t("ln.upcomingSchedule")} desc={t("ln.upcomingDesc", { n: upcoming.length })} />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>{t("rec.thDueDate")}</th><th>{t("dash.customer")}</th><th>{t("dash.area")}</th><th className="text-right">{t("ln.thInstallmentNo")}</th><th className="text-right">{t("dash.thAmount")}</th><th>{t("dash.thStatus")}</th></tr></thead>
                <tbody>
                  {upcoming.map(({ loan, next }) => {
                    const overdue = +new Date(next.dueDate) < Date.now();
                    return (
                      <tr key={loan.id} className="cursor-pointer" onClick={() => router.push(`/customers/${loan.customerId}`)}>
                        <td className="tabular font-medium">{fmtDate(next.dueDate)}</td>
                        <td className="font-semibold">{custName(loan.customerId)}</td>
                        <td className="text-[color:var(--text-soft)]">{custArea(loan.customerId)}</td>
                        <td className="text-right tabular">{t("ln.installmentOf", { index: next.index, total: loan.installments })}</td>
                        <td className="text-right tabular font-bold">{inr(next.amount - next.paidAmount)}</td>
                        <td>{overdue ? <StatusBadge tone="crit"><X size={11} /> {t("common.overdue")}</StatusBadge> : <StatusBadge tone="warn">{t("ln.due")}</StatusBadge>}</td>
                      </tr>
                    );
                  })}
                  {upcoming.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[color:var(--text-faint)]">{t("ln.noUpcoming")}</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </main>
    </>
  );
}

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Calculator,
  Plus,
  Check,
  UserPlus,
  FileText,
  CalendarDays,
  ChevronLeft,
  Zap,
  Layers,
  Gauge,
  Clock,
  CalendarRange,
  BadgeCheck,
  ShieldCheck,
  Flag,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { EmptyState } from "@/components/ui/primitives";
import { Panel, PageHead, PanelHead, StatTile, StatusBadge, Toolbar } from "@/components/ui/erp";
import { CustomerSheet } from "@/components/sheets/CustomerSheet";
import { LoanSheet } from "@/components/sheets/LoanSheet";
import { Loader } from "@/components/ui/Loader";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inLine } from "@/lib/data/selectors";
import { customerActiveLoan, loanOutstanding, loanSchedule } from "@/lib/data/selectors";
import { inr, inrCompact, fmtDate, fromDateInput, toDateInput, sameDay } from "@/lib/format";
import type { Customer, Loan, PaymentMethod } from "@/lib/data/types";

const MODTABS = [
  { key: "collect", label: "Collect", href: "/collect", Icon: Gauge },
  { key: "schedule", label: "Schedule", href: "/collect?tab=schedule", Icon: CalendarRange },
  { key: "verify", label: "Verification", href: "/collect?tab=verify", Icon: BadgeCheck },
] as const;

export default function CollectPage() {
  return (
    <Suspense fallback={<div className="py-20"><Loader size={64} /></div>}>
      <CollectInner />
    </Suspense>
  );
}

function CollectInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const { data, activeLine, addPayment } = useStore();

  const view = params.get("tab") === "schedule" ? "schedule" : params.get("tab") === "verify" ? "verify" : "collect";

  const [topTab, setTopTab] = useState<"collect" | "giveloan">("collect");
  const [statusTab, setStatusTab] = useState<"pending" | "paid">("pending");
  const [date, setDate] = useState(params.get("date") || toDateInput(new Date().toISOString()));
  const [areaId, setAreaId] = useState(params.get("area") || "");
  const [q, setQ] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [custSheet, setCustSheet] = useState(false);
  const [loanFor, setLoanFor] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [verified, setVerified] = useState<Record<string, boolean>>({});

  const dateIso = fromDateInput(date);
  const areas = data.areas.filter((a) => inLine(a.lineId, activeLine?.id));
  const areaNm = (id: string | null) => areas.find((a) => a.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    if (!activeLine) return [];
    return data.customers
      .filter((c) => inLine(c.lineId, activeLine?.id) && (!areaId || c.areaId === areaId))
      .filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q))
      .map((c) => ({ c, loan: customerActiveLoan(data, c.id) }))
      .filter((r) => r.loan)
      .map((r) => {
        const loan = r.loan!;
        const paidToday = data.payments
          .filter((p) => p.loanId === loan.id && sameDay(p.date, dateIso))
          .reduce((s, p) => s + p.amount, 0);
        const outstanding = loanOutstanding(data, loan);
        const due = Math.min(loan.installmentAmount, outstanding);
        return { customer: r.c, loan, paidToday, outstanding, due };
      });
  }, [data, activeLine, areaId, q, dateIso]);

  const pending = rows.filter((r) => r.paidToday <= 0 && r.outstanding > 0);
  const paid = rows.filter((r) => r.paidToday > 0);

  useEffect(() => {
    if (params.get("mode") === "instant") {
      setEntries((prev) => {
        const next = { ...prev };
        pending.forEach((r) => { if (next[r.loan.id] === undefined) next[r.loan.id] = String(r.due); });
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listed = statusTab === "pending" ? pending : paid;
  const totalEntered = Object.entries(entries).reduce((s, [, v]) => s + (Number(v) || 0), 0);
  const enteredCount = Object.values(entries).filter((v) => Number(v) > 0).length;

  function setEntry(loanId: string, v: string) {
    setEntries((e) => ({ ...e, [loanId]: v.replace(/[^\d.]/g, "") }));
  }
  function fillDues() {
    const next: Record<string, string> = {};
    pending.forEach((r) => (next[r.loan.id] = String(r.due)));
    setEntries(next);
  }
  function submit() {
    if (!activeLine || totalEntered <= 0) return;
    let n = 0, amt = 0;
    Object.entries(entries).forEach(([loanId, v]) => {
      const amount = Number(v) || 0;
      if (amount <= 0) return;
      const row = rows.find((r) => r.loan.id === loanId);
      if (!row || row.paidToday > 0) return;
      addPayment({ loanId, customerId: row.customer.id, lineId: row.loan.lineId, amount, date: dateIso, method, note: "" });
      n += 1; amt += amount;
    });
    setEntries({});
    setToast(t("col.submitted", { n, amt: inr(amt) }));
    setTimeout(() => setToast(null), 2800);
  }
  function collectRow(loanId: string, due: number, customerId: string) {
    if (!activeLine) return;
    const customAmount = Number(entries[loanId]) || 0;
    const amount = customAmount > 0 ? customAmount : due;
    const ln = data.loans.find((l) => l.id === loanId)?.lineId ?? activeLine.id;
    addPayment({ loanId, customerId, lineId: ln, amount, date: dateIso, method, note: "" });
    setEntries((e) => { const next = { ...e }; delete next[loanId]; return next; });
    setToast(t("col.submitted", { n: 1, amt: inr(amount) }));
    setTimeout(() => setToast(null), 2000);
  }

  const giveLoanList = useMemo(() => {
    if (!activeLine) return [];
    return data.customers
      .filter((c) => inLine(c.lineId, activeLine?.id) && (!areaId || c.areaId === areaId))
      .filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
  }, [data, activeLine, areaId, q]);

  return (
    <>
      <TopBar />
      <PageHead
        title="Collections"
        subtitle={`${activeLine?.name ?? ""} · ${fmtDate(dateIso)}`}
        actions={
          <>
            <Link href="/dashboard" className="chip"><ChevronLeft size={15} /> Dashboard</Link>
            {topTab === "collect" && (
              <button className="chip" onClick={fillDues}><Calculator size={15} /> Fill All Dues</button>
            )}
          </>
        }
      />

      <main className="px-4 md:px-6 py-4 pb-32 space-y-4">
        <div className="segtab w-fit flex-wrap">
          {MODTABS.map((m) => (
            <button key={m.key} data-active={view === m.key} onClick={() => router.replace(m.href)}>{m.label}</button>
          ))}
        </div>

        {view === "collect" && (
        <Panel className="overflow-hidden">
          <Toolbar>
            <label className="chip">
              <CalendarDays size={15} />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent outline-none text-[13px] font-medium tabular w-[108px]" />
            </label>
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="field-erp h-9 px-2.5 text-[13px] appearance-none cursor-pointer min-w-40">
              <option value="">{t("dash.allAreas")}</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div className="relative flex-1 min-w-[160px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("col.search")} className="field-erp w-full h-9 pl-9 pr-3 text-[13px]" />
            </div>
            <div className="segtab ml-auto">
              <button data-active={topTab === "collect"} onClick={() => setTopTab("collect")}>{t("col.collect")}</button>
              <button data-active={topTab === "giveloan"} onClick={() => setTopTab("giveloan")}>{t("col.giveLoan")}</button>
            </div>
          </Toolbar>

          {topTab === "collect" ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[color:var(--line)]">
                {([
                  { key: "pending", label: t("col.pending"), n: pending.length },
                  { key: "paid", label: t("col.paid"), n: paid.length },
                ] as const).map((tb) => {
                  const active = statusTab === tb.key;
                  return (
                    <button key={tb.key} onClick={() => setStatusTab(tb.key)}
                      className={`h-8 px-3 rounded-lg font-semibold text-[13px] flex items-center gap-2 transition ${active ? "btn-primary" : "chip"}`}>
                      {tb.label}
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? "bg-white/25" : "bg-[color:var(--brand)]/12 text-[color:var(--brand)]"}`}>{tb.n}</span>
                    </button>
                  );
                })}
              </div>

              {listed.length === 0 ? (
                <EmptyState icon={<FileText size={30} />} title={t("col.noPending")} desc={t("col.noDues")} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="dt">
                    <thead>
                      <tr>
                        <th className="w-10">{t("col.no")}</th>
                        <th>{t("nav.customers")}</th>
                        <th>Area</th>
                        <th className="text-right">Outstanding</th>
                        <th className="text-right">{t("col.due")}</th>
                        <th className="text-right w-44">{t("col.payToday")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listed.map((r, i) => (
                        <tr key={r.loan.id}>
                          <td className="text-[color:var(--text-faint)] tabular">{i + 1}</td>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold text-[11px] shrink-0">{r.customer.name.charAt(0).toUpperCase()}</span>
                              <div>
                                <div className="font-semibold text-[color:var(--text)]">{r.customer.name}</div>
                                <div className="text-[11px] text-[color:var(--text-faint)]">{r.customer.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-[color:var(--text-soft)]">{areas.find((a) => a.id === r.customer.areaId)?.name ?? "—"}</td>
                          <td className="text-right tabular text-[color:var(--text-soft)]">{inr(r.outstanding)}</td>
                          <td className="text-right tabular font-semibold">{inr(r.due)}</td>
                          <td>
                            {statusTab === "pending" ? (
                              <div className="flex items-center gap-2 justify-end">
                                <input inputMode="decimal" value={entries[r.loan.id] ?? ""} onChange={(e) => setEntry(r.loan.id, e.target.value)} placeholder="0"
                                  className="field-erp h-8 w-24 px-2.5 text-right text-[13px] tabular" />
                                <button onClick={() => collectRow(r.loan.id, r.due, r.customer.id)} className="w-8 h-8 rounded-lg grid place-items-center btn-primary shrink-0" title={t("col.collectRow")}>
                                  <Check size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="text-right font-bold text-[color:var(--ok)] tabular">{inr(r.paidToday)}</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 space-y-3">
              <button onClick={() => setCustSheet(true)} className="btn-primary h-10 px-4 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5">
                <UserPlus size={16} /> {t("col.addCustomers")}
              </button>
              {giveLoanList.length === 0 ? (
                <EmptyState icon={<UserPlus size={30} />} title={t("cust.noCustomers")} desc={t("col.selectCustomer")} />
              ) : (
                <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                  {giveLoanList.map((c) => {
                    const loan = customerActiveLoan(data, c.id);
                    return (
                      <button key={c.id} onClick={() => setLoanFor(c)} className="panel-2 panel-hover rounded-xl p-3 flex items-center gap-3 text-left">
                        <span className="w-10 h-10 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold shrink-0">{c.name.charAt(0).toUpperCase()}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[color:var(--text)] truncate text-[13.5px]">{c.name}</div>
                          <div className="text-[12px] text-[color:var(--text-soft)]">
                            {loan ? `Active · ${inr(loanOutstanding(data, loan))}` : t("cust.noLoan")}
                          </div>
                        </div>
                        <Plus className="text-[color:var(--brand)] shrink-0" size={18} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Panel>
        )}

        {view === "schedule" && <ScheduleView rows={rows} areaNm={areaNm} totalExpected={rows.reduce((s, r) => s + r.due, 0)} />}
        {view === "verify" && (
          <VerifyView paid={paid} areaNm={areaNm} verified={verified} onToggle={(id) => setVerified((v) => ({ ...v, [id]: !v[id] }))} />
        )}
      </main>

      {/* Sticky submit bar (adapts to content width) */}
      {view === "collect" && topTab === "collect" && statusTab === "pending" && (
        <div className="sticky bottom-4 z-30 px-4 md:px-6 mb-4">
          <Panel className="glass-strong flex items-center gap-3 py-2.5 px-4 shadow-[var(--elev-3)]">
            <div className="flex-1">
              <div className="text-[11px] text-[color:var(--text-soft)]">{t("col.totalEntered")} · {enteredCount} selected</div>
              <div className="text-[19px] font-extrabold text-[color:var(--text)] tabular">{inr(totalEntered)}</div>
            </div>
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="field-erp h-9 px-2.5 text-[13px] appearance-none cursor-pointer">
              <option value="cash">{t("fin.cash")}</option>
              <option value="online">{t("fin.online")}</option>
              <option value="bank">{t("fin.bank")}</option>
            </select>
            <button onClick={submit} disabled={totalEntered <= 0} className="btn-primary h-10 px-5 rounded-lg text-[13px] font-semibold disabled:opacity-50">
              {t("col.submit")}
            </button>
          </Panel>
        </div>
      )}

      <CustomerSheet open={custSheet} onClose={() => setCustSheet(false)} />
      {loanFor && <LoanSheet open={!!loanFor} onClose={() => setLoanFor(null)} customer={loanFor} />}

      {toast && (
        <div className="fixed bottom-28 md:bottom-24 inset-x-0 z-50 flex justify-center px-4 animate-float-in">
          <div className="panel glass-strong rounded-full px-5 py-3 font-semibold text-[color:var(--text)] shadow-xl">{toast}</div>
        </div>
      )}
    </>
  );
}

type Row = { customer: Customer; loan: Loan; paidToday: number; outstanding: number; due: number };

/* ---------------- Collection Schedule ---------------- */
function ScheduleView({ rows, areaNm, totalExpected }: { rows: Row[]; areaNm: (id: string | null) => string; totalExpected: number }) {
  const { data } = useStore();
  const sorted = [...rows].sort((a, b) => areaNm(a.customer.areaId).localeCompare(areaNm(b.customer.areaId)) || a.customer.name.localeCompare(b.customer.name));
  const areas = new Set(rows.map((r) => r.customer.areaId));
  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <StatTile label="Scheduled Visits" value={String(rows.length)} icon={<CalendarRange size={16} />} color="var(--brand)" />
        <StatTile label="Expected Collection" value={inrCompact(totalExpected)} icon={<Clock size={16} />} color="var(--warn)" />
        <StatTile label="Routes / Areas" value={String(areas.size)} icon={<ShieldCheck size={16} />} color="#7c6bf0" />
      </div>
      <Panel className="overflow-hidden mt-4">
        <PanelHead title="Today's Collection Schedule" desc={`${rows.length} planned visits`} />
        <div className="overflow-x-auto">
          <table className="dt">
            <thead><tr><th>Customer</th><th>Area / Route</th><th className="text-right">Next Due</th><th className="text-right">Expected</th><th className="text-right">Outstanding</th><th>Status</th></tr></thead>
            <tbody>
              {sorted.map((r) => {
                const sched = loanSchedule(data, r.loan);
                const next = sched.find((s) => s.status !== "paid");
                return (
                  <tr key={r.loan.id}>
                    <td><div className="flex items-center gap-2.5"><span className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold text-[11px] shrink-0">{r.customer.name.charAt(0).toUpperCase()}</span><span className="font-semibold">{r.customer.name}</span></div></td>
                    <td className="text-[color:var(--text-soft)]">{areaNm(r.customer.areaId)}</td>
                    <td className="text-right tabular text-[color:var(--text-soft)]">{next ? fmtDate(next.dueDate) : "—"}</td>
                    <td className="text-right tabular font-semibold">{inr(r.due)}</td>
                    <td className="text-right tabular text-[color:var(--text-soft)]">{inr(r.outstanding)}</td>
                    <td>{r.paidToday > 0 ? <StatusBadge tone="ok">Collected</StatusBadge> : <StatusBadge tone="warn">Scheduled</StatusBadge>}</td>
                  </tr>
                );
              })}
              {sorted.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[color:var(--text-faint)]">No scheduled collections</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/* ---------------- Collection Verification ---------------- */
function VerifyView({ paid, areaNm, verified, onToggle }: { paid: Row[]; areaNm: (id: string | null) => string; verified: Record<string, boolean>; onToggle: (id: string) => void }) {
  const total = paid.reduce((s, r) => s + r.paidToday, 0);
  const verifiedCount = paid.filter((r) => verified[r.loan.id]).length;
  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <StatTile label="Collected Today" value={inrCompact(total)} icon={<BadgeCheck size={16} />} color="var(--ok)" />
        <StatTile label="Verified" value={`${verifiedCount} / ${paid.length}`} icon={<ShieldCheck size={16} />} color="var(--brand)" />
        <StatTile label="Awaiting Review" value={String(paid.length - verifiedCount)} icon={<Clock size={16} />} color="var(--warn)" />
      </div>
      <Panel className="overflow-hidden mt-4">
        <PanelHead title="Collection Verification" desc="Review and approve field collections" />
        {paid.length === 0 ? (
          <EmptyState icon={<BadgeCheck size={30} />} title="Nothing to verify" desc="Collections recorded today will appear here for approval." />
        ) : (
          <div className="overflow-x-auto">
            <table className="dt">
              <thead><tr><th>Customer</th><th>Area</th><th className="text-right">Amount</th><th>Status</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {paid.map((r) => {
                  const ok = !!verified[r.loan.id];
                  return (
                    <tr key={r.loan.id}>
                      <td><div className="flex items-center gap-2.5"><span className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold text-[11px] shrink-0">{r.customer.name.charAt(0).toUpperCase()}</span><span className="font-semibold">{r.customer.name}</span></div></td>
                      <td className="text-[color:var(--text-soft)]">{areaNm(r.customer.areaId)}</td>
                      <td className="text-right tabular font-bold text-[color:var(--ok)]">{inr(r.paidToday)}</td>
                      <td>{ok ? <StatusBadge tone="ok"><ShieldCheck size={11} /> Verified</StatusBadge> : <StatusBadge tone="warn">Pending</StatusBadge>}</td>
                      <td>
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => onToggle(r.loan.id)} className={`h-7 px-2.5 rounded-md text-[11.5px] font-semibold inline-flex items-center gap-1 ${ok ? "chip" : "btn-primary"}`}>
                            <Check size={13} /> {ok ? "Undo" : "Verify"}
                          </button>
                          <button className="w-7 h-7 rounded-md grid place-items-center bg-[color:var(--crit)]/10 text-[color:var(--crit)]" title="Flag"><Flag size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

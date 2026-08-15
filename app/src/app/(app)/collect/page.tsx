"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Calculator,
  Plus,
  Check,
  UserPlus,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import {
  GlassCard,
  Button,
  Input,
  Segmented,
  Select,
  EmptyState,
} from "@/components/ui/primitives";
import { CustomerSheet } from "@/components/sheets/CustomerSheet";
import { LoanSheet } from "@/components/sheets/LoanSheet";
import { Loader } from "@/components/ui/Loader";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { customerActiveLoan, loanOutstanding, loanPaid } from "@/lib/data/selectors";
import { inr, fmtDate, fromDateInput, toDateInput, sameDay } from "@/lib/format";
import type { Customer, PaymentMethod } from "@/lib/data/types";

export default function CollectPage() {
  return (
    <Suspense fallback={<div className="py-20"><Loader size={64} /></div>}>
      <CollectInner />
    </Suspense>
  );
}

function CollectInner() {
  const params = useSearchParams();
  const { t } = useI18n();
  const { data, activeLine, addPayment } = useStore();

  const [topTab, setTopTab] = useState<"collect" | "giveloan">("collect");
  const [statusTab, setStatusTab] = useState<"pending" | "paid">("pending");
  const [date, setDate] = useState(
    params.get("date") || toDateInput(new Date().toISOString())
  );
  const [areaId, setAreaId] = useState(params.get("area") || "");
  const [q, setQ] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [custSheet, setCustSheet] = useState(false);
  const [loanFor, setLoanFor] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dateIso = fromDateInput(date);
  const areas = data.areas.filter((a) => a.lineId === activeLine?.id);

  // active loans in this line, area + search filtered
  const rows = useMemo(() => {
    if (!activeLine) return [];
    return data.customers
      .filter((c) => c.lineId === activeLine.id && (!areaId || c.areaId === areaId))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.phone.includes(q)
      )
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

  // Instant mode: prefill dues on first load
  useEffect(() => {
    if (params.get("mode") === "instant") {
      setEntries((prev) => {
        const next = { ...prev };
        pending.forEach((r) => {
          if (next[r.loan.id] === undefined) next[r.loan.id] = String(r.due);
        });
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listed = statusTab === "pending" ? pending : paid;
  const totalEntered = Object.entries(entries).reduce(
    (s, [, v]) => s + (Number(v) || 0),
    0
  );
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
    let n = 0;
    let amt = 0;
    Object.entries(entries).forEach(([loanId, v]) => {
      const amount = Number(v) || 0;
      if (amount <= 0) return;
      const row = rows.find((r) => r.loan.id === loanId);
      if (!row) return;
      // Skip loans already paid today to prevent duplicates
      if (row.paidToday > 0) return;
      addPayment({
        loanId,
        customerId: row.customer.id,
        lineId: activeLine.id,
        amount,
        date: dateIso,
        method,
        note: "",
      });
      n += 1;
      amt += amount;
    });
    setEntries({});
    setToast(t("col.submitted", { n, amt: inr(amt) }));
    setTimeout(() => setToast(null), 2800);
  }
  function collectRow(loanId: string, due: number, customerId: string) {
    if (!activeLine) return;
    addPayment({ loanId, customerId, lineId: activeLine.id, amount: due, date: dateIso, method, note: "" });
    // Clear this loan's entry to prevent double-collection on Submit
    setEntries((e) => {
      const next = { ...e };
      delete next[loanId];
      return next;
    });
    setToast(t("col.submitted", { n: 1, amt: inr(due) }));
    setTimeout(() => setToast(null), 2000);
  }

  const giveLoanList = useMemo(() => {
    if (!activeLine) return [];
    return data.customers
      .filter((c) => c.lineId === activeLine.id && (!areaId || c.areaId === areaId))
      .filter(
        (c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)
      );
  }, [data, activeLine, areaId, q]);

  return (
    <>
      <PageHeader
        title={activeLine?.name ?? t("col.collect")}
        back="/dashboard"
        action={
          topTab === "collect" ? (
            <Button size="sm" variant="secondary" onClick={fillDues}>
              <Calculator size={16} /> {t("col.fillAll")}
            </Button>
          ) : undefined
        }
      />

      <main className="px-4 md:px-8 pb-40 md:pb-8 space-y-4">
        {/* date + area */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field h-11 px-3 text-[15px]"
          />
          <Select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="!w-auto min-w-44">
            <option value="">{t("dash.allAreas")}</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
          <span className="text-[color:var(--text-soft)] text-sm ml-auto">
            {fmtDate(dateIso)}
          </span>
        </div>

        <Segmented<"collect" | "giveloan">
          value={topTab}
          onChange={setTopTab}
          options={[
            { value: "collect", label: t("col.collect") },
            { value: "giveloan", label: t("col.giveLoan") },
          ]}
        />

        {/* search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("col.search")} className="pl-11" />
          </div>
          <button className="w-12 h-12 rounded-full glass-strong grid place-items-center text-[color:var(--brand)] shrink-0">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {topTab === "collect" ? (
          <>
            {/* status tabs with counts */}
            <div className="flex gap-2">
              {([
                { key: "pending", label: t("col.pending"), n: pending.length },
                { key: "paid", label: t("col.paid"), n: paid.length },
              ] as const).map((tb) => {
                const active = statusTab === tb.key;
                return (
                  <button
                    key={tb.key}
                    onClick={() => setStatusTab(tb.key)}
                    className={`h-10 px-4 rounded-full font-semibold text-[15px] flex items-center gap-2 transition ${
                      active ? "btn-primary" : "glass-strong text-[color:var(--text-soft)]"
                    }`}
                  >
                    {tb.label}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${active ? "bg-white/25" : "bg-[color:var(--brand)]/12 text-[color:var(--brand)]"}`}>
                      {tb.n}
                    </span>
                  </button>
                );
              })}
            </div>

            {listed.length === 0 ? (
              <EmptyState
                icon={<FileText size={34} />}
                title={t("col.noPending")}
                desc={t("col.noDues")}
              />
            ) : (
              <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[15px]">
                    <thead>
                      <tr className="text-left text-[color:var(--text-soft)] border-b border-[color:var(--glass-border)]">
                        <th className="font-semibold px-4 py-3 w-12">{t("col.no")}</th>
                        <th className="font-semibold px-4 py-3">{t("nav.customers")}</th>
                        <th className="font-semibold px-4 py-3 text-right">{t("col.due")}</th>
                        <th className="font-semibold px-4 py-3 text-right w-40">{t("col.payToday")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listed.map((r, i) => (
                        <tr key={r.loan.id} className="border-b border-[color:var(--glass-border)] last:border-0">
                          <td className="px-4 py-3 text-[color:var(--text-faint)]">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[color:var(--text)]">{r.customer.name}</div>
                            <div className="text-xs text-[color:var(--text-faint)]">
                              {r.customer.phone} · {inr(r.outstanding)} {t("dash.statOutstanding").toLowerCase()}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[color:var(--text)]">
                            {inr(r.due)}
                          </td>
                          <td className="px-4 py-3">
                            {statusTab === "pending" ? (
                              <div className="flex items-center gap-2 justify-end">
                                <input
                                  inputMode="decimal"
                                  value={entries[r.loan.id] ?? ""}
                                  onChange={(e) => setEntry(r.loan.id, e.target.value)}
                                  placeholder="0"
                                  className="field h-10 w-24 px-3 text-right text-[15px]"
                                />
                                <button
                                  onClick={() => collectRow(r.loan.id, r.due, r.customer.id)}
                                  className="w-10 h-10 rounded-full grid place-items-center btn-primary shrink-0"
                                  title={t("col.collectRow")}
                                >
                                  <Check size={18} />
                                </button>
                              </div>
                            ) : (
                              <div className="text-right font-bold text-[color:var(--color-success)]">
                                {inr(r.paidToday)}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </>
        ) : (
          /* GIVE LOAN */
          <>
            <Button full size="lg" onClick={() => setCustSheet(true)}>
              <UserPlus size={20} /> {t("col.addCustomers")}
            </Button>
            {giveLoanList.length === 0 ? (
              <EmptyState icon={<UserPlus size={34} />} title={t("cust.noCustomers")} desc={t("col.selectCustomer")} />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {giveLoanList.map((c) => {
                  const loan = customerActiveLoan(data, c.id);
                  return (
                    <button key={c.id} onClick={() => setLoanFor(c)} className="text-left">
                      <GlassCard className="flex items-center gap-3 hover:brightness-105 transition">
                        <div className="w-11 h-11 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[color:var(--text)] truncate">{c.name}</div>
                          <div className="text-sm text-[color:var(--text-soft)]">
                            {loan ? `${t("cust.activeLoan")} · ${inr(loanOutstanding(data, loan))}` : t("cust.noLoan")}
                          </div>
                        </div>
                        <Plus className="text-[color:var(--brand)] shrink-0" />
                      </GlassCard>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Sticky submit bar (collect + pending) */}
      {topTab === "collect" && statusTab === "pending" && (
        <div className="fixed bottom-0 md:bottom-0 inset-x-0 md:left-[264px] z-40 mb-20 md:mb-0">
          <div className="mx-auto max-w-[1400px] px-4 md:px-8 pb-3 md:pb-4">
            <GlassCard className="glass-strong flex items-center gap-3 py-3">
              <div className="flex-1">
                <div className="text-xs text-[color:var(--text-soft)]">
                  {t("col.totalEntered")} · {enteredCount}
                </div>
                <div className="text-xl font-extrabold text-[color:var(--text)]">
                  {inr(totalEntered)}
                </div>
              </div>
              <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="!w-auto min-w-32">
                <option value="cash">{t("fin.cash")}</option>
                <option value="online">{t("fin.online")}</option>
                <option value="bank">{t("fin.bank")}</option>
              </Select>
              <Button onClick={submit} disabled={totalEntered <= 0}>
                {t("col.submit")}
              </Button>
            </GlassCard>
          </div>
        </div>
      )}

      <CustomerSheet open={custSheet} onClose={() => setCustSheet(false)} />
      {loanFor && (
        <LoanSheet open={!!loanFor} onClose={() => setLoanFor(null)} customer={loanFor} />
      )}

      {toast && (
        <div className="fixed bottom-28 md:bottom-24 inset-x-0 z-50 flex justify-center px-4 animate-float-in">
          <div className="glass-strong rounded-full px-5 py-3 font-semibold text-[color:var(--text)] shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </>
  );
}

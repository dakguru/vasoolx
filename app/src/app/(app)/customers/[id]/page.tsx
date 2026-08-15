"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Phone,
  MapPin,
  Pencil,
  Trash2,
  Plus,
  MessageCircle,
  ChevronDown,
  Check,
  X,
  StickyNote,
} from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import { GlassCard, Button } from "@/components/ui/primitives";
import { CustomerSheet } from "@/components/sheets/CustomerSheet";
import { LoanSheet } from "@/components/sheets/LoanSheet";
import { PaymentSheet } from "@/components/sheets/PaymentSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import {
  customerLoans,
  loanPaid,
  loanOutstanding,
  loanTotalDue,
  loanSchedule,
  areaName,
} from "@/lib/data/selectors";
import { inr, fmtDate } from "@/lib/format";
import type { Loan, Payment } from "@/lib/data/types";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const { data, activeLine, deleteCustomer, setLoanStatus, addPayment, deletePayment, deleteLoan } = useStore();

  const [editOpen, setEditOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [paySheet, setPaySheet] = useState<Payment | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const customer = data.customers.find((c) => c.id === id) ?? null;
  const loans = useMemo(() => (customer ? customerLoans(data, customer.id) : []), [data, customer]);

  if (!customer) {
    return (
      <>
        <PageHeader title={t("cust.details")} back="/customers" />
        <main className="px-4 md:px-8 py-16 text-center text-[color:var(--text-soft)]">
          {t("fin.noItemsMatch")}
        </main>
      </>
    );
  }

  const borrowed = loans.reduce((s, l) => s + l.principal, 0);
  const paid = loans.reduce((s, l) => s + loanPaid(data, l.id), 0);
  const outstanding = loans.filter((l) => l.status === "active").reduce((s, l) => s + loanOutstanding(data, l), 0);
  const ar = areaName(data, customer.areaId);

  function remove() {
    if (confirm(t("cust.deleteConfirm"))) {
      const success = deleteCustomer(customer!.id);
      if (success) {
        router.replace("/customers");
      } else {
        alert("Cannot delete this customer — they have active loans. Close all loans first.");
      }
    }
  }

  function remind() {
    const msg = `Hi ${customer!.name}, this is a friendly reminder from ${activeLine?.name}. Your outstanding balance is ${inr(outstanding)}. Kindly pay your due. Thank you.`;
    const phone = customer!.phone ? `91${customer!.phone}` : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function quickCollect(loan: Loan) {
    if (!activeLine) return;
    const due = Math.min(loan.installmentAmount, loanOutstanding(data, loan));
    if (due <= 0) return;
    addPayment({
      loanId: loan.id,
      customerId: customer!.id,
      lineId: activeLine.id,
      amount: due,
      date: new Date().toISOString(),
      method: "cash",
      note: "",
    });
  }

  return (
    <>
      <PageHeader
        title={customer.name}
        back="/customers"
        action={
          <div className="flex gap-2">
            <button onClick={() => setEditOpen(true)} className="w-10 h-10 rounded-full grid place-items-center btn-primary" aria-label={t("common.edit")}>
              <Pencil size={17} />
            </button>
            <button onClick={remove} className="w-10 h-10 rounded-full grid place-items-center bg-[color:var(--color-danger)] text-white" aria-label={t("common.delete")}>
              <Trash2 size={17} />
            </button>
          </div>
        }
      />

      <main className="px-4 md:px-8 pb-8 space-y-5">
        {/* Profile */}
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-extrabold text-2xl shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-[color:var(--text)]">{customer.name}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[color:var(--text-soft)] mt-1">
                {customer.phone && <span className="flex items-center gap-1"><Phone size={14} /> {customer.phone}</span>}
                {ar && <span className="flex items-center gap-1"><MapPin size={14} /> {ar}</span>}
              </div>
            </div>
          </div>
          {(customer.address || customer.notes) && (
            <div className="mt-4 space-y-2 text-sm">
              {customer.address && (
                <div className="flex gap-2 text-[color:var(--text-soft)]"><MapPin size={16} className="shrink-0 mt-0.5" /> {customer.address}</div>
              )}
              {customer.notes && (
                <div className="flex gap-2 text-[color:var(--text-soft)]"><StickyNote size={16} className="shrink-0 mt-0.5" /> {customer.notes}</div>
              )}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button size="sm" full onClick={() => setLoanOpen(true)}><Plus size={16} /> {t("cust.issueLoan")}</Button>
            {customer.phone && (
              <>
                <Button size="sm" variant="secondary" full onClick={() => { window.location.href = `tel:${customer.phone}`; }}><Phone size={16} /> {t("cust.call")}</Button>
                <Button size="sm" variant="outline" full onClick={remind}><MessageCircle size={16} /> {t("cust.remind")}</Button>
              </>
            )}
          </div>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4">
            <div className="text-xl font-extrabold text-[color:var(--text)]">{inr(borrowed)}</div>
            <div className="text-xs text-[color:var(--text-soft)]">{t("cust.borrowed")}</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-xl font-extrabold text-[color:var(--color-success)]">{inr(paid)}</div>
            <div className="text-xs text-[color:var(--text-soft)]">{t("rep.collected")}</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-xl font-extrabold text-[color:var(--brand)]">{inr(outstanding)}</div>
            <div className="text-xs text-[color:var(--text-soft)]">{t("dash.statOutstanding")}</div>
          </GlassCard>
        </div>

        {/* Loans */}
        <div>
          <h3 className="text-lg font-bold text-[color:var(--text)] mb-3">{t("rep.loansCount")}</h3>
          {loans.length === 0 ? (
            <GlassCard className="text-center py-8 text-[color:var(--text-soft)]">{t("cust.noLoans")}</GlassCard>
          ) : (
            <div className="space-y-3">
              {loans.map((loan, li) => {
                const lp = loanPaid(data, loan.id);
                const due = loanTotalDue(loan);
                const out = loanOutstanding(data, loan);
                const pct = due ? Math.min(100, Math.round((lp / due) * 100)) : 0;
                const isOpen = expanded === loan.id;
                const schedule = loanSchedule(data, loan);
                const pays = data.payments.filter((p) => p.loanId === loan.id).sort((a, b) => +new Date(b.date) - +new Date(a.date));
                return (
                  <GlassCard key={loan.id} className="p-0 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[color:var(--text)]">{t("cust.loanNo")} #{loans.length - li}</span>
                          <StatusBadge status={loan.status} t={t} />
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[color:var(--text)]">{inr(out)}</div>
                          <div className="text-xs text-[color:var(--text-faint)]">{t("dash.statOutstanding")}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                        <Meta label="Principal" value={inr(loan.principal)} />
                        <Meta label={t("rep.disbursed")} value={inr(loan.disbursed)} />
                        <Meta label={`${loan.installmentAmount} × ${loan.installments}`} value={t(`line.${loan.type}`)} />
                      </div>
                      <div className="h-2 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden mt-3">
                        <div className="h-full rounded-full bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--color-success)]" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1.5 text-xs text-[color:var(--text-soft)]">
                        <span>{inr(lp)} {t("col.paid").toLowerCase()}</span>
                        <span>{pct}%</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {loan.status === "active" && (
                          <>
                            <Button size="sm" onClick={() => quickCollect(loan)}><Check size={15} /> {t("col.collectRow")} {inr(Math.min(loan.installmentAmount, out))}</Button>
                            <Button size="sm" variant="outline" onClick={() => setLoanStatus(loan.id, "closed")}>{t("cust.closeLoan")}</Button>
                            <Button size="sm" variant="outline" onClick={() => setLoanStatus(loan.id, "bad")}>{t("cust.markBad")}</Button>
                          </>
                        )}
                        {loan.status !== "active" && (
                          <Button size="sm" variant="outline" onClick={() => setLoanStatus(loan.id, "active")}>{t("cust.reopenLoan")}</Button>
                        )}
                        <button
                          onClick={() => {
                            setEditLoan(loan);
                            setLoanOpen(true);
                          }}
                          className="h-8 px-4 rounded-full text-sm font-medium text-[color:var(--brand)] hover:bg-[color:var(--brand)]/10"
                        >
                          {t("loan.edit") || "Edit Loan"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t("common.deleteConfirm") || "Are you sure you want to completely delete this loan and all its payments?")) {
                              deleteLoan(loan.id);
                            }
                          }}
                          className="h-8 px-4 rounded-full text-sm font-medium text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/10"
                        >
                          {t("common.delete") || "Delete"}
                        </button>
                        <button
                          onClick={() => setExpanded(isOpen ? null : loan.id)}
                          className="ml-auto flex items-center gap-1 text-sm font-semibold text-[color:var(--brand)]"
                        >
                          {t("cust.schedule")}
                          <ChevronDown size={16} className={isOpen ? "rotate-180 transition" : "transition"} />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-[color:var(--glass-border)] p-4 bg-black/[0.02] dark:bg-white/[0.02] animate-fade-in">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="font-semibold text-[color:var(--text)] mb-2 text-sm">{t("cust.schedule")}</div>
                            <div className="max-h-64 overflow-y-auto rounded-xl border border-[color:var(--glass-border)]">
                              {schedule.map((s) => (
                                <div key={s.index} className="flex items-center justify-between px-3 py-2 border-b border-[color:var(--glass-border)] last:border-0 text-sm">
                                  <span className="text-[color:var(--text-faint)] w-8">{s.index}</span>
                                  <span className="flex-1 text-[color:var(--text-soft)]">{fmtDate(s.dueDate)}</span>
                                  <span className="font-semibold text-[color:var(--text)] mr-3">{inr(s.amount)}</span>
                                  {s.status === "paid" ? (
                                    <span className="w-5 h-5 rounded-full grid place-items-center bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"><Check size={13} /></span>
                                  ) : s.status === "partial" ? (
                                    <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500 text-[10px] font-bold">
                                      {inr(s.paidAmount)}
                                    </span>
                                  ) : (
                                    <span className="w-5 h-5 rounded-full grid place-items-center bg-[color:var(--text-faint)]/15 text-[color:var(--text-faint)]"><X size={13} /></span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-[color:var(--text)] mb-2 text-sm">{t("cust.payments")}</div>
                            {pays.length === 0 ? (
                              <div className="text-sm text-[color:var(--text-faint)] px-1">{t("fin.noItemsMatch")}</div>
                            ) : (
                              <div className="max-h-64 overflow-y-auto rounded-xl border border-[color:var(--glass-border)]">
                                {pays.map((p) => (
                                  <div key={p.id} className="group flex items-center justify-between px-3 py-2 border-b border-[color:var(--glass-border)] last:border-0 text-sm">
                                    <span className="text-[color:var(--text-soft)]">{fmtDate(p.date)}</span>
                                    <span className="text-[color:var(--text-faint)]">{t(`fin.${p.method}`)}</span>
                                    <div className="text-right whitespace-nowrap text-[color:var(--color-success)] font-bold tabular-nums">
                                      +{inr(p.amount)}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition focus-within:opacity-100 ml-4">
                                      <button
                                        onClick={() => setPaySheet(p)}
                                        className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)] hover:brightness-105"
                                        aria-label="Edit"
                                      >
                                        <Pencil size={13} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm(t("common.deleteConfirm") || "Are you sure?")) {
                                            deletePayment(p.id);
                                          }
                                        }}
                                        className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] hover:brightness-105"
                                        aria-label="Delete"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <CustomerSheet open={editOpen} onClose={() => setEditOpen(false)} editing={customer} />
      <LoanSheet open={loanOpen} onClose={() => setLoanOpen(false)} customer={customer} editLoan={editLoan} />
      <PaymentSheet 
        open={!!paySheet} 
        onClose={() => setPaySheet(null)} 
        payment={paySheet} 
      />
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[color:var(--text-faint)] text-xs">{label}</div>
      <div className="font-semibold text-[color:var(--text)]">{value}</div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: Loan["status"]; t: (k: string) => string }) {
  const map: Record<Loan["status"], { label: string; cls: string }> = {
    active: { label: t("rep.active"), cls: "bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]" },
    closed: { label: t("rep.closed"), cls: "bg-[color:var(--text-faint)]/15 text-[color:var(--text-soft)]" },
    bad: { label: t("rep.bad"), cls: "bg-[color:var(--color-danger)]/12 text-[color:var(--color-danger)]" },
  };
  const s = map[status];
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

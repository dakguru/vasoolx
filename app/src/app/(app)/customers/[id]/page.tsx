"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  ChevronLeft,
  UserRound,
  ShieldCheck,
  Landmark,
  Wallet,
  TrendingUp,
  HandCoins,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { Panel, PanelHead, StatTile, StatusBadge, ProgressBar } from "@/components/ui/erp";
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

type Tab = "overview" | "loans" | "payments" | "activity";

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
  const [tab, setTab] = useState<Tab>("overview");

  const customer = data.customers.find((c) => c.id === id) ?? null;
  const loans = useMemo(() => (customer ? customerLoans(data, customer.id) : []), [data, customer]);

  if (!customer) {
    return (
      <main className="px-4 md:px-6 py-6">
        <Link href="/customers" className="chip mb-4"><ChevronLeft size={15} /> Back to Directory</Link>
        <Panel className="py-16 text-center text-[color:var(--text-soft)]">{t("fin.noItemsMatch")}</Panel>
      </main>
    );
  }

  const borrowed = loans.reduce((s, l) => s + l.principal, 0);
  const paid = loans.reduce((s, l) => s + loanPaid(data, l.id), 0);
  const outstanding = loans.filter((l) => l.status === "active").reduce((s, l) => s + loanOutstanding(data, l), 0);
  const ar = areaName(data, customer.areaId);
  const agent = data.members.find((m) => m.lineId === customer.lineId)?.name ?? "Unassigned";
  const hasBad = loans.some((l) => l.status === "bad");
  const hasActive = loans.some((l) => l.status === "active");
  const custStatus = hasBad ? { tone: "crit" as const, label: "Overdue" } : hasActive ? { tone: "ok" as const, label: "Active" } : { tone: "neutral" as const, label: "Inactive" };
  const allPays = data.payments.filter((p) => p.customerId === customer.id).sort((a, b) => +new Date(b.date) - +new Date(a.date));

  function remove() {
    if (confirm(t("cust.deleteConfirm"))) {
      const success = deleteCustomer(customer!.id);
      if (success) router.replace("/customers");
      else alert("Cannot delete this customer — they have active loans. Close all loans first.");
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
    addPayment({ loanId: loan.id, customerId: customer!.id, lineId: activeLine.id, amount: due, date: new Date().toISOString(), method: "cash", note: "" });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "loans", label: `Loans (${loans.length})` },
    { key: "payments", label: `Payments (${allPays.length})` },
    { key: "activity", label: "Activity" },
  ];

  const LoansList = (
    <div className="space-y-3">
      {loans.length === 0 ? (
        <Panel className="text-center py-10 text-[color:var(--text-soft)]">{t("cust.noLoans")}</Panel>
      ) : loans.map((loan, li) => {
        const lp = loanPaid(data, loan.id);
        const due = loanTotalDue(loan);
        const out = loanOutstanding(data, loan);
        const pct = due ? Math.min(1, lp / due) : 0;
        const isOpen = expanded === loan.id;
        const schedule = loanSchedule(data, loan);
        const pays = data.payments.filter((p) => p.loanId === loan.id).sort((a, b) => +new Date(b.date) - +new Date(a.date));
        return (
          <Panel key={loan.id} className="overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[color:var(--text)]">{t("cust.loanNo")} #{loans.length - li}</span>
                  <StatusBadge tone={loan.status === "bad" ? "crit" : loan.status === "closed" ? "neutral" : "ok"}>
                    {loan.status === "bad" ? "Overdue" : loan.status === "closed" ? "Closed" : "Active"}
                  </StatusBadge>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[color:var(--text)] tabular">{inr(out)}</div>
                  <div className="text-[11px] text-[color:var(--text-faint)]">Outstanding</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-[13px]">
                <Meta label="Principal" value={inr(loan.principal)} />
                <Meta label={t("rep.disbursed")} value={inr(loan.disbursed)} />
                <Meta label={`${loan.installmentAmount} × ${loan.installments}`} value={t(`line.${loan.type}`)} />
              </div>
              <div className="mt-3"><ProgressBar value={pct} color={pct >= 0.99 ? "var(--ok)" : "var(--brand)"} height={7} /></div>
              <div className="flex justify-between mt-1.5 text-[11px] text-[color:var(--text-soft)] tabular">
                <span>{inr(lp)} paid</span><span>{Math.round(pct * 100)}%</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {loan.status === "active" && (
                  <>
                    <button onClick={() => quickCollect(loan)} className="btn-primary h-8 px-3 rounded-lg text-[12.5px] font-semibold inline-flex items-center gap-1.5"><Check size={14} /> Collect {inr(Math.min(loan.installmentAmount, out))}</button>
                    <button onClick={() => setLoanStatus(loan.id, "closed")} className="chip h-8">{t("cust.closeLoan")}</button>
                    <button onClick={() => setLoanStatus(loan.id, "bad")} className="chip h-8">{t("cust.markBad")}</button>
                  </>
                )}
                {loan.status !== "active" && (
                  <button onClick={() => setLoanStatus(loan.id, "active")} className="chip h-8">{t("cust.reopenLoan")}</button>
                )}
                <button onClick={() => { setEditLoan(loan); setLoanOpen(true); }} className="h-8 px-3 rounded-lg text-[12.5px] font-medium text-[color:var(--brand)] hover:bg-[color:var(--brand)]/10">Edit</button>
                <button onClick={() => { if (confirm(t("common.deleteConfirm") || "Delete this loan and all its payments?")) deleteLoan(loan.id); }} className="h-8 px-3 rounded-lg text-[12.5px] font-medium text-[color:var(--crit)] hover:bg-[color:var(--crit)]/10">Delete</button>
                <button onClick={() => setExpanded(isOpen ? null : loan.id)} className="ml-auto flex items-center gap-1 text-[12.5px] font-semibold text-[color:var(--brand)]">
                  Schedule <ChevronDown size={15} className={isOpen ? "rotate-180 transition" : "transition"} />
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-[color:var(--line)] p-4 bg-[color:var(--panel-2)] animate-fade-in grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[12px] font-semibold text-[color:var(--text)] mb-2 uppercase tracking-wide">Payment Schedule</div>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-[color:var(--line)]">
                    {schedule.map((s) => (
                      <div key={s.index} className="flex items-center justify-between px-3 py-1.5 border-b border-[color:var(--line)] last:border-0 text-[12.5px]">
                        <span className="text-[color:var(--text-faint)] w-6 tabular">{s.index}</span>
                        <span className="flex-1 text-[color:var(--text-soft)]">{fmtDate(s.dueDate)}</span>
                        <span className="font-semibold text-[color:var(--text)] mr-3 tabular">{inr(s.amount)}</span>
                        {s.status === "paid" ? (
                          <span className="w-5 h-5 rounded-full grid place-items-center bg-[color:var(--ok-bg)] text-[color:var(--ok)]"><Check size={12} /></span>
                        ) : s.status === "partial" ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-[color:var(--warn-bg)] text-[color:var(--warn)] text-[10px] font-bold tabular">{inr(s.paidAmount)}</span>
                        ) : (
                          <span className="w-5 h-5 rounded-full grid place-items-center bg-[color:var(--neutral-bg)] text-[color:var(--text-faint)]"><X size={12} /></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-[color:var(--text)] mb-2 uppercase tracking-wide">Payments</div>
                  {pays.length === 0 ? (
                    <div className="text-[12.5px] text-[color:var(--text-faint)] px-1">No payments yet</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-[color:var(--line)]">
                      {pays.map((p) => (
                        <div key={p.id} className="group flex items-center justify-between px-3 py-1.5 border-b border-[color:var(--line)] last:border-0 text-[12.5px]">
                          <span className="text-[color:var(--text-soft)]">{fmtDate(p.date)}</span>
                          <span className="text-[color:var(--text-faint)] uppercase text-[10px] font-semibold">{p.method}</span>
                          <div className="text-right text-[color:var(--ok)] font-bold tabular">+{inr(p.amount)}</div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition ml-3">
                            <button onClick={() => setPaySheet(p)} className="w-6 h-6 rounded-md grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)]"><Pencil size={12} /></button>
                            <button onClick={() => { if (confirm(t("common.deleteConfirm") || "Delete?")) deletePayment(p.id); }} className="w-6 h-6 rounded-md grid place-items-center bg-[color:var(--crit)]/10 text-[color:var(--crit)]"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );

  return (
    <>
      <main className="px-4 md:px-6 py-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/customers" className="chip"><ChevronLeft size={15} /> Directory</Link>
          <div className="flex gap-2">
            <button onClick={() => setLoanOpen(true)} className="btn-primary h-9 px-3.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5"><Plus size={15} /> Issue Loan</button>
            <button onClick={() => setEditOpen(true)} className="chip h-9"><Pencil size={15} /> Edit</button>
            <button onClick={remove} className="chip h-9 text-[color:var(--crit)] border-[color:var(--crit-line)]"><Trash2 size={15} /></button>
          </div>
        </div>

        {/* Customer 360 header */}
        <Panel className="p-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-16 h-16 rounded-2xl grid place-items-center bg-gradient-to-br from-[color:var(--brand)] to-[color:var(--brand-strong)] text-white font-extrabold text-2xl shrink-0 shadow-sm">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[20px] font-extrabold text-[color:var(--text)]">{customer.name}</h1>
                <StatusBadge tone={custStatus.tone}>{custStatus.label}</StatusBadge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[color:var(--text-soft)] mt-1.5">
                <span className="flex items-center gap-1"><Hash size={13} /> CUST-{customer.id.slice(-6).toUpperCase()}</span>
                {customer.phone && <span className="flex items-center gap-1"><Phone size={13} /> {customer.phone}</span>}
                {ar && <span className="flex items-center gap-1"><MapPin size={13} /> {ar}</span>}
                <span className="flex items-center gap-1"><UserRound size={13} /> Agent: {agent}</span>
              </div>
              {(customer.address || customer.notes) && (
                <div className="mt-2.5 space-y-1 text-[12.5px]">
                  {customer.address && <div className="flex gap-1.5 text-[color:var(--text-soft)]"><MapPin size={14} className="shrink-0 mt-0.5" /> {customer.address}</div>}
                  {customer.notes && <div className="flex gap-1.5 text-[color:var(--text-soft)]"><StickyNote size={14} className="shrink-0 mt-0.5" /> {customer.notes}</div>}
                </div>
              )}
            </div>
            {customer.phone && (
              <div className="flex gap-2">
                <button onClick={() => { window.location.href = `tel:${customer.phone}`; }} className="chip h-9"><Phone size={15} /> Call</button>
                <button onClick={remind} className="chip h-9"><MessageCircle size={15} /> Remind</button>
              </div>
            )}
          </div>
        </Panel>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile label="Total Borrowed" value={inr(borrowed)} icon={<Landmark size={16} />} color="var(--brand)" />
          <StatTile label="Total Collected" value={inr(paid)} icon={<HandCoins size={16} />} color="var(--ok)" />
          <StatTile label="Outstanding" value={inr(outstanding)} icon={<Wallet size={16} />} color="var(--warn)" />
          <StatTile label="Consistency" value={`${borrowed > 0 ? Math.round((paid / (paid + outstanding || 1)) * 100) : 0}%`} icon={<TrendingUp size={16} />} color="#7c6bf0" />
        </div>

        {/* Tabs */}
        <div className="segtab w-fit">
          {TABS.map((tb) => (
            <button key={tb.key} data-active={tab === tb.key} onClick={() => setTab(tb.key)}>{tb.label}</button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid gap-4 xl:grid-cols-3 items-start">
            <div className="xl:col-span-2">{LoansList}</div>
            <Panel>
              <PanelHead title="Recent Activity" />
              <Timeline pays={allPays} name={customer.name} />
            </Panel>
          </div>
        )}
        {tab === "loans" && LoansList}
        {tab === "payments" && (
          <Panel className="overflow-hidden">
            <PanelHead title="Payment History" desc={`${allPays.length} payments · ${inr(paid)} total`} />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>Date</th><th>Method</th><th>Note</th><th className="text-right">Amount</th><th></th></tr></thead>
                <tbody>
                  {allPays.map((p) => (
                    <tr key={p.id}>
                      <td className="tabular text-[color:var(--text-soft)]">{fmtDate(p.date)}</td>
                      <td><span className="uppercase text-[11px] font-semibold text-[color:var(--text-soft)]">{p.method}</span></td>
                      <td className="text-[color:var(--text-soft)]">{p.note || "—"}</td>
                      <td className="text-right tabular font-bold text-[color:var(--ok)]">+{inr(p.amount)}</td>
                      <td>
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => setPaySheet(p)} className="w-7 h-7 rounded-md grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)]"><Pencil size={13} /></button>
                          <button onClick={() => { if (confirm(t("common.deleteConfirm") || "Delete?")) deletePayment(p.id); }} className="w-7 h-7 rounded-md grid place-items-center bg-[color:var(--crit)]/10 text-[color:var(--crit)]"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {allPays.length === 0 && <tr><td colSpan={5} className="text-center text-[color:var(--text-faint)] py-8">No payments recorded</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
        {tab === "activity" && (
          <Panel>
            <PanelHead title="Activity Timeline" />
            <Timeline pays={allPays} name={customer.name} full />
          </Panel>
        )}
      </main>

      <CustomerSheet open={editOpen} onClose={() => setEditOpen(false)} editing={customer} />
      <LoanSheet open={loanOpen} onClose={() => { setLoanOpen(false); setEditLoan(null); }} customer={customer} editLoan={editLoan} />
      <PaymentSheet open={!!paySheet} onClose={() => setPaySheet(null)} payment={paySheet} />
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[color:var(--text-faint)] text-[11px]">{label}</div>
      <div className="font-semibold text-[color:var(--text)]">{value}</div>
    </div>
  );
}

function Timeline({ pays, name, full }: { pays: Payment[]; name: string; full?: boolean }) {
  const list = full ? pays : pays.slice(0, 6);
  if (list.length === 0) return <div className="px-4 py-8 text-center text-[13px] text-[color:var(--text-faint)]">No activity yet</div>;
  return (
    <div className="p-4">
      <div className="relative pl-5">
        <span className="absolute left-[6px] top-1 bottom-1 w-px bg-[color:var(--line)]" />
        {list.map((p) => (
          <div key={p.id} className="relative pb-4 last:pb-0">
            <span className="absolute -left-[15px] top-1 w-2.5 h-2.5 rounded-full bg-[color:var(--ok)] ring-2 ring-[color:var(--panel)]" />
            <div className="text-[13px] font-semibold text-[color:var(--text)]">Payment collected · {inr(p.amount)}</div>
            <div className="text-[11.5px] text-[color:var(--text-faint)]">{fmtDate(p.date)} · {p.method.toUpperCase()}{p.note ? ` · ${p.note}` : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

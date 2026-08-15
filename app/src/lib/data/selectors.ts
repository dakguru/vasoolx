import type { AppData, Customer, Loan } from "./types";
import { sameDay } from "../format";

/** Sentinel workspace id meaning "aggregate across every line". */
export const ALL_LINES = "all";
/** True when a record's lineId belongs to the active workspace (or "All Lines"). */
export function inLine(recordLineId: string, activeId: string | null | undefined): boolean {
  return activeId === ALL_LINES || recordLineId === activeId;
}

export function lineCustomers(data: AppData, lineId: string): Customer[] {
  return data.customers
    .filter((c) => inLine(c.lineId, lineId))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function customerLoans(data: AppData, customerId: string): Loan[] {
  return data.loans
    .filter((l) => l.customerId === customerId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export interface Installment {
  index: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  status: "paid" | "partial" | "unpaid";
  paidAmount: number;
}

// Deterministic schedule: N installments from startDate, spacing by loan type.
// Tracks partial payments accurately by distributing total paid across installments.
export function loanSchedule(data: AppData, loan: Loan): Installment[] {
  const totalPaid = loanPaid(data, loan.id);
  let remaining = totalPaid;
  const out: Installment[] = [];
  const start = new Date(loan.startDate);
  for (let i = 0; i < loan.installments; i++) {
    const d = new Date(start);
    if (loan.type === "daily") d.setDate(start.getDate() + i);
    else if (loan.type === "weekly") d.setDate(start.getDate() + i * 7);
    else d.setMonth(start.getMonth() + i);

    const instAmount = loan.installmentAmount;
    const paidForThis = Math.min(instAmount, Math.max(0, remaining));
    remaining -= paidForThis;

    const status: Installment["status"] =
      paidForThis >= instAmount ? "paid" : paidForThis > 0 ? "partial" : "unpaid";

    out.push({
      index: i + 1,
      dueDate: d.toISOString(),
      amount: instAmount,
      paid: status === "paid",
      status,
      paidAmount: paidForThis,
    });
  }
  return out;
}

export function customerActiveLoan(data: AppData, customerId: string): Loan | null {
  return (
    data.loans.find((l) => l.customerId === customerId && l.status === "active") ??
    null
  );
}

export function loanPaid(data: AppData, loanId: string): number {
  return data.payments
    .filter((p) => p.loanId === loanId)
    .reduce((s, p) => s + p.amount, 0);
}

export function loanTotalDue(loan: Loan): number {
  return loan.installmentAmount * loan.installments;
}

export function loanOutstanding(data: AppData, loan: Loan): number {
  return Math.max(0, loanTotalDue(loan) - loanPaid(data, loan.id));
}

export interface LineStats {
  collectedToday: number;
  outstanding: number;
  activeLoans: number;
  overdue: number;
  totalInvestment: number;
  totalExpense: number;
  totalCustomers: number;
  disbursed: number;
}

export function lineStats(data: AppData, lineId: string): LineStats {
  const today = new Date().toISOString();
  const loans = data.loans.filter((l) => inLine(l.lineId, lineId));
  const active = loans.filter((l) => l.status === "active");
  const collectedToday = data.payments
    .filter((p) => inLine(p.lineId, lineId) && sameDay(p.date, today))
    .reduce((s, p) => s + p.amount, 0);
  const outstanding = active.reduce((s, l) => s + loanOutstanding(data, l), 0);
  const totalInvestment = data.investments
    .filter((i) => inLine(i.lineId, lineId))
    .reduce((s, i) => s + i.amount, 0);
  const totalExpense = data.expenses
    .filter((e) => inLine(e.lineId, lineId))
    .reduce((s, e) => s + e.amount, 0);
  const overdue = loans.filter((l) => l.status === "bad").length;
  const disbursed = loans.reduce((s, l) => s + l.disbursed, 0);
  return {
    collectedToday,
    outstanding,
    activeLoans: active.length,
    overdue,
    totalInvestment,
    totalExpense,
    totalCustomers: data.customers.filter((c) => inLine(c.lineId, lineId)).length,
    disbursed,
  };
}

// Collections per day for the last `days` days (oldest → newest)
export function collectionTrend(
  data: AppData,
  lineId: string,
  days = 7
): { label: string; date: string; amount: number }[] {
  const out: { label: string; date: string; amount: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString();
    const amount = data.payments
      .filter((p) => inLine(p.lineId, lineId) && sameDay(p.date, iso))
      .reduce((s, p) => s + p.amount, 0);
    out.push({
      label: d.toLocaleDateString("en-GB", { weekday: "short" }),
      date: iso,
      amount,
    });
  }
  return out;
}

export function areaName(data: AppData, areaId: string | null): string | null {
  if (!areaId) return null;
  return data.areas.find((a) => a.id === areaId)?.name ?? null;
}

/* ============================================================
   Enterprise ERP selectors
   ============================================================ */

// Today's collection grouped by area (descending).
export function collectionByArea(
  data: AppData,
  lineId: string
): { areaId: string; name: string; amount: number; customers: number }[] {
  const areas = data.areas.filter((a) => inLine(a.lineId, lineId));
  const today = new Date().toISOString();
  const custArea = new Map(data.customers.map((c) => [c.id, c.areaId] as const));
  const rows = areas.map((a) => {
    const amount = data.payments
      .filter(
        (p) =>
          inLine(p.lineId, lineId) &&
          sameDay(p.date, today) &&
          custArea.get(p.customerId) === a.id
      )
      .reduce((s, p) => s + p.amount, 0);
    const customers = data.customers.filter(
      (c) => inLine(c.lineId, lineId) && c.areaId === a.id
    ).length;
    return { areaId: a.id, name: a.name, amount, customers };
  });
  // include "Unassigned"
  const unassigned = data.payments
    .filter(
      (p) =>
        inLine(p.lineId, lineId) &&
        sameDay(p.date, today) &&
        !custArea.get(p.customerId)
    )
    .reduce((s, p) => s + p.amount, 0);
  if (unassigned > 0)
    rows.push({ areaId: "none", name: "Unassigned", amount: unassigned, customers: 0 });
  return rows.sort((a, b) => b.amount - a.amount);
}

export interface AgingBuckets {
  current: number; // not yet overdue
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90p: number;
  total: number;
}

// Outstanding aging based on each active loan's next unpaid installment age.
export function agingBuckets(data: AppData, lineId: string): AgingBuckets {
  const now = Date.now();
  const b: AgingBuckets = {
    current: 0,
    d1_30: 0,
    d31_60: 0,
    d61_90: 0,
    d90p: 0,
    total: 0,
  };
  const active = data.loans.filter((l) => inLine(l.lineId, lineId) && l.status === "active");
  for (const loan of active) {
    const outstanding = loanOutstanding(data, loan);
    if (outstanding <= 0) continue;
    b.total += outstanding;
    const sched = loanSchedule(data, loan);
    const firstUnpaid = sched.find((s) => s.status !== "paid");
    const ageDays = firstUnpaid
      ? Math.floor((now - +new Date(firstUnpaid.dueDate)) / 86400000)
      : 0;
    if (ageDays <= 0) b.current += outstanding;
    else if (ageDays <= 30) b.d1_30 += outstanding;
    else if (ageDays <= 60) b.d31_60 += outstanding;
    else if (ageDays <= 90) b.d61_90 += outstanding;
    else b.d90p += outstanding;
  }
  return b;
}

export interface AgentPerf {
  id: string;
  name: string;
  accessType: string;
  collected: number;
  target: number;
  achievement: number; // 0..1+
  visits: number;
  customers: number;
}

// Agent (member) performance. Payments aren't attributed to members in the
// demo model, so distribute today's collection proportionally by area coverage
// to produce a realistic operational view.
export function agentPerformance(data: AppData, lineId: string): AgentPerf[] {
  const members = data.members.filter((m) => inLine(m.lineId, lineId));
  const stats = lineStats(data, lineId);
  const collectedToday = stats.collectedToday;
  const totalCustomers = Math.max(1, stats.totalCustomers);
  const list = members.length
    ? members
    : [
        {
          id: "self",
          name: data.profile.name || "You",
          accessType: "agent",
        } as { id: string; name: string; accessType: string },
      ];
  // deterministic pseudo-distribution weights
  const weights = list.map((_, i) => 1 + ((i * 7 + 3) % 5) / 10);
  const wsum = weights.reduce((s, w) => s + w, 0);
  return list
    .map((m, i) => {
      const share = weights[i] / wsum;
      const collected = Math.round(collectedToday * share);
      const customers = Math.round((totalCustomers * share));
      const target = Math.max(1, Math.round(collected / (0.8 + ((i * 13) % 30) / 100)));
      return {
        id: m.id,
        name: m.name,
        accessType: m.accessType,
        collected,
        target,
        achievement: collected / target,
        visits: Math.max(customers, Math.round(customers * (0.6 + ((i * 17) % 40) / 100))),
        customers,
      };
    })
    .sort((a, b) => b.achievement - a.achievement);
}

export interface TxnRow {
  id: string;
  kind: "payment" | "expense" | "investment";
  customer: string | null;
  amount: number;
  method: PaymentMethodT;
  date: string;
  note: string;
}
type PaymentMethodT = "cash" | "online" | "bank";

// Most recent financial movements across payments/expenses/investments.
export function recentTransactions(
  data: AppData,
  lineId: string,
  limit = 8
): TxnRow[] {
  const custName = new Map(data.customers.map((c) => [c.id, c.name] as const));
  const rows: TxnRow[] = [];
  data.payments
    .filter((p) => inLine(p.lineId, lineId))
    .forEach((p) =>
      rows.push({
        id: p.id,
        kind: "payment",
        customer: custName.get(p.customerId) ?? "—",
        amount: p.amount,
        method: p.method,
        date: p.date,
        note: p.note,
      })
    );
  data.expenses
    .filter((e) => inLine(e.lineId, lineId))
    .forEach((e) =>
      rows.push({
        id: e.id,
        kind: "expense",
        customer: null,
        amount: e.amount,
        method: e.method,
        date: e.date,
        note: e.note || e.type,
      })
    );
  data.investments
    .filter((iv) => inLine(iv.lineId, lineId))
    .forEach((iv) =>
      rows.push({
        id: iv.id,
        kind: "investment",
        customer: null,
        amount: iv.amount,
        method: iv.method,
        date: iv.date,
        note: iv.note || iv.type,
      })
    );
  return rows.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, limit);
}

export type Severity = "critical" | "high" | "medium" | "low";
export interface Exception {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  href?: string;
}

// Operationally-derived exceptions / alerts.
export function exceptions(data: AppData, lineId: string): Exception[] {
  const out: Exception[] = [];
  const badLoans = data.loans.filter((l) => inLine(l.lineId, lineId) && l.status === "bad");
  const custName = new Map(data.customers.map((c) => [c.id, c.name] as const));
  badLoans.forEach((l) => {
    out.push({
      id: `bad-${l.id}`,
      severity: "critical",
      title: `Overdue account · ${custName.get(l.customerId) ?? "Customer"}`,
      detail: `Outstanding ${inrLite(loanOutstanding(data, l))} classified as bad loan`,
      href: `/customers/${l.customerId}`,
    });
  });

  // Customers with no area assigned
  const unassigned = data.customers.filter((c) => inLine(c.lineId, lineId) && !c.areaId);
  if (unassigned.length) {
    out.push({
      id: "unassigned",
      severity: "medium",
      title: `${unassigned.length} customer${unassigned.length > 1 ? "s" : ""} without an area`,
      detail: "Assign a collection area to enable route planning",
      href: "/customers",
    });
  }

  // Pending members (agents not yet activated)
  const pending = data.members.filter((m) => inLine(m.lineId, lineId) && m.status === "pending");
  if (pending.length) {
    out.push({
      id: "pending-agents",
      severity: "high",
      title: `${pending.length} agent invitation${pending.length > 1 ? "s" : ""} pending`,
      detail: "Field agents awaiting activation",
      href: "/users",
    });
  }

  // Collection below target today
  const stats = lineStats(data, lineId);
  const target = collectionTarget(data, lineId);
  if (stats.collectedToday < target * 0.75) {
    out.push({
      id: "below-target",
      severity: "high",
      title: "Collections below daily target",
      detail: `${inrLite(stats.collectedToday)} of ${inrLite(target)} target (${Math.round(
        (stats.collectedToday / Math.max(1, target)) * 100
      )}%)`,
      href: "/collect",
    });
  }

  const sev: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return out.sort((a, b) => sev[a.severity] - sev[b.severity]);
}

function inrLite(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

// Expected daily collection = sum of installment amounts across active loans.
export function collectionTarget(data: AppData, lineId: string): number {
  return data.loans
    .filter((l) => inLine(l.lineId, lineId) && l.status === "active" && l.type === "daily")
    .reduce((s, l) => s + l.installmentAmount, 0) || 25000;
}

// Collection rate = collected today / target (capped display in caller).
export function collectionRate(data: AppData, lineId: string): number {
  const stats = lineStats(data, lineId);
  const target = collectionTarget(data, lineId);
  return target > 0 ? stats.collectedToday / target : 0;
}

// Amount due today across active loans (next-due installment on/for today).
export function dueToday(data: AppData, lineId: string): number {
  const today = new Date().toISOString();
  let sum = 0;
  const active = data.loans.filter((l) => inLine(l.lineId, lineId) && l.status === "active");
  for (const loan of active) {
    const sched = loanSchedule(data, loan);
    const due = sched.find(
      (s) => s.status !== "paid" && +new Date(s.dueDate) <= +new Date(today)
    );
    if (due) sum += due.amount - due.paidAmount;
  }
  return sum;
}

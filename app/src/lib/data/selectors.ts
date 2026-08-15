import type { AppData, Customer, Loan } from "./types";
import { sameDay } from "../format";

export function lineCustomers(data: AppData, lineId: string): Customer[] {
  return data.customers
    .filter((c) => c.lineId === lineId)
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
  const loans = data.loans.filter((l) => l.lineId === lineId);
  const active = loans.filter((l) => l.status === "active");
  const collectedToday = data.payments
    .filter((p) => p.lineId === lineId && sameDay(p.date, today))
    .reduce((s, p) => s + p.amount, 0);
  const outstanding = active.reduce((s, l) => s + loanOutstanding(data, l), 0);
  const totalInvestment = data.investments
    .filter((i) => i.lineId === lineId)
    .reduce((s, i) => s + i.amount, 0);
  const totalExpense = data.expenses
    .filter((e) => e.lineId === lineId)
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
    totalCustomers: data.customers.filter((c) => c.lineId === lineId).length,
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
      .filter((p) => p.lineId === lineId && sameDay(p.date, iso))
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

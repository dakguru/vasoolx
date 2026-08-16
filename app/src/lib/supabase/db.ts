// Supabase data-access layer for VasoolX.
// Maps between the snake_case Postgres schema (supabase/schema.sql) and the
// camelCase app types (src/lib/data/types.ts), loads a full AppData snapshot
// for the signed-in user, and exposes CRUD write helpers used by the store.
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppData,
  Area,
  Customer,
  Expense,
  Investment,
  Line,
  Loan,
  Member,
  Payment,
  Profile,
} from "@/lib/data/types";
import { emptyData } from "@/lib/data/seed";

type Row = Record<string, unknown>;
type SB = SupabaseClient;

// ---------------------------------------------------------------------------
// Row → app mappers
// ---------------------------------------------------------------------------
const lineFromRow = (r: Row): Line => ({
  id: r.id as string,
  name: (r.name as string) ?? "",
  loanType: (r.loan_type as Line["loanType"]) ?? "daily",
  interestRate: Number(r.interest_rate ?? 0),
  processingFees: Number(r.processing_fees ?? 0),
  installmentsPeriod: Number(r.installments_period ?? 0),
  badLoanDays: Number(r.bad_loan_days ?? 0),
  closeLoanManually: Boolean(r.close_loan_manually),
  enableCustomerNumber: Boolean(r.enable_customer_number),
  createdAt: (r.created_at as string) ?? "",
});

const areaFromRow = (r: Row): Area => ({
  id: r.id as string,
  lineId: r.line_id as string,
  name: (r.name as string) ?? "",
  createdAt: (r.created_at as string) ?? "",
});

const customerFromRow = (r: Row): Customer => ({
  id: r.id as string,
  lineId: r.line_id as string,
  areaId: (r.area_id as string | null) ?? null,
  name: (r.name as string) ?? "",
  phone: (r.phone as string) ?? "",
  sortOrder: Number(r.sort_order ?? 0),
  address: (r.address as string) ?? "",
  notes: (r.notes as string) ?? "",
  photoUrl: (r.photo_url as string | null) ?? null,
  createdAt: (r.created_at as string) ?? "",
});

const loanFromRow = (r: Row): Loan => ({
  id: r.id as string,
  customerId: r.customer_id as string,
  lineId: r.line_id as string,
  principal: Number(r.principal ?? 0),
  interest: Number(r.interest ?? 0),
  processingFees: Number(r.processing_fees ?? 0),
  disbursed: Number(r.disbursed ?? 0),
  type: (r.type as Loan["type"]) ?? "daily",
  installmentAmount: Number(r.installment_amount ?? 0),
  installments: Number(r.installments ?? 0),
  badLoanDays: Number(r.bad_loan_days ?? 0),
  method: (r.method as Loan["method"]) ?? "cash",
  startDate: (r.start_date as string) ?? "",
  status: (r.status as Loan["status"]) ?? "active",
  createdAt: (r.created_at as string) ?? "",
});

const paymentFromRow = (r: Row): Payment => ({
  id: r.id as string,
  loanId: r.loan_id as string,
  customerId: r.customer_id as string,
  lineId: r.line_id as string,
  amount: Number(r.amount ?? 0),
  date: (r.date as string) ?? "",
  method: (r.method as Payment["method"]) ?? "cash",
  note: (r.note as string) ?? "",
});

const investmentFromRow = (r: Row): Investment => ({
  id: r.id as string,
  lineId: r.line_id as string,
  type: (r.type as string) ?? "",
  amount: Number(r.amount ?? 0),
  method: (r.method as Investment["method"]) ?? "cash",
  date: (r.date as string) ?? "",
  note: (r.note as string) ?? "",
});

const expenseFromRow = (r: Row): Expense => ({
  id: r.id as string,
  lineId: r.line_id as string,
  type: (r.type as string) ?? "",
  amount: Number(r.amount ?? 0),
  method: (r.method as Expense["method"]) ?? "cash",
  date: (r.date as string) ?? "",
  note: (r.note as string) ?? "",
});

const memberFromRow = (r: Row): Member => ({
  id: r.id as string,
  lineId: (r.line_id as string | null) ?? null,
  areaId: (r.area_id as string | null) ?? null,
  phone: (r.phone as string) ?? "",
  name: (r.name as string) ?? "",
  accessType: (r.access_type as Member["accessType"]) ?? "agent",
  status: (r.status as Member["status"]) ?? "pending",
  permissions: (r.permissions as Record<string, boolean>) ?? {},
  createdAt: (r.created_at as string) ?? "",
});

// ---------------------------------------------------------------------------
// App → row mappers (insert). Partial patches are converted via the column maps
// below so only the changed keys are sent.
// ---------------------------------------------------------------------------
const LINE_COLS: Record<string, string> = {
  name: "name",
  loanType: "loan_type",
  interestRate: "interest_rate",
  processingFees: "processing_fees",
  installmentsPeriod: "installments_period",
  badLoanDays: "bad_loan_days",
  closeLoanManually: "close_loan_manually",
  enableCustomerNumber: "enable_customer_number",
  createdAt: "created_at",
};
const CUSTOMER_COLS: Record<string, string> = {
  lineId: "line_id",
  areaId: "area_id",
  name: "name",
  phone: "phone",
  sortOrder: "sort_order",
  address: "address",
  notes: "notes",
  photoUrl: "photo_url",
  createdAt: "created_at",
};
const LOAN_COLS: Record<string, string> = {
  customerId: "customer_id",
  lineId: "line_id",
  principal: "principal",
  interest: "interest",
  processingFees: "processing_fees",
  disbursed: "disbursed",
  type: "type",
  installmentAmount: "installment_amount",
  installments: "installments",
  badLoanDays: "bad_loan_days",
  method: "method",
  startDate: "start_date",
  status: "status",
  createdAt: "created_at",
};
const PAYMENT_COLS: Record<string, string> = {
  loanId: "loan_id",
  customerId: "customer_id",
  lineId: "line_id",
  amount: "amount",
  date: "date",
  method: "method",
  note: "note",
};
const INVESTMENT_COLS: Record<string, string> = {
  lineId: "line_id",
  type: "type",
  amount: "amount",
  method: "method",
  date: "date",
  note: "note",
};
const EXPENSE_COLS: Record<string, string> = INVESTMENT_COLS;
const PROFILE_COLS: Record<string, string> = {
  name: "name",
  email: "email",
  phone: "phone",
};

// Convert a partial app object to a snake_case row, keeping only mapped keys
// that are actually present.
function toRow(cols: Record<string, string>, patch: object): Row {
  const src = patch as Record<string, unknown>;
  const out: Row = {};
  for (const [camel, snake] of Object.entries(cols)) {
    if (camel in src) out[snake] = src[camel];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Load a full snapshot for the signed-in user.
// ---------------------------------------------------------------------------
export async function loadAll(
  sb: SB,
  user: { id: string; email?: string | null }
): Promise<AppData> {
  const [
    lines,
    areas,
    customers,
    loans,
    payments,
    investments,
    expenses,
    members,
    profile,
  ] = await Promise.all([
    sb.from("lines").select("*").order("created_at", { ascending: true }),
    sb.from("areas").select("*").order("created_at", { ascending: true }),
    sb.from("customers").select("*").order("sort_order", { ascending: true }),
    sb.from("loans").select("*").order("created_at", { ascending: true }),
    sb.from("payments").select("*").order("date", { ascending: true }),
    sb.from("investments").select("*").order("date", { ascending: true }),
    sb.from("expenses").select("*").order("date", { ascending: true }),
    sb.from("line_members").select("*").order("created_at", { ascending: true }),
    sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  const firstError =
    lines.error ||
    areas.error ||
    customers.error ||
    loans.error ||
    payments.error ||
    investments.error ||
    expenses.error ||
    members.error;
  if (firstError) throw firstError;

  const p = profile.data as Row | null;
  const base = emptyData();
  return {
    ...base,
    lines: (lines.data ?? []).map(lineFromRow),
    areas: (areas.data ?? []).map(areaFromRow),
    customers: (customers.data ?? []).map(customerFromRow),
    loans: (loans.data ?? []).map(loanFromRow),
    payments: (payments.data ?? []).map(paymentFromRow),
    investments: (investments.data ?? []).map(investmentFromRow),
    expenses: (expenses.data ?? []).map(expenseFromRow),
    members: (members.data ?? []).map(memberFromRow),
    profile: {
      name: (p?.name as string) ?? "",
      email: (p?.email as string) ?? user.email ?? "",
      phone: (p?.phone as string) ?? "",
    },
    activeLineId: (lines.data?.[0]?.id as string) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Write helpers. All return the Supabase PostgrestResponse promise; the store
// wraps them in `sync()` for fire-and-forget with error logging.
// ---------------------------------------------------------------------------
export const db = {
  // lines
  insertLine: (sb: SB, l: Line, ownerId: string) =>
    sb.from("lines").insert({ id: l.id, owner_id: ownerId, ...toRow(LINE_COLS, l) }),
  updateLine: (sb: SB, id: string, patch: Partial<Line>) =>
    sb.from("lines").update(toRow(LINE_COLS, patch)).eq("id", id),
  deleteLine: (sb: SB, id: string) => sb.from("lines").delete().eq("id", id),

  // areas
  insertArea: (sb: SB, a: Area) =>
    sb.from("areas").insert({ id: a.id, line_id: a.lineId, name: a.name, created_at: a.createdAt }),
  deleteArea: (sb: SB, id: string) => sb.from("areas").delete().eq("id", id),

  // customers
  insertCustomer: (sb: SB, c: Customer) =>
    sb.from("customers").insert({ id: c.id, ...toRow(CUSTOMER_COLS, c) }),
  updateCustomer: (sb: SB, id: string, patch: Partial<Customer>) =>
    sb.from("customers").update(toRow(CUSTOMER_COLS, patch)).eq("id", id),
  deleteCustomer: (sb: SB, id: string) => sb.from("customers").delete().eq("id", id),

  // loans
  insertLoan: (sb: SB, l: Loan) =>
    sb.from("loans").insert({ id: l.id, ...toRow(LOAN_COLS, l) }),
  updateLoan: (sb: SB, id: string, patch: Partial<Loan>) =>
    sb.from("loans").update(toRow(LOAN_COLS, patch)).eq("id", id),
  deleteLoan: (sb: SB, id: string) => sb.from("loans").delete().eq("id", id),

  // payments
  insertPayment: (sb: SB, p: Payment, createdBy: string) =>
    sb.from("payments").insert({ id: p.id, created_by: createdBy, ...toRow(PAYMENT_COLS, p) }),
  insertPayments: (sb: SB, ps: Payment[], createdBy: string) =>
    sb.from("payments").insert(
      ps.map((p) => ({ id: p.id, created_by: createdBy, ...toRow(PAYMENT_COLS, p) }))
    ),
  updatePayment: (sb: SB, id: string, patch: Partial<Payment>) =>
    sb.from("payments").update(toRow(PAYMENT_COLS, patch)).eq("id", id),
  deletePayment: (sb: SB, id: string) => sb.from("payments").delete().eq("id", id),

  // investments
  insertInvestment: (sb: SB, i: Investment) =>
    sb.from("investments").insert({ id: i.id, ...toRow(INVESTMENT_COLS, i) }),
  updateInvestment: (sb: SB, id: string, patch: Partial<Investment>) =>
    sb.from("investments").update(toRow(INVESTMENT_COLS, patch)).eq("id", id),
  deleteInvestment: (sb: SB, id: string) => sb.from("investments").delete().eq("id", id),

  // expenses
  insertExpense: (sb: SB, e: Expense, createdBy: string) =>
    sb.from("expenses").insert({ id: e.id, created_by: createdBy, ...toRow(EXPENSE_COLS, e) }),
  updateExpense: (sb: SB, id: string, patch: Partial<Expense>) =>
    sb.from("expenses").update(toRow(EXPENSE_COLS, patch)).eq("id", id),
  deleteExpense: (sb: SB, id: string) => sb.from("expenses").delete().eq("id", id),

  // members
  insertMember: (sb: SB, m: Member, ownerId: string) =>
    sb.from("line_members").insert({
      id: m.id,
      line_id: m.lineId,
      area_id: m.areaId,
      owner_id: ownerId,
      phone: m.phone,
      name: m.name,
      access_type: m.accessType,
      status: m.status,
      permissions: m.permissions ?? {},
      created_at: m.createdAt,
    }),

  // Link memberships created for the signed-in user's phone (no accept step).
  claimMemberships: (sb: SB) => sb.rpc("claim_memberships"),
  deleteMember: (sb: SB, id: string) => sb.from("line_members").delete().eq("id", id),

  // profile
  updateProfile: (sb: SB, userId: string, patch: Partial<Profile>) =>
    sb.from("profiles").update(toRow(PROFILE_COLS, patch)).eq("id", userId),
};

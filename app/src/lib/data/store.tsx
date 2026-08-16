"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
} from "./types";
import { buildSeed, emptyData, uid } from "./seed";
import { loanOutstanding, ALL_LINES } from "./selectors";
import { isSupabaseConfigured, getSupabaseBrowser } from "@/lib/supabase/client";
import { loadAll, db } from "@/lib/supabase/db";

const STORAGE_KEY = "vasoolx.data.v1";

// When Supabase is configured the app is backed by Postgres; otherwise it runs
// as a self-contained localStorage demo.
const SUPA = isSupabaseConfigured;

type StoreContextValue = {
  data: AppData;
  ready: boolean;
  activeLine: Line | null;
  setActiveLine: (id: string) => void;
  // lines
  addLine: (l: Omit<Line, "id" | "createdAt">) => Line;
  updateLine: (id: string, patch: Partial<Line>) => void;
  deleteLine: (id: string) => boolean;
  // areas
  addArea: (name: string, lineId: string) => void;
  deleteArea: (id: string) => void;
  // customers
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => boolean;
  // loans
  addLoan: (l: Omit<Loan, "id" | "createdAt">) => Loan;
  updateLoan: (id: string, patch: Partial<Loan>) => void;
  deleteLoan: (id: string) => boolean;
  setLoanStatus: (id: string, status: Loan["status"]) => void;
  // payments / collection
  addPayment: (p: Omit<Payment, "id">) => void;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  deletePayment: (id: string) => boolean;
  collect: (opts: {
    lineId: string;
    areaId: string | null;
    date: string;
    loanIds?: string[];
  }) => number;
  // finance
  addInvestment: (i: Omit<Investment, "id">) => void;
  updateInvestment: (id: string, patch: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  // members
  addMember: (m: Omit<Member, "id" | "createdAt">) => void;
  deleteMember: (id: string) => void;
  // profile
  updateProfile: (patch: Partial<Profile>) => void;
  resetDemo: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

// Fire-and-forget a Supabase write, surfacing failures to the console so a
// rejected RLS policy or network error is visible during development.
function sync(p: PromiseLike<{ error: { message: string } | null }>) {
  Promise.resolve(p)
    .then(({ error }) => {
      if (error) console.error("[vasoolx sync]", error.message);
    })
    .catch((e) => console.error("[vasoolx sync]", e));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() =>
    SUPA ? emptyData() : buildSeed()
  );
  const [ready, setReady] = useState(false);

  // Latest committed snapshot, kept in sync synchronously so mutation callbacks
  // can compute derived changes (e.g. auto-closing loans) without stale reads.
  const dataRef = useRef<AppData>(data);
  const sbRef = useRef<SupabaseClient | null>(null);
  const userIdRef = useRef<string | null>(null);

  const sb = useCallback(() => {
    if (!sbRef.current) sbRef.current = getSupabaseBrowser();
    return sbRef.current!;
  }, []);

  // Commit a new snapshot: update the ref synchronously, re-render, and (demo
  // mode only) persist to localStorage. Supabase mode persists per-mutation.
  const commit = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
    if (!SUPA) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
    }
  }, []);

  const genId = useCallback(
    (prefix: string) =>
      SUPA && typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : uid(prefix),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (SUPA) {
        try {
          const client = sb();
          const { data: u } = await client.auth.getUser();
          if (u.user) {
            userIdRef.current = u.user.id;
            const loaded = await loadAll(client, u.user);
            if (!cancelled) commit(loaded);
          }
        } catch (e) {
          console.error("[vasoolx load]", e);
        }
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            commit(JSON.parse(raw));
          } else {
            commit(buildSeed());
          }
        } catch {
          commit(buildSeed());
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [commit, sb]);

  const setActiveLine = useCallback(
    (id: string) => commit({ ...dataRef.current, activeLineId: id }),
    [commit]
  );

  // ---------------- lines ----------------
  const addLine: StoreContextValue["addLine"] = useCallback(
    (l) => {
      const d = dataRef.current;
      const line: Line = { ...l, id: genId("line"), createdAt: new Date().toISOString() };
      commit({
        ...d,
        lines: [...d.lines, line],
        activeLineId: d.activeLineId ?? line.id,
      });
      if (SUPA) sync(db.insertLine(sb(), line, userIdRef.current!));
      return line;
    },
    [commit, genId, sb]
  );

  const updateLine: StoreContextValue["updateLine"] = useCallback(
    (id, patch) => {
      const d = dataRef.current;
      commit({
        ...d,
        lines: d.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      });
      if (SUPA) sync(db.updateLine(sb(), id, patch));
    },
    [commit, sb]
  );

  const deleteLine: StoreContextValue["deleteLine"] = useCallback(
    (id) => {
      const d = dataRef.current;
      const hasActiveLoans = d.loans.some(
        (l) => l.lineId === id && (l.status === "active" || l.status === "bad")
      );
      if (hasActiveLoans) return false;
      const lines = d.lines.filter((l) => l.id !== id);
      commit({
        ...d,
        lines,
        areas: d.areas.filter((a) => a.lineId !== id),
        customers: d.customers.filter((c) => c.lineId !== id),
        loans: d.loans.filter((l) => l.lineId !== id),
        payments: d.payments.filter((p) => p.lineId !== id),
        investments: d.investments.filter((i) => i.lineId !== id),
        expenses: d.expenses.filter((e) => e.lineId !== id),
        activeLineId: d.activeLineId === id ? lines[0]?.id ?? null : d.activeLineId,
      });
      // ON DELETE CASCADE removes child rows in Postgres.
      if (SUPA) sync(db.deleteLine(sb(), id));
      return true;
    },
    [commit, sb]
  );

  // ---------------- areas ----------------
  const addArea: StoreContextValue["addArea"] = useCallback(
    (name, lineId) => {
      const d = dataRef.current;
      const area: Area = {
        id: genId("area"),
        lineId,
        name,
        createdAt: new Date().toISOString(),
      };
      commit({ ...d, areas: [...d.areas, area] });
      if (SUPA) sync(db.insertArea(sb(), area));
    },
    [commit, genId, sb]
  );

  const deleteArea: StoreContextValue["deleteArea"] = useCallback(
    (id) => {
      const d = dataRef.current;
      commit({
        ...d,
        areas: d.areas.filter((a) => a.id !== id),
        customers: d.customers.map((c) =>
          c.areaId === id ? { ...c, areaId: null } : c
        ),
      });
      // customers.area_id has ON DELETE SET NULL, matching the local update.
      if (SUPA) sync(db.deleteArea(sb(), id));
    },
    [commit, sb]
  );

  // ---------------- customers ----------------
  const addCustomer: StoreContextValue["addCustomer"] = useCallback(
    (c) => {
      const d = dataRef.current;
      const customer: Customer = {
        ...c,
        id: genId("cust"),
        createdAt: new Date().toISOString(),
      };
      commit({ ...d, customers: [...d.customers, customer] });
      if (SUPA) sync(db.insertCustomer(sb(), customer));
    },
    [commit, genId, sb]
  );

  const updateCustomer: StoreContextValue["updateCustomer"] = useCallback(
    (id, patch) => {
      const d = dataRef.current;
      commit({
        ...d,
        customers: d.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      });
      if (SUPA) sync(db.updateCustomer(sb(), id, patch));
    },
    [commit, sb]
  );

  const deleteCustomer: StoreContextValue["deleteCustomer"] = useCallback(
    (id) => {
      const d = dataRef.current;
      const hasActiveLoans = d.loans.some(
        (l) => l.customerId === id && (l.status === "active" || l.status === "bad")
      );
      if (hasActiveLoans) return false;
      commit({
        ...d,
        customers: d.customers.filter((c) => c.id !== id),
        loans: d.loans.filter((l) => l.customerId !== id),
        payments: d.payments.filter((p) => p.customerId !== id),
      });
      if (SUPA) sync(db.deleteCustomer(sb(), id));
      return true;
    },
    [commit, sb]
  );

  // ---------------- loans ----------------
  const addLoan: StoreContextValue["addLoan"] = useCallback(
    (l) => {
      const d = dataRef.current;
      const loan: Loan = { ...l, id: genId("loan"), createdAt: new Date().toISOString() };
      commit({ ...d, loans: [...d.loans, loan] });
      if (SUPA) sync(db.insertLoan(sb(), loan));
      return loan;
    },
    [commit, genId, sb]
  );

  const updateLoan: StoreContextValue["updateLoan"] = useCallback(
    (id, patch) => {
      const d = dataRef.current;
      commit({
        ...d,
        loans: d.loans.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      });
      if (SUPA) sync(db.updateLoan(sb(), id, patch));
    },
    [commit, sb]
  );

  const deleteLoan: StoreContextValue["deleteLoan"] = useCallback(
    (id) => {
      const d = dataRef.current;
      commit({
        ...d,
        loans: d.loans.filter((l) => l.id !== id),
        payments: d.payments.filter((p) => p.loanId !== id),
      });
      if (SUPA) sync(db.deleteLoan(sb(), id));
      return true;
    },
    [commit, sb]
  );

  const setLoanStatus: StoreContextValue["setLoanStatus"] = useCallback(
    (id, status) => updateLoan(id, { status }),
    [updateLoan]
  );

  // ---------------- payments ----------------
  // Recompute a loan's status from its payments (unless the line closes loans
  // manually). Returns the new status if it changed, else null.
  const recomputeLoanStatus = useCallback(
    (d: AppData, loanId: string, payments: Payment[]): Loan["status"] | null => {
      const loan = d.loans.find((l) => l.id === loanId);
      if (!loan) return null;
      const line = d.lines.find((ln) => ln.id === loan.lineId);
      if (!line || line.closeLoanManually) return null;
      const totalPaid = payments
        .filter((p) => p.loanId === loanId)
        .reduce((s, p) => s + p.amount, 0);
      const totalDue = loan.installmentAmount * loan.installments;
      const next: Loan["status"] =
        totalPaid >= totalDue ? "closed" : loan.status === "bad" ? "bad" : "active";
      return next === loan.status ? null : next;
    },
    []
  );

  const addPayment: StoreContextValue["addPayment"] = useCallback(
    (p) => {
      const d = dataRef.current;
      const payment: Payment = { ...p, id: genId("pay") };
      const newPayments = [...d.payments, payment];
      const loan = d.loans.find((l) => l.id === p.loanId);

      let closedLoanId: string | null = null;
      let loans = d.loans;
      if (loan && (loan.status === "active" || loan.status === "bad")) {
        const next = recomputeLoanStatus(d, loan.id, newPayments);
        if (next === "closed") {
          closedLoanId = loan.id;
          loans = d.loans.map((l) =>
            l.id === loan.id ? { ...l, status: "closed" as const } : l
          );
        }
      }
      commit({ ...d, payments: newPayments, loans });
      if (SUPA) {
        sync(db.insertPayment(sb(), payment, userIdRef.current!));
        if (closedLoanId) sync(db.updateLoan(sb(), closedLoanId, { status: "closed" }));
      }
    },
    [commit, genId, recomputeLoanStatus, sb]
  );

  const updatePayment: StoreContextValue["updatePayment"] = useCallback(
    (id, patch) => {
      const d = dataRef.current;
      const newPayments = d.payments.map((p) => (p.id === id ? { ...p, ...patch } : p));
      const payment = newPayments.find((p) => p.id === id);
      let loans = d.loans;
      let statusChange: { loanId: string; status: Loan["status"] } | null = null;
      if (payment) {
        const next = recomputeLoanStatus(d, payment.loanId, newPayments);
        if (next) {
          statusChange = { loanId: payment.loanId, status: next };
          loans = d.loans.map((l) =>
            l.id === payment.loanId ? { ...l, status: next } : l
          );
        }
      }
      commit({ ...d, payments: newPayments, loans });
      if (SUPA) {
        sync(db.updatePayment(sb(), id, patch));
        if (statusChange)
          sync(db.updateLoan(sb(), statusChange.loanId, { status: statusChange.status }));
      }
    },
    [commit, recomputeLoanStatus, sb]
  );

  const deletePayment: StoreContextValue["deletePayment"] = useCallback(
    (id) => {
      const d = dataRef.current;
      const payment = d.payments.find((p) => p.id === id);
      const newPayments = d.payments.filter((p) => p.id !== id);
      let loans = d.loans;
      let statusChange: { loanId: string; status: Loan["status"] } | null = null;
      if (payment) {
        const next = recomputeLoanStatus(d, payment.loanId, newPayments);
        if (next) {
          statusChange = { loanId: payment.loanId, status: next };
          loans = d.loans.map((l) =>
            l.id === payment.loanId ? { ...l, status: next } : l
          );
        }
      }
      commit({ ...d, payments: newPayments, loans });
      if (SUPA) {
        sync(db.deletePayment(sb(), id));
        if (statusChange)
          sync(db.updateLoan(sb(), statusChange.loanId, { status: statusChange.status }));
      }
      return true;
    },
    [commit, recomputeLoanStatus, sb]
  );

  // Collect one installment for each active loan in a line (optionally by area / subset)
  const collect: StoreContextValue["collect"] = useCallback(
    ({ lineId, areaId, date, loanIds }) => {
      const d = dataRef.current;
      const custInArea = new Set(
        d.customers
          .filter((c) => c.lineId === lineId && (!areaId || c.areaId === areaId))
          .map((c) => c.id)
      );
      const targets = d.loans.filter(
        (l) =>
          l.lineId === lineId &&
          l.status === "active" &&
          custInArea.has(l.customerId) &&
          (!loanIds || loanIds.includes(l.id))
      );
      const newPayments: Payment[] = [];
      for (const l of targets) {
        const outstanding = loanOutstanding(d, l);
        if (outstanding <= 0) continue;
        const amount = Math.min(l.installmentAmount, outstanding);
        newPayments.push({
          id: genId("pay"),
          loanId: l.id,
          customerId: l.customerId,
          lineId,
          amount,
          date,
          method: "cash",
          note: "",
        });
      }

      // Auto-close fully-paid loans (unless closeLoanManually is set)
      const line = d.lines.find((ln) => ln.id === lineId);
      const allPayments = [...d.payments, ...newPayments];
      let loans = d.loans;
      const closedLoanIds: string[] = [];
      if (line && !line.closeLoanManually) {
        const paidByLoan = new Map<string, number>();
        for (const p of allPayments) {
          paidByLoan.set(p.loanId, (paidByLoan.get(p.loanId) ?? 0) + p.amount);
        }
        loans = d.loans.map((l) => {
          if (l.lineId !== lineId || l.status !== "active") return l;
          const totalDue = l.installmentAmount * l.installments;
          const totalPaid = paidByLoan.get(l.id) ?? 0;
          if (totalPaid >= totalDue) {
            closedLoanIds.push(l.id);
            return { ...l, status: "closed" as const };
          }
          return l;
        });
      }

      commit({ ...d, payments: allPayments, loans });
      if (SUPA && newPayments.length) {
        sync(db.insertPayments(sb(), newPayments, userIdRef.current!));
        for (const lid of closedLoanIds)
          sync(db.updateLoan(sb(), lid, { status: "closed" }));
      }
      return newPayments.length;
    },
    [commit, genId, sb]
  );

  // ---------------- investments ----------------
  const addInvestment: StoreContextValue["addInvestment"] = useCallback(
    (i) => {
      const d = dataRef.current;
      const inv: Investment = { ...i, id: genId("inv") };
      commit({ ...d, investments: [...d.investments, inv] });
      if (SUPA) sync(db.insertInvestment(sb(), inv));
    },
    [commit, genId, sb]
  );

  const updateInvestment: StoreContextValue["updateInvestment"] = useCallback(
    (id, patch) => {
      const d = dataRef.current;
      commit({
        ...d,
        investments: d.investments.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      });
      if (SUPA) sync(db.updateInvestment(sb(), id, patch));
    },
    [commit, sb]
  );

  const deleteInvestment: StoreContextValue["deleteInvestment"] = useCallback(
    (id) => {
      const d = dataRef.current;
      commit({ ...d, investments: d.investments.filter((i) => i.id !== id) });
      if (SUPA) sync(db.deleteInvestment(sb(), id));
    },
    [commit, sb]
  );

  // ---------------- expenses ----------------
  const addExpense: StoreContextValue["addExpense"] = useCallback(
    (e) => {
      const d = dataRef.current;
      const exp: Expense = { ...e, id: genId("exp") };
      commit({ ...d, expenses: [...d.expenses, exp] });
      if (SUPA) sync(db.insertExpense(sb(), exp, userIdRef.current!));
    },
    [commit, genId, sb]
  );

  const updateExpense: StoreContextValue["updateExpense"] = useCallback(
    (id, patch) => {
      const d = dataRef.current;
      commit({
        ...d,
        expenses: d.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      });
      if (SUPA) sync(db.updateExpense(sb(), id, patch));
    },
    [commit, sb]
  );

  const deleteExpense: StoreContextValue["deleteExpense"] = useCallback(
    (id) => {
      const d = dataRef.current;
      commit({ ...d, expenses: d.expenses.filter((e) => e.id !== id) });
      if (SUPA) sync(db.deleteExpense(sb(), id));
    },
    [commit, sb]
  );

  // ---------------- members ----------------
  const addMember: StoreContextValue["addMember"] = useCallback(
    (m) => {
      const d = dataRef.current;
      const member: Member = {
        ...m,
        id: genId("mem"),
        createdAt: new Date().toISOString(),
      };
      commit({ ...d, members: [...d.members, member] });
      if (SUPA) sync(db.insertMember(sb(), member));
    },
    [commit, genId, sb]
  );

  const deleteMember: StoreContextValue["deleteMember"] = useCallback(
    (id) => {
      const d = dataRef.current;
      commit({ ...d, members: d.members.filter((m) => m.id !== id) });
      if (SUPA) sync(db.deleteMember(sb(), id));
    },
    [commit, sb]
  );

  // ---------------- profile ----------------
  const updateProfile: StoreContextValue["updateProfile"] = useCallback(
    (patch) => {
      const d = dataRef.current;
      commit({ ...d, profile: { ...d.profile, ...patch } });
      if (SUPA && userIdRef.current)
        sync(db.updateProfile(sb(), userIdRef.current, patch));
    },
    [commit, sb]
  );

  const resetDemo = useCallback(() => {
    // Only meaningful in demo mode; the Supabase-backed app has no seed to reset.
    if (SUPA) return;
    commit(buildSeed());
  }, [commit]);

  const activeLine = useMemo(() => {
    if (data.activeLineId === ALL_LINES && data.lines.length > 0) {
      return {
        id: ALL_LINES,
        name: "All Lines",
        loanType: "daily",
        interestRate: 0,
        processingFees: 0,
        installmentsPeriod: 0,
        badLoanDays: 0,
        closeLoanManually: false,
        enableCustomerNumber: false,
        createdAt: "",
      } as Line;
    }
    return data.lines.find((l) => l.id === data.activeLineId) ?? data.lines[0] ?? null;
  }, [data.lines, data.activeLineId]);

  const value: StoreContextValue = {
    data,
    ready,
    activeLine,
    setActiveLine,
    addLine,
    updateLine,
    deleteLine,
    addArea,
    deleteArea,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addLoan,
    updateLoan,
    deleteLoan,
    setLoanStatus,
    addPayment,
    updatePayment,
    deletePayment,
    collect,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addExpense,
    updateExpense,
    deleteExpense,
    addMember,
    deleteMember,
    updateProfile,
    resetDemo,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

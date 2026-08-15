"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { buildSeed, uid } from "./seed";
import { loanOutstanding, ALL_LINES } from "./selectors";

const STORAGE_KEY = "vasoolx.data.v1";

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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => buildSeed());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setData(JSON.parse(raw));
      } else {
        const seed = buildSeed();
        setData(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch {
      setData(buildSeed());
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: AppData) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }, []);

  const update = useCallback(
    (fn: (d: AppData) => AppData) => {
      persist(fn(data));
    },
    [data, persist]
  );

  const setActiveLine = useCallback(
    (id: string) => update((d) => ({ ...d, activeLineId: id })),
    [update]
  );

  const addLine: StoreContextValue["addLine"] = useCallback(
    (l) => {
      const line: Line = { ...l, id: uid("line"), createdAt: new Date().toISOString() };
      persist({
        ...data,
        lines: [...data.lines, line],
        activeLineId: data.activeLineId ?? line.id,
      });
      return line;
    },
    [data, persist]
  );

  const updateLine: StoreContextValue["updateLine"] = useCallback(
    (id, patch) =>
      update((d) => ({
        ...d,
        lines: d.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      })),
    [update]
  );

  const deleteLine: StoreContextValue["deleteLine"] = useCallback(
    (id) => {
      // Block deletion if there are active loans on this line
      const hasActiveLoans = data.loans.some(
        (l) => l.lineId === id && l.status === "active"
      );
      if (hasActiveLoans) return false;

      update((d) => {
        const lines = d.lines.filter((l) => l.id !== id);
        return {
          ...d,
          lines,
          areas: d.areas.filter((a) => a.lineId !== id),
          customers: d.customers.filter((c) => c.lineId !== id),
          loans: d.loans.filter((l) => l.lineId !== id),
          payments: d.payments.filter((p) => p.lineId !== id),
          investments: d.investments.filter((i) => i.lineId !== id),
          expenses: d.expenses.filter((e) => e.lineId !== id),
          activeLineId:
            d.activeLineId === id ? lines[0]?.id ?? null : d.activeLineId,
        };
      });
      return true;
    },
    [data.loans, update]
  );

  const addArea: StoreContextValue["addArea"] = useCallback(
    (name, lineId) =>
      update((d) => ({
        ...d,
        areas: [
          ...d.areas,
          { id: uid("area"), lineId, name, createdAt: new Date().toISOString() },
        ],
      })),
    [update]
  );

  const deleteArea: StoreContextValue["deleteArea"] = useCallback(
    (id) =>
      update((d) => ({
        ...d,
        areas: d.areas.filter((a) => a.id !== id),
        customers: d.customers.map((c) =>
          c.areaId === id ? { ...c, areaId: null } : c
        ),
      })),
    [update]
  );

  const addCustomer: StoreContextValue["addCustomer"] = useCallback(
    (c) =>
      update((d) => ({
        ...d,
        customers: [
          ...d.customers,
          { ...c, id: uid("cust"), createdAt: new Date().toISOString() },
        ],
      })),
    [update]
  );

  const updateCustomer: StoreContextValue["updateCustomer"] = useCallback(
    (id, patch) =>
      update((d) => ({
        ...d,
        customers: d.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),
    [update]
  );

  const deleteCustomer: StoreContextValue["deleteCustomer"] = useCallback(
    (id) => {
      // Block deletion if the customer has active loans
      const hasActiveLoans = data.loans.some(
        (l) => l.customerId === id && l.status === "active"
      );
      if (hasActiveLoans) return false;

      update((d) => ({
        ...d,
        customers: d.customers.filter((c) => c.id !== id),
        loans: d.loans.filter((l) => l.customerId !== id),
        payments: d.payments.filter((p) => p.customerId !== id),
      }));
      return true;
    },
    [data.loans, update]
  );

  const addLoan: StoreContextValue["addLoan"] = useCallback(
    (l) => {
      const loan: Loan = { ...l, id: uid("loan"), createdAt: new Date().toISOString() };
      update((d) => ({ ...d, loans: [...d.loans, loan] }));
      return loan;
    },
    [update]
  );

  const updateLoan: StoreContextValue["updateLoan"] = useCallback(
    (id, patch) =>
      update((d) => ({
        ...d,
        loans: d.loans.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      })),
    [update]
  );

  const deleteLoan: StoreContextValue["deleteLoan"] = useCallback(
    (id) => {
      let ok = false;
      update((d) => {
        ok = true;
        return { 
          ...d, 
          loans: d.loans.filter((l) => l.id !== id),
          payments: d.payments.filter((p) => p.loanId !== id) 
        };
      });
      return ok;
    },
    [update]
  );

  const setLoanStatus: StoreContextValue["setLoanStatus"] = useCallback(
    (id, status) => updateLoan(id, { status }),
    [updateLoan]
  );

  const addPayment: StoreContextValue["addPayment"] = useCallback(
    (p) =>
      update((d) => {
        const newPayments = [...d.payments, { ...p, id: uid("pay") }];
        const loan = d.loans.find((l) => l.id === p.loanId);
        const line = loan ? d.lines.find((ln) => ln.id === loan.lineId) : null;
        let updatedLoans = d.loans;
        if (loan && loan.status === "active" && line && !line.closeLoanManually) {
          const totalPaid = newPayments
            .filter((pay) => pay.loanId === loan.id)
            .reduce((s, pay) => s + pay.amount, 0);
          const totalDue = loan.installmentAmount * loan.installments;
          if (totalPaid >= totalDue) {
            updatedLoans = d.loans.map((l) =>
              l.id === loan.id ? { ...l, status: "closed" as const } : l
            );
          }
        }
        return { ...d, payments: newPayments, loans: updatedLoans };
      }),
    [update]
  );

  const updatePayment: StoreContextValue["updatePayment"] = useCallback(
    (id, patch) =>
      update((d) => {
        const newPayments = d.payments.map((p) => (p.id === id ? { ...p, ...patch } : p));
        const payment = newPayments.find((p) => p.id === id);
        const loan = payment ? d.loans.find((l) => l.id === payment.loanId) : null;
        const line = loan ? d.lines.find((ln) => ln.id === loan.lineId) : null;
        let updatedLoans = d.loans;
        if (loan && line && !line.closeLoanManually) {
          const totalPaid = newPayments
            .filter((pay) => pay.loanId === loan.id)
            .reduce((s, pay) => s + pay.amount, 0);
          const totalDue = loan.installmentAmount * loan.installments;
          const status = totalPaid >= totalDue ? "closed" : "active";
          updatedLoans = d.loans.map((l) =>
            l.id === loan.id ? { ...l, status } : l
          );
        }
        return { ...d, payments: newPayments, loans: updatedLoans };
      }),
    [update]
  );

  const deletePayment: StoreContextValue["deletePayment"] = useCallback(
    (id) => {
      let ok = false;
      update((d) => {
        ok = true;
        const payment = d.payments.find((p) => p.id === id);
        const newPayments = d.payments.filter((p) => p.id !== id);
        const loan = payment ? d.loans.find((l) => l.id === payment.loanId) : null;
        const line = loan ? d.lines.find((ln) => ln.id === loan.lineId) : null;
        let updatedLoans = d.loans;
        if (loan && line && !line.closeLoanManually) {
          const totalPaid = newPayments
            .filter((pay) => pay.loanId === loan.id)
            .reduce((s, pay) => s + pay.amount, 0);
          const totalDue = loan.installmentAmount * loan.installments;
          const status = totalPaid >= totalDue ? "closed" : "active";
          updatedLoans = d.loans.map((l) =>
            l.id === loan.id ? { ...l, status } : l
          );
        }
        return { ...d, payments: newPayments, loans: updatedLoans };
      });
      return ok;
    },
    [update]
  );

  // Collect one installment for each active loan in a line (optionally by area / subset)
  const collect: StoreContextValue["collect"] = useCallback(
    ({ lineId, areaId, date, loanIds }) => {
      let count = 0;
      update((d) => {
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
            id: uid("pay"),
            loanId: l.id,
            customerId: l.customerId,
            lineId,
            amount,
            date,
            method: "cash",
            note: "",
          });
        }
        count = newPayments.length;

        // Auto-close fully-paid loans (unless closeLoanManually is set)
        const line = d.lines.find((ln) => ln.id === lineId);
        const allPayments = [...d.payments, ...newPayments];
        let updatedLoans = d.loans;
        if (line && !line.closeLoanManually) {
          const paidByLoan = new Map<string, number>();
          for (const p of allPayments) {
            paidByLoan.set(p.loanId, (paidByLoan.get(p.loanId) ?? 0) + p.amount);
          }
          updatedLoans = d.loans.map((l) => {
            if (l.lineId !== lineId || l.status !== "active") return l;
            const totalDue = l.installmentAmount * l.installments;
            const totalPaid = paidByLoan.get(l.id) ?? 0;
            if (totalPaid >= totalDue) return { ...l, status: "closed" as const };
            return l;
          });
        }

        return { ...d, payments: allPayments, loans: updatedLoans };
      });
      return count;
    },
    [update]
  );

  const addInvestment: StoreContextValue["addInvestment"] = useCallback(
    (i) =>
      update((d) => ({
        ...d,
        investments: [...d.investments, { ...i, id: uid("inv") }],
      })),
    [update]
  );

  const updateInvestment: StoreContextValue["updateInvestment"] = useCallback(
    (id, patch) =>
      update((d) => ({
        ...d,
        investments: d.investments.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      })),
    [update]
  );

  const deleteInvestment: StoreContextValue["deleteInvestment"] = useCallback(
    (id) =>
      update((d) => ({
        ...d,
        investments: d.investments.filter((i) => i.id !== id),
      })),
    [update]
  );

  const addExpense: StoreContextValue["addExpense"] = useCallback(
    (e) =>
      update((d) => ({
        ...d,
        expenses: [...d.expenses, { ...e, id: uid("exp") }],
      })),
    [update]
  );

  const updateExpense: StoreContextValue["updateExpense"] = useCallback(
    (id, patch) =>
      update((d) => ({
        ...d,
        expenses: d.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      })),
    [update]
  );

  const deleteExpense: StoreContextValue["deleteExpense"] = useCallback(
    (id) =>
      update((d) => ({
        ...d,
        expenses: d.expenses.filter((e) => e.id !== id),
      })),
    [update]
  );

  const addMember: StoreContextValue["addMember"] = useCallback(
    (m) =>
      update((d) => ({
        ...d,
        members: [
          ...d.members,
          { ...m, id: uid("mem"), createdAt: new Date().toISOString() },
        ],
      })),
    [update]
  );

  const deleteMember: StoreContextValue["deleteMember"] = useCallback(
    (id) =>
      update((d) => ({ ...d, members: d.members.filter((m) => m.id !== id) })),
    [update]
  );

  const updateProfile: StoreContextValue["updateProfile"] = useCallback(
    (patch) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } })),
    [update]
  );

  const resetDemo = useCallback(() => {
    const seed = buildSeed();
    persist(seed);
  }, [persist]);

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

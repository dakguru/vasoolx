import type { AppData } from "./types";

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

function iso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

// A realistic seed so the app feels alive on first run. Users can reset.
export function buildSeed(): AppData {
  const lineId = "line_karur";
  const areaNorth = "area_north";
  const areaMarket = "area_market";

  const customers = [
    { id: "cust_1", name: "Murugan S", area: areaNorth, phone: "9842011001" },
    { id: "cust_2", name: "Lakshmi R", area: areaNorth, phone: "9842011002" },
    { id: "cust_3", name: "Arun Kumar", area: areaMarket, phone: "9842011003" },
    { id: "cust_4", name: "Fathima B", area: areaMarket, phone: "9842011004" },
    { id: "cust_5", name: "Selvam P", area: areaNorth, phone: "9842011005" },
    { id: "cust_6", name: "Karthik V", area: areaMarket, phone: "9842011006" },
  ].map((c, i) => ({
    id: c.id,
    lineId,
    areaId: c.area,
    name: c.name,
    phone: c.phone,
    sortOrder: i + 1,
    address: "",
    notes: "",
    photoUrl: null,
    createdAt: iso(30 - i * 3),
  }));

  const loanDefs = [
    { cust: "cust_1", principal: 10000, inst: 400, n: 30, start: 12, status: "active" },
    { cust: "cust_2", principal: 5000, inst: 200, n: 30, start: 20, status: "active" },
    { cust: "cust_3", principal: 20000, inst: 800, n: 30, start: 8, status: "active" },
    { cust: "cust_4", principal: 15000, inst: 600, n: 30, start: 25, status: "active" },
    { cust: "cust_5", principal: 8000, inst: 320, n: 30, start: 18, status: "bad" },
    { cust: "cust_6", principal: 12000, inst: 480, n: 30, start: 40, status: "closed" },
  ] as const;

  const loans = loanDefs.map((l) => {
    const processingFees = Math.round(l.principal * 0.02);
    return {
      id: `loan_${l.cust}`,
      customerId: l.cust,
      lineId,
      principal: l.principal,
      interest: l.inst * l.n - l.principal,
      processingFees,
      disbursed: l.principal - processingFees,
      type: "daily" as const,
      installmentAmount: l.inst,
      installments: l.n,
      badLoanDays: 15,
      method: "cash" as const,
      startDate: iso(l.start),
      status: l.status,
      createdAt: iso(l.start),
    };
  });

  // Generate payments over the last 10 days for active loans
  const payments: AppData["payments"] = [];
  for (const l of loans) {
    if (l.status === "closed") {
      for (let d = 0; d < l.installments; d++) {
        payments.push({
          id: uid("pay"),
          loanId: l.id,
          customerId: l.customerId,
          lineId,
          amount: l.installmentAmount,
          date: iso(40 - d),
          method: "cash",
          note: "",
        });
      }
      continue;
    }
    if (l.status === "bad") continue;
    for (let d = 9; d >= 0; d--) {
      // skip every 7th day deterministically
      if (d % 7 === 3) continue;
      payments.push({
        id: `pay_${l.id}_d${d}`,
        loanId: l.id,
        customerId: l.customerId,
        lineId,
        amount: l.installmentAmount,
        date: iso(d),
        method: d % 5 === 0 ? "online" : "cash",
        note: "",
      });
    }
  }

  return {
    lines: [
      {
        id: lineId,
        name: "Karur",
        loanType: "daily",
        interestRate: 5,
        processingFees: 2,
        installmentsPeriod: 30,
        badLoanDays: 15,
        closeLoanManually: false,
        enableCustomerNumber: false,
        createdAt: iso(45),
      },
    ],
    areas: [
      { id: areaNorth, lineId, name: "North Area", createdAt: iso(44) },
      { id: areaMarket, lineId, name: "Market Street", createdAt: iso(44) },
    ],
    customers,
    loans,
    payments,
    investments: [
      {
        id: uid("inv"),
        lineId,
        type: "Capital",
        amount: 100000,
        method: "cash",
        date: iso(45),
        note: "Opening capital",
      },
      {
        id: uid("inv"),
        lineId,
        type: "Top-up",
        amount: 25000,
        method: "bank",
        date: iso(15),
        note: "",
      },
    ],
    expenses: [
      {
        id: uid("exp"),
        lineId,
        type: "Fuel",
        amount: 800,
        method: "cash",
        date: iso(3),
        note: "Bike petrol",
      },
      {
        id: uid("exp"),
        lineId,
        type: "Tea & snacks",
        amount: 250,
        method: "cash",
        date: iso(1),
        note: "",
      },
    ],
    members: [],
    profile: {
      name: "Demo User",
      email: "demo@vasoolx.app",
      phone: "9876543210",
    },
    activeLineId: lineId,
  };
}

export function emptyData(): AppData {
  return {
    lines: [],
    areas: [],
    customers: [],
    loans: [],
    payments: [],
    investments: [],
    expenses: [],
    members: [],
    profile: { name: "", email: "", phone: "" },
    activeLineId: null,
  };
}

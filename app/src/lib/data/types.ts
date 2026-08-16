export type LoanType = "daily" | "weekly" | "monthly";
export type PaymentMethod = "cash" | "online" | "bank";
export type LoanStatus = "active" | "closed" | "bad";
export type AccessType = "agent" | "partner";

export interface Line {
  id: string;
  name: string;
  loanType: LoanType;
  interestRate: number;
  processingFees: number;
  installmentsPeriod: number;
  badLoanDays: number;
  closeLoanManually: boolean;
  enableCustomerNumber: boolean;
  createdAt: string;
}

export interface Area {
  id: string;
  lineId: string;
  name: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  lineId: string;
  areaId: string | null;
  name: string;
  phone: string;
  sortOrder: number;
  address: string;
  notes: string;
  photoUrl: string | null;
  createdAt: string;
}

export interface Loan {
  id: string;
  customerId: string;
  lineId: string;
  principal: number;
  interest: number; // flat interest amount added to principal
  processingFees: number;
  disbursed: number; // cash on customer's hand = principal - processing fee
  type: LoanType;
  installmentAmount: number;
  installments: number;
  badLoanDays: number;
  method: PaymentMethod;
  startDate: string;
  status: LoanStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  loanId: string;
  customerId: string;
  lineId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  note: string;
}

export interface Investment {
  id: string;
  lineId: string;
  type: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  note: string;
}

export interface Expense {
  id: string;
  lineId: string;
  type: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  note: string;
}

export interface Member {
  id: string;
  lineId: string | null; // null = all lines in the workspace (partner "All")
  areaId: string | null; // null = whole line (agents can be scoped to one area)
  phone: string;
  name: string;
  accessType: AccessType;
  status: "pending" | "active";
  permissions: Record<string, boolean>;
  createdAt: string;
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
}

export interface AppData {
  lines: Line[];
  areas: Area[];
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  investments: Investment[];
  expenses: Expense[];
  members: Member[];
  profile: Profile;
  activeLineId: string | null;
}

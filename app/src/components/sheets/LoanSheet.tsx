"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Input, Label, Segmented, Select } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inr, fromDateInput, toDateInput } from "@/lib/format";
import type { Customer, LoanType, PaymentMethod } from "@/lib/data/types";

export function LoanSheet({
  open,
  onClose,
  customer,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  onCreated?: (loanId: string) => void;
}) {
  const { t } = useI18n();
  const { activeLine, addLoan } = useStore();

  const [type, setType] = useState<LoanType>("daily");
  const [date, setDate] = useState(toDateInput(new Date().toISOString()));
  const [amount, setAmount] = useState("");
  const [interest, setInterest] = useState("");
  const [period, setPeriod] = useState("30");
  const [processing, setProcessing] = useState("");
  const [badDays, setBadDays] = useState("15");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    if (open && activeLine) {
      setType(activeLine.loanType);
      setPeriod(String(activeLine.installmentsPeriod || 30));
      setBadDays(String(activeLine.badLoanDays || 15));
      setProcessing("");
      setDate(toDateInput(new Date().toISOString()));
      setAmount("");
      setInterest("");
      setCalculated(false);
    }
  }, [open, activeLine]);

  const principal = Number(amount) || 0;
  const interestAmt = Number(interest) || 0;
  const periodDays = Number(period) || 1;
  const processingN = Number(processing) || 0;

  // Derive installment count from period (days) and loan type
  const installmentCount =
    type === "monthly"
      ? Math.max(1, Math.round(periodDays / 30))
      : type === "weekly"
        ? Math.max(1, Math.round(periodDays / 7))
        : Math.max(1, periodDays); // daily

  const totalRepay = principal + interestAmt;
  const installmentAmount = Math.round(totalRepay / installmentCount);
  const cashOnHand = Math.max(0, principal - processingN);

  // Auto-suggest interest from line rate when amount changes
  useEffect(() => {
    if (open && activeLine && amount) {
      const suggested = Math.round((Number(amount) || 0) * (activeLine.interestRate / 100));
      setInterest(String(suggested));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, type]);

  // Auto-suggest processing fees from line rate when amount changes
  useEffect(() => {
    if (open && activeLine && amount) {
      const suggested = Math.round((Number(amount) || 0) * (activeLine.processingFees / 100));
      setProcessing(String(suggested));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  function save() {
    if (!activeLine || principal <= 0) return;
    const loan = addLoan({
      customerId: customer.id,
      lineId: activeLine.id,
      principal,
      interest: interestAmt,
      processingFees: processingN,
      disbursed: cashOnHand,
      type,
      installmentAmount,
      installments: installmentCount,
      badLoanDays: Number(badDays) || 0,
      method,
      startDate: fromDateInput(date),
      status: "active",
    });
    onClose();
    onCreated?.(loan.id);
  }

  if (!activeLine) return null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("loan.new")}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setCalculated(true)}>
            {t("loan.calculate")}
          </Button>
          <Button className="flex-1" onClick={save} disabled={principal <= 0}>
            {t("loan.addLoan")}
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <div className="text-lg font-bold text-[color:var(--text)]">
          {t("loan.cashOnHand")} : <span className="text-[color:var(--brand)]">{inr(cashOnHand)}</span>
        </div>
        <div className="text-sm text-[color:var(--text-soft)]">{customer.name}</div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <Label>{t("line.loanType")}</Label>
          <Segmented<LoanType>
            value={type}
            onChange={setType}
            options={[
              { value: "daily", label: t("line.daily") },
              { value: "weekly", label: t("line.weekly") },
              { value: "monthly", label: t("line.monthly") },
            ]}
          />
        </div>

        <div>
          <Label>{t("loan.loanDate")}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>{t("loan.loanAmount")}</Label>
            <MoneyInput value={amount} onChange={setAmount} autoFocus />
          </div>
          <div>
            <Label required>{t("loan.interestAmount")}</Label>
            <MoneyInput value={interest} onChange={setInterest} />
          </div>
          <div>
            <Label required>{t("loan.loanPeriod")}</Label>
            <Input type="number" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <div>
            <Label>{t("line.processingFees")}</Label>
            <MoneyInput value={processing} onChange={setProcessing} />
          </div>
          <div>
            <Label>{t("loan.badLoanThreshold")}</Label>
            <Input type="number" value={badDays} onChange={(e) => setBadDays(e.target.value)} />
          </div>
          <div>
            <Label>{t("fin.paymentType")}</Label>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              <option value="cash">{t("fin.cash")}</option>
              <option value="online">{t("fin.online")}</option>
              <option value="bank">{t("fin.bank")}</option>
            </Select>
          </div>
        </div>

        {(calculated || principal > 0) && (
          <div className="rounded-2xl p-4 bg-[color:var(--brand)]/8 grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-[color:var(--text-soft)]">{t("loan.totalRepayable")}</span>
            <span className="text-right font-bold text-[color:var(--brand)]">{inr(totalRepay)}</span>
            <span className="text-[color:var(--text-soft)]">{t("loan.perInstallment")} ({installmentCount})</span>
            <span className="text-right font-semibold text-[color:var(--text)]">{inr(installmentAmount)}</span>
            <span className="text-[color:var(--text-soft)]">{t("loan.cashOnHand")}</span>
            <span className="text-right font-semibold text-[color:var(--text)]">{inr(cashOnHand)}</span>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function MoneyInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]">₹</span>
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-7"
        autoFocus={autoFocus}
      />
    </div>
  );
}

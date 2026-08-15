"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { fromDateInput, toDateInput } from "@/lib/format";
import type { PaymentMethod } from "@/lib/data/types";

const EXPENSE_TYPES = ["Fuel", "Salary", "Rent", "Tea & snacks", "Office", "Travel", "Other"];
const INVESTMENT_TYPES = ["Capital", "Top-up", "Partner", "Loan repayment", "Other"];

export function FinanceSheet({
  open,
  onClose,
  kind,
}: {
  open: boolean;
  onClose: () => void;
  kind: "investment" | "expense";
}) {
  const { t } = useI18n();
  const { activeLine, addExpense, addInvestment } = useStore();

  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState(toDateInput(new Date().toISOString()));
  const [note, setNote] = useState("");

  const isExp = kind === "expense";

  function reset() {
    setType("");
    setAmount("");
    setMethod("cash");
    setNote("");
  }

  function save() {
    if (!activeLine || !type || !amount) return;
    const payload = {
      lineId: activeLine.id,
      type,
      amount: Number(amount) || 0,
      method,
      date: fromDateInput(date),
      note,
    };
    if (isExp) addExpense(payload);
    else addInvestment(payload);
    reset();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isExp ? t("fin.addExpense") : t("fin.addInvestment")}
      footer={
        <Button full size="lg" onClick={save} disabled={!type || !amount}>
          {t("common.save")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <Label>{isExp ? t("fin.selectExpenseType") : t("fin.investmentType")}</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">—</option>
            {(isExp ? EXPENSE_TYPES : INVESTMENT_TYPES).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{isExp ? t("fin.expenseAmount") : t("fin.investmentAmount")}</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]">
              ₹
            </span>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="pl-8"
            />
          </div>
        </div>
        <div>
          <Label>{t("fin.paymentType")}</Label>
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            <option value="cash">{t("fin.cash")}</option>
            <option value="online">{t("fin.online")}</option>
            <option value="bank">{t("fin.bank")}</option>
          </Select>
        </div>
        <div>
          <Label>{t("fin.date")}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>{t("fin.noteOptional")}</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("fin.addNote")}
          />
        </div>
      </div>
    </Sheet>
  );
}

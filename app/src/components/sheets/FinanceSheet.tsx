"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { ALL_LINES } from "@/lib/data/selectors";
import { fromDateInput, toDateInput } from "@/lib/format";
import type { PaymentMethod, Investment, Expense } from "@/lib/data/types";

const EXPENSE_TYPES = ["Fuel", "Salary", "Rent", "Tea & snacks", "Office", "Travel", "Other"];
const INVESTMENT_TYPES = ["Capital", "Top-up", "Partner", "Loan repayment", "Other"];

export function FinanceSheet({
  open,
  onClose,
  kind,
  editItem,
}: {
  open: boolean;
  onClose: () => void;
  kind: "investment" | "expense";
  editItem?: Investment | Expense | null;
}) {
  const { t } = useI18n();
  const { data, activeLine, addExpense, addInvestment, updateExpense, updateInvestment } = useStore();
  // Attach new finance entries to a concrete line, never the "all" sentinel.
  const targetLineId =
    activeLine?.id === ALL_LINES ? data.lines[0]?.id ?? null : activeLine?.id ?? null;

  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState(toDateInput(new Date().toISOString()));
  const [note, setNote] = useState("");

  const isExp = kind === "expense";

  useEffect(() => {
    if (editItem && open) {
      setType(editItem.type);
      setAmount(String(editItem.amount));
      setMethod(editItem.method);
      setDate(toDateInput(editItem.date));
      setNote(editItem.note || "");
    } else if (open) {
      reset();
      setDate(toDateInput(new Date().toISOString()));
    }
  }, [editItem, open]);

  function reset() {
    setType("");
    setAmount("");
    setMethod("cash");
    setNote("");
  }

  function save() {
    if (!activeLine || !targetLineId || !type || !amount) return;
    const payload = {
      type,
      amount: Number(amount) || 0,
      method,
      date: fromDateInput(date),
      note,
    };
    if (editItem) {
      if (isExp) updateExpense(editItem.id, payload);
      else updateInvestment(editItem.id, payload);
    } else {
      const createPayload = { ...payload, lineId: targetLineId };
      if (isExp) addExpense(createPayload);
      else addInvestment(createPayload);
    }
    reset();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editItem ? (isExp ? t("fin.editExpense") || "Edit Expense" : t("fin.editInvestment") || "Edit Investment") : (isExp ? t("fin.addExpense") : t("fin.addInvestment"))}
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

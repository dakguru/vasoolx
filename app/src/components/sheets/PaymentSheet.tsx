"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { fromDateInput, toDateInput } from "@/lib/format";
import type { Payment, PaymentMethod } from "@/lib/data/types";

export function PaymentSheet({
  open,
  onClose,
  payment,
}: {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
}) {
  const { t } = useI18n();
  const { updatePayment } = useStore();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState(toDateInput(new Date().toISOString()));
  const [note, setNote] = useState("");

  useEffect(() => {
    if (payment && open) {
      setAmount(String(payment.amount));
      setMethod(payment.method);
      setDate(toDateInput(payment.date));
      setNote(payment.note || "");
    }
  }, [payment, open]);

  function save() {
    if (!payment || !amount) return;
    updatePayment(payment.id, {
      amount: Number(amount) || 0,
      method,
      date: fromDateInput(date),
      note,
    });
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("pay.editPayment") || "Edit Payment"}
      footer={
        <Button full size="lg" onClick={save} disabled={!amount}>
          {t("common.save")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <Label>{t("pay.amountCollected") || "Amount Collected"}</Label>
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
          <Label>{t("fin.paymentType") || "Payment Type"}</Label>
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            <option value="cash">{t("fin.cash") || "Cash"}</option>
            <option value="online">{t("fin.online") || "Online"}</option>
            <option value="bank">{t("fin.bank") || "Bank"}</option>
          </Select>
        </div>
        <div>
          <Label>{t("fin.date") || "Date"}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>{t("fin.noteOptional") || "Note (Optional)"}</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("common.additionalDetails")}
          />
        </div>
      </div>
    </Sheet>
  );
}

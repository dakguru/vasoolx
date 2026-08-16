"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Input, Label, Segmented, Toggle } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import type { Line, LoanType } from "@/lib/data/types";

export function LineSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Line | null;
}) {
  const { t } = useI18n();
  const { data, addLine, updateLine, addArea, deleteArea } = useStore();

  const [name, setName] = useState("");
  const [loanType, setLoanType] = useState<LoanType>("daily");
  const [interestRate, setInterestRate] = useState("5");
  const [processingFees, setProcessingFees] = useState("2");
  const [installmentsPeriod, setInstallmentsPeriod] = useState("30");
  const [badLoanDays, setBadLoanDays] = useState("15");
  const [closeManual, setCloseManual] = useState(false);
  const [enableCustNo, setEnableCustNo] = useState(false);
  const [areaList, setAreaList] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState("");

  useEffect(() => {
    setAreaInput("");
    if (editing) {
      setName(editing.name);
      setLoanType(editing.loanType);
      setInterestRate(String(editing.interestRate));
      setProcessingFees(String(editing.processingFees));
      setInstallmentsPeriod(String(editing.installmentsPeriod));
      setBadLoanDays(String(editing.badLoanDays));
      setCloseManual(editing.closeLoanManually);
      setEnableCustNo(editing.enableCustomerNumber);
      setAreaList(data.areas.filter((a) => a.lineId === editing.id).map((a) => a.name));
    } else {
      setName("");
      setLoanType("daily");
      setInterestRate("5");
      setProcessingFees("2");
      setInstallmentsPeriod("30");
      setBadLoanDays("15");
      setCloseManual(false);
      setEnableCustNo(false);
      setAreaList([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open]);

  function addAreaToList() {
    const v = areaInput.trim();
    if (!v) return;
    if (!areaList.some((a) => a.toLowerCase() === v.toLowerCase())) setAreaList([...areaList, v]);
    setAreaInput("");
  }

  function save() {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      loanType,
      interestRate: Number(interestRate) || 0,
      processingFees: Number(processingFees) || 0,
      installmentsPeriod: Number(installmentsPeriod) || 0,
      badLoanDays: Number(badLoanDays) || 0,
      closeLoanManually: closeManual,
      enableCustomerNumber: enableCustNo,
    };
    const lineId = editing ? (updateLine(editing.id, payload), editing.id) : addLine(payload).id;

    // Reconcile areas: add newly-listed names; on edit, remove ones taken off the list.
    const wanted = areaList.map((a) => a.trim()).filter(Boolean);
    const existing = data.areas.filter((a) => a.lineId === lineId);
    const existingLower = new Set(existing.map((a) => a.name.trim().toLowerCase()));
    const wantedLower = new Set(wanted.map((w) => w.toLowerCase()));
    for (const w of wanted) if (!existingLower.has(w.toLowerCase())) addArea(w, lineId);
    if (editing) for (const a of existing) if (!wantedLower.has(a.name.trim().toLowerCase())) deleteArea(a.id);

    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? t("line.editLine") : t("line.newLine")}
      footer={
        <Button full size="lg" onClick={save} disabled={!name.trim()}>
          {editing ? t("line.updateLine") : t("line.createLine")}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <Label required>{t("line.lineName")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        <div>
          <Label>{t("line.loanType")}</Label>
          <Segmented<LoanType>
            value={loanType}
            onChange={setLoanType}
            options={[
              { value: "daily", label: t("line.daily") },
              { value: "weekly", label: t("line.weekly") },
              { value: "monthly", label: t("line.monthly") },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t("line.interestRate")}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]">%</span>
              <Input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div>
            <Label>{t("line.processingFees")}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]">%</span>
              <Input
                type="number"
                value={processingFees}
                onChange={(e) => setProcessingFees(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div>
            <Label>{t("line.installmentsPeriod")}</Label>
            <Input
              type="number"
              value={installmentsPeriod}
              onChange={(e) => setInstallmentsPeriod(e.target.value)}
            />
          </div>
          <div>
            <Label>{t("line.badLoanDays")}</Label>
            <Input
              type="number"
              value={badLoanDays}
              onChange={(e) => setBadLoanDays(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>{t("line.areasOptional")}</Label>
          <div className="flex gap-2">
            <Input
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              placeholder={t("area.areaNamePlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addAreaToList(); }
              }}
            />
            <Button variant="outline" onClick={addAreaToList} disabled={!areaInput.trim()}>
              {t("common.add")}
            </Button>
          </div>
          {areaList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {areaList.map((a, i) => (
                <span key={`${a}-${i}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 bg-[color:var(--brand)]/10 text-[color:var(--brand)] text-[13px] font-medium">
                  {a}
                  <button type="button" aria-label="Remove" onClick={() => setAreaList(areaList.filter((_, idx) => idx !== i))} className="hover:opacity-70">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="mt-1.5 text-[12px] text-[color:var(--text-soft)]">{t("line.areasHint")}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-[color:var(--text)]">
            {t("line.closeLoanManually")}
          </span>
          <Toggle checked={closeManual} onChange={setCloseManual} />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-[color:var(--text)]">
            {t("line.enableCustomerNumber")}
          </span>
          <Toggle checked={enableCustNo} onChange={setEnableCustNo} />
        </div>
      </div>
    </Sheet>
  );
}

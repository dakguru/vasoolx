"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import {
  Button,
  Input,
  Label,
  PhoneInput,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { ALL_LINES } from "@/lib/data/selectors";
import type { Customer } from "@/lib/data/types";

export function CustomerSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Customer | null;
}) {
  const { t } = useI18n();
  const { data, activeLine, addCustomer, updateCustomer } = useStore();
  // In the consolidated "All Lines" view, resolve to a concrete line so new
  // records are never orphaned with lineId "all".
  const targetLineId =
    activeLine?.id === ALL_LINES ? data.lines[0]?.id ?? null : activeLine?.id ?? null;
  const areas = data.areas.filter((a) => a.lineId === targetLineId);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [areaId, setAreaId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setPhone(editing?.phone ?? "");
    setAreaId(editing?.areaId ?? "");
    setSortOrder(String(editing?.sortOrder ?? 0));
    setAddress(editing?.address ?? "");
    setNotes(editing?.notes ?? "");
  }, [open, editing]);

  function save() {
    if (!name.trim() || !activeLine || !targetLineId) return;
    if (editing) {
      updateCustomer(editing.id, {
        name: name.trim(),
        phone,
        areaId: areaId || null,
        sortOrder: Number(sortOrder) || 0,
        address,
        notes,
        photoUrl: editing.photoUrl ?? null,
      });
    } else {
      addCustomer({
        lineId: targetLineId,
        areaId: areaId || null,
        name: name.trim(),
        phone,
        sortOrder: Number(sortOrder) || 0,
        address,
        notes,
        photoUrl: null,
      });
    }
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? t("common.edit") : t("cust.addCustomer")}
      footer={
        <Button full size="lg" onClick={save} disabled={!name.trim()}>
          {editing ? t("common.update") : t("cust.addCustomer")}
        </Button>
      }
    >
      <div className="flex items-center gap-4 mb-5">
        <div className="w-20 h-20 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)]">
          <User size={34} />
        </div>
        <div>
          <div className="font-bold text-[color:var(--text)]">
            {t("cust.profilePhoto")}
          </div>
          <div className="text-sm text-[color:var(--text-soft)]">
            {t("cust.tapToAddPhoto")}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <Label required>{t("cust.customerName")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <Label>{t("cust.phoneNumber")}</Label>
          <PhoneInput value={phone} onChange={setPhone} />
        </div>
        <div>
          <Label>{t("cust.area")}</Label>
          <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">{t("common.none")}</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("cust.sortOrder")}</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div>
          <Label>{t("cust.address")}</Label>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("cust.enterAddress")}
          />
        </div>
        <div>
          <Label>{t("cust.notes")}</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("cust.addNotes")}
          />
        </div>
      </div>
    </Sheet>
  );
}

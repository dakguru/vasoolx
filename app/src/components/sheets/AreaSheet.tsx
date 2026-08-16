"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Input, Label, Select } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { ALL_LINES } from "@/lib/data/selectors";

export function AreaSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { data, activeLine, addArea } = useStore();
  const [name, setName] = useState("");
  const [lineId, setLineId] = useState("");

  // An area always belongs to a concrete line. Default to the active line
  // (or the first line when viewing "All Lines"), but let the user choose.
  useEffect(() => {
    if (open) {
      setName("");
      setLineId(
        activeLine && activeLine.id !== ALL_LINES ? activeLine.id : data.lines[0]?.id ?? ""
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function save() {
    if (!name.trim() || !lineId) return;
    addArea(name.trim(), lineId);
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("area.addArea")}
      footer={
        <Button full size="lg" onClick={save} disabled={!name.trim() || !lineId}>
          {t("area.addArea")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <div>
          <Label>{t("rep.line")}</Label>
          <Select value={lineId} onChange={(e) => setLineId(e.target.value)}>
            {data.lines.length === 0 && <option value="">—</option>}
            {data.lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("area.areaName")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("area.areaNamePlaceholder")}
            autoFocus
          />
        </div>
      </div>
    </Sheet>
  );
}

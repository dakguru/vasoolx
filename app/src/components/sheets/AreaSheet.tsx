"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Input, Label } from "@/components/ui/primitives";
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

  // In "All Lines" mode, attach the area to a concrete line, not "all".
  const targetLineId =
    activeLine?.id === ALL_LINES ? data.lines[0]?.id ?? null : activeLine?.id ?? null;

  function save() {
    if (!name.trim() || !targetLineId) return;
    addArea(name.trim(), targetLineId);
    setName("");
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("area.addArea")}
      footer={
        <Button full size="lg" onClick={save} disabled={!name.trim()}>
          {t("area.addArea")}
        </Button>
      }
    >
      <div className="pb-2">
        <Label>{t("area.areaName")}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("area.areaNamePlaceholder")}
          autoFocus
        />
      </div>
    </Sheet>
  );
}

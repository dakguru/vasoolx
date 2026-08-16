"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ChevronLeft, Info } from "lucide-react";
import Link from "next/link";
import { PageHead, Panel, PanelHead } from "@/components/ui/erp";
import {
  Button,
  Label,
  PhoneInput,
  Segmented,
  Select,
  Toggle,
} from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import type { AccessType } from "@/lib/data/types";

type PermKey = "view" | "add" | "editDelete" | "investments";

const PERM_ITEMS: { key: PermKey; labelKey: string }[] = [
  { key: "view", labelKey: "user.permView" },
  { key: "add", labelKey: "user.permAdd" },
  { key: "editDelete", labelKey: "user.permEditDelete" },
  { key: "investments", labelKey: "user.permInvestments" },
];

const DEFAULT_PERMS: Record<AccessType, Record<PermKey, boolean>> = {
  agent: { view: true, add: true, editDelete: false, investments: false },
  partner: { view: true, add: true, editDelete: false, investments: true },
};

export default function AddUserPage() {
  const { t } = useI18n();
  const { data, addMember } = useStore();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [access, setAccess] = useState<AccessType>("agent");
  const [lineId, setLineId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [perms, setPerms] = useState<Record<string, boolean>>({ ...DEFAULT_PERMS.agent });
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const areasOfLine = useMemo(
    () => data.areas.filter((a) => a.lineId === lineId),
    [data.areas, lineId]
  );

  function changeAccess(next: AccessType) {
    setAccess(next);
    setPerms({ ...DEFAULT_PERMS[next] });
    setAreaId("");
    // "All lines" only applies to partners.
    if (next === "agent" && lineId === "all") setLineId("");
  }

  const canSubmit = !!phone && !!lineId;

  function send() {
    if (!canSubmit) return;
    addMember({
      lineId: lineId === "all" ? null : lineId,
      areaId: access === "agent" && areaId ? areaId : null,
      phone,
      name: "",
      accessType: access,
      status: "pending",
      permissions: perms,
    });
    router.replace("/users");
  }

  return (
    <>
      <PageHead
        title={t("user.addUser")}
        subtitle={t("user.addUserSubtitle")}
        actions={<Link href="/users" className="chip"><ChevronLeft size={15} /> {t("sb.users")}</Link>}
      />

      <main className="px-4 md:px-6 py-4 space-y-4 max-w-2xl w-full">
        <Panel className="p-4 space-y-5">
          <div>
            <Label>{t("user.accessType")}</Label>
            <Segmented<AccessType>
              value={access}
              onChange={changeAccess}
              options={[
                { value: "agent", label: t("user.agent") },
                { value: "partner", label: t("user.partner") },
              ]}
            />
          </div>

          <div>
            <Label>{t("cust.phoneNumber")}</Label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>

          <div>
            <Label>{t("user.selectLine")}</Label>
            <Select value={lineId} onChange={(e) => { setLineId(e.target.value); setAreaId(""); }}>
              <option value="">{t("user.chooseLine")}</option>
              {access === "partner" && <option value="all">{t("user.allLines")}</option>}
              {data.lines.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
          </div>

          {/* Agents can be scoped to a single area within the line. */}
          {access === "agent" && (
            <div>
              <Label>{t("user.area")}</Label>
              <Select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                disabled={!lineId || lineId === "all"}
              >
                <option value="">{t("user.allAreas")}</option>
                {areasOfLine.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 bg-[color:var(--brand)]/8 text-[13px] text-[color:var(--text-soft)]">
            <Info size={16} className="text-[color:var(--brand)] mt-0.5 shrink-0" />
            <span>{t("user.linkNote")}</span>
          </div>
        </Panel>

        <Panel>
          <PanelHead title={t("user.instructions")} icon={<ShieldCheck size={15} />} />
          <div className="p-4">
            <ul className="space-y-2.5 text-[color:var(--text-soft)] text-[15px]">
              {PERM_ITEMS.filter((p) => perms[p.key]).map((p) => (
                <li key={p.key} className="flex gap-2">
                  <span className="text-[color:var(--brand)]">•</span>{t(p.labelKey)}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setCustomizeOpen(true)}
              className="mt-4 flex items-center gap-2 h-10 px-4 rounded-lg border border-[color:var(--brand)]/40 text-[color:var(--brand)] font-semibold text-[13px]"
            >
              <ShieldCheck size={16} /> {t("user.customizeAccess")}
            </button>
          </div>
        </Panel>

        <Button full size="lg" onClick={send} disabled={!canSubmit}>
          {t("user.grantAccess")}
        </Button>
      </main>

      <Sheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        title={t("user.customizeAccess")}
        footer={
          <Button full size="lg" onClick={() => setCustomizeOpen(false)}>
            {t("common.save")}
          </Button>
        }
      >
        <p className="text-[13px] text-[color:var(--text-soft)] mb-4">{t("user.customizeDesc")}</p>
        <div className="flex flex-col divide-y divide-[color:var(--line)]">
          {PERM_ITEMS.map((p) => (
            <div key={p.key} className="flex items-center justify-between gap-3 py-3">
              <span className="text-[14px] text-[color:var(--text)]">{t(p.labelKey)}</span>
              <Toggle
                checked={!!perms[p.key]}
                onChange={(v) => setPerms((prev) => ({ ...prev, [p.key]: v }))}
              />
            </div>
          ))}
        </div>
      </Sheet>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import {
  GlassCard,
  Button,
  Label,
  PhoneInput,
  Segmented,
  Select,
} from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import type { AccessType } from "@/lib/data/types";

export default function AddUserPage() {
  const { t } = useI18n();
  const { data, addMember } = useStore();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [lineId, setLineId] = useState("");
  const [access, setAccess] = useState<AccessType>("agent");

  function send() {
    if (!phone || !lineId) return;
    addMember({
      lineId,
      phone,
      name: "",
      accessType: access,
      status: "pending",
    });
    router.replace("/users");
  }

  return (
    <>
      <PageHeader title={t("user.addUser")} back="/users" />

      <main className="px-4 md:px-8 pb-8 space-y-5 max-w-2xl mx-auto w-full">
        <div>
          <Label>{t("cust.phoneNumber")}</Label>
          <PhoneInput value={phone} onChange={setPhone} />
        </div>

        <div>
          <Label>{t("user.selectLine")}</Label>
          <Select value={lineId} onChange={(e) => setLineId(e.target.value)}>
            <option value="">{t("user.chooseLine")}</option>
            {data.lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>{t("user.accessType")}</Label>
          <Segmented<AccessType>
            value={access}
            onChange={setAccess}
            options={[
              { value: "agent", label: t("user.agent") },
              { value: "partner", label: t("user.partner") },
            ]}
          />
        </div>

        <GlassCard className="bg-[color:var(--brand)]/5">
          <h3 className="font-bold text-[color:var(--text)] mb-3">
            {t("user.instructions")}
          </h3>
          <ul className="space-y-2.5 text-[color:var(--text-soft)] text-[15px]">
            {access === "agent" ? (
              <>
                <li className="flex gap-2"><span className="text-[color:var(--brand)]">•</span>{t("user.agentPerm1")}</li>
                <li className="flex gap-2"><span className="text-[color:var(--brand)]">•</span>{t("user.agentPerm2")}</li>
                <li className="flex gap-2"><span className="text-[color:var(--brand)]">•</span>{t("user.agentPerm3")}</li>
                <li className="flex gap-2"><span className="text-[color:var(--brand)]">•</span>{t("user.agentPerm4")}</li>
              </>
            ) : (
              <>
                <li className="flex gap-2"><span className="text-[color:var(--brand)]">•</span>{t("user.agentPerm1")}</li>
                <li className="flex gap-2"><span className="text-[color:var(--brand)]">•</span>{t("user.agentPerm2")}</li>
                <li className="flex gap-2"><span className="text-[color:var(--brand)]">•</span>Can view investments and full financial reports</li>
              </>
            )}
          </ul>
          <button className="mt-4 mx-auto flex items-center gap-2 h-11 px-5 rounded-full border border-[color:var(--brand)]/40 text-[color:var(--brand)] font-semibold">
            <ShieldCheck size={18} /> {t("user.customizeAccess")}
          </button>
        </GlassCard>

        <Button full size="lg" onClick={send} disabled={!phone || !lineId}>
          {t("user.sendRequest")}
        </Button>
      </main>
    </>
  );
}

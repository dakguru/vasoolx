"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { PageHead, Panel, PanelHead } from "@/components/ui/erp";
import {
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
      <PageHead
        title={t("user.addUser")}
        subtitle="Invite a field agent or partner to this workspace"
        actions={<Link href="/users" className="chip"><ChevronLeft size={15} /> Users</Link>}
      />

      <main className="px-4 md:px-6 py-4 space-y-4 max-w-2xl w-full">
        <Panel className="p-4 space-y-5">
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
        </Panel>

        <Panel>
          <PanelHead title={t("user.instructions")} icon={<ShieldCheck size={15} />} />
          <div className="p-4">
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
          <button className="mt-4 flex items-center gap-2 h-10 px-4 rounded-lg border border-[color:var(--brand)]/40 text-[color:var(--brand)] font-semibold text-[13px]">
            <ShieldCheck size={16} /> {t("user.customizeAccess")}
          </button>
          </div>
        </Panel>

        <Button full size="lg" onClick={send} disabled={!phone || !lineId}>
          {t("user.sendRequest")}
        </Button>
      </main>
    </>
  );
}

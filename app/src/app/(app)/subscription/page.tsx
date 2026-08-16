"use client";

import { useState } from "react";
import { Check, ChevronLeft, ShieldCheck, Zap, BarChart3, Users } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/primitives";
import { Panel, PageHead, PanelHead } from "@/components/ui/erp";
import { LogoMark } from "@/components/ui/Logo";
import { useI18n } from "@/lib/i18n/provider";

type Plan = "monthly" | "annual";

export default function SubscriptionPage() {
  const { t } = useI18n();
  const [plan, setPlan] = useState<Plan>("annual");

  const plans: {
    id: Plan;
    title: string;
    desc: string;
    price: string;
    per: string;
    best?: boolean;
  }[] = [
    {
      id: "monthly",
      title: t("sub.monthly"),
      desc: t("sub.monthlyDesc"),
      price: "₹100.00",
      per: t("sub.perMonth"),
    },
    {
      id: "annual",
      title: t("sub.annual"),
      desc: t("sub.annualDesc"),
      price: "₹1,000.00",
      per: t("sub.perYear"),
      best: true,
    },
  ];

  const features = [
    { Icon: Zap, label: t("sub.featUnlimited") },
    { Icon: BarChart3, label: t("sub.featAnalytics") },
    { Icon: Users, label: t("sub.featAgents") },
    { Icon: ShieldCheck, label: t("sub.featSecurity") },
  ];

  return (
    <>
      <TopBar />
      <PageHead
        title={t("set.proTitle")}
        subtitle={t("sub.manageSubtitle")}
        actions={<Link href="/settings" className="chip"><ChevronLeft size={15} /> {t("sb.settings")}</Link>}
      />

      <main className="px-4 md:px-6 py-4 grid gap-4 lg:grid-cols-[1.4fr_1fr] items-start max-w-4xl">
        <Panel>
          <PanelHead title={t("sub.choosePlan")} icon={<LogoMark size={20} />} />
          <div className="p-4 space-y-3">
            {plans.map((p) => {
              const active = p.id === plan;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`relative w-full text-left rounded-xl border-2 p-4 transition ${
                    active
                      ? "border-[color:var(--brand)] bg-[color:var(--brand)]/8"
                      : "border-[color:var(--line)] bg-[color:var(--panel-2)]"
                  }`}
                >
                  {p.best && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[color:var(--warn)] text-white text-[10px] font-extrabold">
                      {t("sub.bestValue")}
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[18px] font-extrabold text-[color:var(--text)]">{p.title}</div>
                      <div className="text-[12.5px] text-[color:var(--text-soft)] mt-0.5">{p.desc}</div>
                    </div>
                    <span className={`w-6 h-6 rounded-full grid place-items-center shrink-0 ${active ? "btn-primary" : "border-2 border-[color:var(--line-strong)]"}`}>
                      {active && <Check size={14} className="text-white" />}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-[26px] font-extrabold text-[color:var(--text)] tabular">{p.price}</span>
                    <span className="text-[12.5px] text-[color:var(--text-soft)]">{p.per}</span>
                  </div>
                </button>
              );
            })}
            <Button full size="lg" className="mt-1">{t("sub.subscribe")}</Button>
            <p className="text-center text-[12px] text-[color:var(--text-soft)]">{t("sub.subscribeNote")}</p>
            <p className="text-center text-[11.5px] text-[color:var(--text-faint)]">{t("sub.subscribeTerms")}</p>
          </div>
        </Panel>

        <Panel>
          <PanelHead title={t("sub.everythingInPro")} />
          <div className="p-4 space-y-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg grid place-items-center bg-[color:var(--ok-bg)] text-[color:var(--ok)] shrink-0"><f.Icon size={16} /></span>
                <span className="text-[13px] text-[color:var(--text)]">{f.label}</span>
              </div>
            ))}
            <div className="mt-2 p-3 rounded-lg bg-[color:var(--brand)]/8 border border-[color:var(--brand)]/20">
              <div className="text-[12px] font-semibold text-[color:var(--brand)]">{t("sub.currentlyOnTrial")}</div>
              <div className="text-[11.5px] text-[color:var(--text-soft)] mt-0.5">{t("set.daysLeftInTrial", { n: 29 })}</div>
            </div>
          </div>
        </Panel>
      </main>
    </>
  );
}

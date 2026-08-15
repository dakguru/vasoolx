"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import { GlassCard, Button } from "@/components/ui/primitives";
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

  return (
    <>
      <PageHeader title={t("set.proTitle")} back="/settings" />

      <main className="px-4 md:px-8 pb-8 max-w-2xl mx-auto w-full">
        <div className="flex justify-center py-6">
          <LogoMark size={84} />
        </div>

        <GlassCard>
          <h2 className="text-xl font-bold text-[color:var(--text)] mb-4">
            {t("sub.choosePlan")}
          </h2>
          <div className="space-y-3">
            {plans.map((p) => {
              const active = p.id === plan;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`relative w-full text-left rounded-2xl border-2 p-5 transition ${
                    active
                      ? "border-[color:var(--brand)] bg-[color:var(--brand)]/8"
                      : "border-[color:var(--glass-border)] bg-black/[0.02] dark:bg-white/[0.02]"
                  }`}
                >
                  {p.best && (
                    <span className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-[color:var(--color-warning)] text-black text-xs font-extrabold">
                      {t("sub.bestValue")}
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-extrabold text-[color:var(--text)]">
                        {p.title}
                      </div>
                      <div className="text-[color:var(--text-soft)] mt-1">
                        {p.desc}
                      </div>
                    </div>
                    <span
                      className={`w-7 h-7 rounded-full grid place-items-center shrink-0 ${
                        active
                          ? "btn-primary"
                          : "border-2 border-[color:var(--glass-border)]"
                      }`}
                    >
                      {active && <Check size={16} className="text-white" />}
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[color:var(--text)]">
                      {p.price}
                    </span>
                    <span className="text-[color:var(--text-soft)]">{p.per}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <Button full size="lg" className="mt-5">
          {t("sub.subscribe")}
        </Button>

        <p className="text-center text-sm text-[color:var(--text-soft)] mt-5">
          {t("sub.subscribeNote")}
        </p>
        <p className="text-center text-sm text-[color:var(--text-soft)] mt-3">
          {t("sub.subscribeTerms")}
        </p>
      </main>
    </>
  );
}

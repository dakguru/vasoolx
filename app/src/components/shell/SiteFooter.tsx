"use client";

import Link from "next/link";
import { Zap, Crosshair, ShieldCheck, Bot, BadgeCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export function SiteFooter() {
  const { t } = useI18n();
  const TRUST = [
    { Icon: Zap, title: t("ft.fast"), sub: t("ft.fastSub") },
    { Icon: Crosshair, title: t("ft.accurate"), sub: t("ft.accurateSub") },
    { Icon: ShieldCheck, title: t("ft.secure"), sub: t("ft.secureSub") },
    { Icon: Bot, title: t("ft.automated"), sub: t("ft.automatedSub") },
    { Icon: BadgeCheck, title: t("ft.trusted"), sub: t("ft.trustedSub") },
  ];
  return (
    <footer className="w-full mt-4">
      {/* Operational intelligence strip — native part of the app shell, on every page */}
      <div className="border-t" style={{ background: "var(--panel-3)", borderColor: "var(--line)" }}>
        <div className="px-5 md:px-6 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-3 justify-between">
          {/* Brand + positioning */}
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] shrink-0">
              <ShieldCheck size={17} />
            </span>
            <div className="leading-tight">
              <div className="text-[13px] font-bold text-[color:var(--text)]">{t("ft.tagline")}</div>
              <div className="text-[11.5px] text-[color:var(--text-faint)]">
                {t("ft.subtitle")}
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {TRUST.map((b) => (
              <div key={b.title} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)] shrink-0">
                  <b.Icon size={14} />
                </span>
                <div className="leading-tight">
                  <div className="text-[11px] font-bold text-[color:var(--text)]">{b.title}</div>
                  <div className="text-[10px] text-[color:var(--text-faint)]">{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compact legal line */}
        <div className="border-t px-5 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 text-[11.5px]" style={{ borderColor: "var(--line)" }}>
          <span className="text-[color:var(--text-faint)]">{t("ft.rights", { year: new Date().getFullYear() })}</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[color:var(--text-faint)]">
            <Link href="#" className="hover:text-[color:var(--brand)] transition">{t("set.privacyPolicy")}</Link>
            <Link href="#" className="hover:text-[color:var(--brand)] transition">{t("set.termsOfService")}</Link>
            <Link href="#" className="hover:text-[color:var(--brand)] transition">{t("ft.security")}</Link>
            <Link href="/subscription" className="hover:text-[color:var(--brand)] transition">{t("ft.systemStatus")}</Link>
            <span className="text-[color:var(--text-faint)]/70">v2.4.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

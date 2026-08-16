"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Wallet, BarChart3, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/components/ui/primitives";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const items = [
    { href: "/dashboard", label: t("nav.dashboard"), Icon: LayoutDashboard },
    { href: "/customers", label: t("nav.customers"), Icon: Users },
    { href: "/finance", label: t("nav.finance"), Icon: Wallet },
    { href: "/reports", label: t("nav.reports"), Icon: BarChart3 },
    { href: "/settings", label: t("nav.settings"), Icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <div className="mx-auto max-w-lg px-3 pb-3 pointer-events-auto">
        <div className="bg-[color:var(--sheet-bg)] backdrop-blur-xl border border-[color:var(--glass-border)] glass-sheen rounded-[26px] px-2 py-2 flex justify-between shadow-xl">
          {items.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 min-w-0 flex flex-col items-center gap-1 py-1.5 rounded-2xl"
              >
                <span
                  className={cx(
                    "grid place-items-center w-10 h-9 rounded-2xl transition shrink-0",
                    active
                      ? "bg-[color:var(--brand)]/15 text-[color:var(--brand)]"
                      : "text-[color:var(--text-faint)]"
                  )}
                >
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={cx(
                    "text-[10px] leading-tight font-medium max-w-full truncate px-0.5",
                    active
                      ? "text-[color:var(--brand)]"
                      : "text-[color:var(--text-faint)]"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

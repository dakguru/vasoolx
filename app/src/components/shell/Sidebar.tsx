"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  BarChart3,
  Settings,
  FileText,
  MapPin,
  UserCog,
  Crown,
  ChevronDown,
  Check,
  Plus,
  LogOut,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/provider";
import { Wordmark } from "@/components/ui/Logo";
import { Sheet } from "@/components/ui/Sheet";
import { cx } from "@/components/ui/primitives";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { data, activeLine, setActiveLine } = useStore();
  const { signOut, email } = useAuth();
  const [picker, setPicker] = useState(false);

  const groups: { title?: string; items: { href: string; label: string; Icon: typeof Users }[] }[] = [
    {
      items: [
        { href: "/dashboard", label: t("nav.dashboard"), Icon: LayoutDashboard },
        { href: "/customers", label: t("nav.customers"), Icon: Users },
        { href: "/finance", label: t("nav.finance"), Icon: Wallet },
        { href: "/reports", label: t("rep.reports"), Icon: BarChart3 },
      ],
    },
    {
      title: t("set.lines"),
      items: [
        { href: "/lines", label: t("line.manageLines"), Icon: FileText },
        { href: "/areas", label: t("area.areas"), Icon: MapPin },
        { href: "/users", label: t("set.users"), Icon: UserCog },
      ],
    },
    {
      title: t("set.app"),
      items: [
        { href: "/subscription", label: t("set.subscription"), Icon: Crown },
        { href: "/settings", label: t("nav.settings"), Icon: Settings },
      ],
    },
  ];

  async function doLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-[264px] shrink-0 h-dvh sticky top-0 p-4 gap-4">
      <div className="px-2 pt-2">
        <Wordmark height={30} />
      </div>

      {/* Line switcher */}
      <button
        onClick={() => setPicker(true)}
        className="glass glass-sheen rounded-2xl p-3 flex items-center gap-3 text-left hover:brightness-105 transition"
      >
        <div className="w-9 h-9 rounded-xl grid place-items-center bg-[color:var(--brand)]/15 text-[color:var(--brand)] font-extrabold shrink-0">
          {activeLine?.name?.charAt(0) ?? "V"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wide text-[color:var(--text-faint)]">
            {activeLine ? t(`line.${activeLine.loanType}`) : ""}
          </div>
          <div className="font-bold text-[color:var(--text)] truncate">
            {activeLine?.name ?? "VasoolX"}
          </div>
        </div>
        <ChevronDown size={18} className="text-[color:var(--text-faint)] shrink-0" />
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-5 pr-1">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.title && (
              <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-faint)]">
                {g.title}
              </div>
            )}
            <div className="flex flex-col gap-1">
              {g.items.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cx(
                      "flex items-center gap-3 h-11 px-3 rounded-xl font-medium transition",
                      active
                        ? "btn-primary"
                        : "text-[color:var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile / logout */}
      <div className="glass glass-sheen rounded-2xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full grid place-items-center bg-[color:var(--brand)]/15 text-[color:var(--brand)] font-bold shrink-0">
          {(data.profile.name || "U").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[color:var(--text)] truncate text-sm">
            {data.profile.name || "User"}
          </div>
          <div className="text-xs text-[color:var(--text-faint)] truncate">
            {email || data.profile.email}
          </div>
        </div>
        <button
          onClick={doLogout}
          className="w-8 h-8 grid place-items-center rounded-lg text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/10"
          aria-label={t("set.logout")}
        >
          <LogOut size={18} />
        </button>
      </div>

      <Sheet open={picker} onClose={() => setPicker(false)} title={t("line.switchLine")}>
        <div className="flex flex-col gap-3 pb-2">
          {data.lines.map((l) => {
            const active = l.id === activeLine?.id;
            return (
              <button
                key={l.id}
                onClick={() => {
                  setActiveLine(l.id);
                  setPicker(false);
                }}
                className={cx(
                  "flex items-center justify-between h-16 px-5 rounded-2xl border transition",
                  active
                    ? "bg-[color:var(--brand)]/12 border-[color:var(--brand)]/40"
                    : "field"
                )}
              >
                <div className="text-left">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--brand)]">
                    {t(`line.${l.loanType}`)}
                  </div>
                  <div className="text-lg font-bold text-[color:var(--text)]">{l.name}</div>
                </div>
                {active && <Check className="text-[color:var(--brand)]" />}
              </button>
            );
          })}
          <Link
            href="/lines"
            onClick={() => setPicker(false)}
            className="flex items-center justify-center gap-2 h-14 rounded-2xl border border-dashed border-[color:var(--brand)]/40 text-[color:var(--brand)] font-semibold"
          >
            <Plus size={20} /> {t("line.manageLines")}
          </Link>
        </div>
      </Sheet>
    </aside>
  );
}

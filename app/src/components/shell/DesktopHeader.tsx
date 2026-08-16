"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Languages,
  ChevronDown,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme/provider";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { LanguageSheet } from "@/components/shell/LanguageSwitcher";
import { exceptions } from "@/lib/data/selectors";

const CRUMBS: Record<string, { titleKey: string; parentKey?: string }> = {
  dashboard: { titleKey: "sb.dashboard" },
  customers: { titleKey: "sb.customerDirectory", parentKey: "sb.customers" },
  collect: { titleKey: "sb.collections", parentKey: "hdr.operations" },
  receivables: { titleKey: "sb.receivables", parentKey: "hdr.operations" },
  loans: { titleKey: "sb.loans", parentKey: "hdr.operations" },
  field: { titleKey: "sb.field", parentKey: "hdr.operations" },
  finance: { titleKey: "sb.finance", parentKey: "sb.receivables" },
  reports: { titleKey: "sb.reports", parentKey: "hdr.analytics" },
  areas: { titleKey: "sb.collectionRoutes", parentKey: "sb.field" },
  lines: { titleKey: "sb.lines", parentKey: "sb.master" },
  master: { titleKey: "sb.master" },
  users: { titleKey: "sb.access", parentKey: "sb.admin" },
  subscription: { titleKey: "sb.subscription", parentKey: "sb.admin" },
  settings: { titleKey: "sb.settings", parentKey: "sb.admin" },
};

export function DesktopHeader() {
  const { theme, setTheme } = useTheme();
  const { t, locale, locales } = useI18n();
  const { data, activeLine } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [langOpen, setLangOpen] = useState(false);
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const seg = pathname.split("/")[1] || "dashboard";
  const crumb = CRUMBS[seg];
  const crumbTitle = crumb ? t(crumb.titleKey) : seg.charAt(0).toUpperCase() + seg.slice(1);
  const crumbParent = crumb?.parentKey ? t(crumb.parentKey) : null;

  const alertCount = activeLine ? exceptions(data, activeLine.id).length : 0;

  // ⌘K / Ctrl+K focuses global search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cycle: Record<Theme, { next: Theme; Icon: typeof Sun; label: string }> = {
    light: { next: "dark", Icon: Sun, label: "Light" },
    dark: { next: "system", Icon: Moon, label: "Dark" },
    system: { next: "light", Icon: Monitor, label: "System" },
  };
  const { next, Icon } = cycle[theme];
  const localeLabel = locales.find((l) => l.code === locale)?.native ?? "English";

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/customers?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header
      className="hidden md:flex items-center gap-4 h-[60px] px-5 sticky top-0 z-20 border-b"
      style={{
        background: "var(--header-bg)",
        borderColor: "var(--line)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
      }}
    >
      {/* Left: hamburger + breadcrumb */}
      <button
        onClick={() => window.dispatchEvent(new Event("vx-sidebar-toggle"))}
        className="w-9 h-9 grid place-items-center rounded-lg text-[color:var(--text-soft)] hover:bg-[color:var(--brand)]/10 hover:text-[color:var(--brand)] transition shrink-0"
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        <Menu size={19} />
      </button>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] text-[color:var(--text-faint)] leading-none">
          <span>{activeLine?.name ?? "VasoolX"}</span>
          {crumbParent && (
            <>
              <ChevronRight size={11} />
              <span>{crumbParent}</span>
            </>
          )}
        </div>
        <h1 className="text-[16px] font-bold text-[color:var(--text)] leading-tight truncate mt-0.5">
          {crumbTitle}
        </h1>
      </div>

      {/* Center: universal search */}
      <form onSubmit={submitSearch} className="flex-1 max-w-[520px] mx-auto relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
        <input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("sb.searchPlaceholder")}
          className="field-erp w-full h-9 pl-9 pr-16 text-[13px]"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 px-1.5 h-5 rounded-md border border-[color:var(--line-strong)] bg-[color:var(--panel-3)] text-[10px] font-semibold text-[color:var(--text-faint)]">
          ⌘K
        </kbd>
      </form>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href="/dashboard"
          className="relative w-9 h-9 grid place-items-center rounded-lg text-[color:var(--text-soft)] hover:bg-[color:var(--brand)]/10 hover:text-[color:var(--brand)] transition"
          aria-label="Notifications"
          title={t("sb.alerts", { n: alertCount })}
        >
          <Bell size={18} />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[color:var(--crit)] text-white text-[9px] font-bold grid place-items-center">
              {alertCount}
            </span>
          )}
        </Link>
        <button
          className="w-9 h-9 grid place-items-center rounded-lg text-[color:var(--text-soft)] hover:bg-[color:var(--brand)]/10 hover:text-[color:var(--brand)] transition"
          aria-label={t("sb.help")}
          title={t("sb.help")}
        >
          <HelpCircle size={18} />
        </button>
        <button
          onClick={() => setLangOpen(true)}
          className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-[color:var(--text-soft)] hover:bg-[color:var(--brand)]/10 hover:text-[color:var(--brand)] transition text-[13px] font-medium"
          title="Language"
        >
          <Languages size={16} /> <span className="hidden lg:inline">{localeLabel}</span>
        </button>
        <button
          onClick={() => setTheme(next)}
          className="w-9 h-9 grid place-items-center rounded-lg text-[color:var(--text-soft)] hover:bg-[color:var(--brand)]/10 hover:text-[color:var(--brand)] transition"
          aria-label={t("set.theme")}
          title={`Theme: ${cycle[theme].label}`}
        >
          <Icon size={17} />
        </button>

        <div className="w-px h-6 bg-[color:var(--line)] mx-1" />

        <Link href="/settings" className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-[color:var(--brand)]/8 transition">
          <div className="w-7 h-7 rounded-full grid place-items-center bg-gradient-to-br from-[color:var(--brand)] to-[color:var(--brand-strong)] text-white font-bold text-[12px] shrink-0">
            {(data.profile.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <div className="text-[12.5px] font-semibold text-[color:var(--text)] max-w-[110px] truncate">
              {data.profile.name || "User"}
            </div>
            <div className="text-[10px] text-[color:var(--text-faint)] flex items-center gap-0.5">
              <ShieldCheck size={9} className="text-[color:var(--ok)]" /> {t("sb.administrator")}
            </div>
          </div>
          <ChevronDown size={14} className="text-[color:var(--text-faint)] hidden lg:block" />
        </Link>
      </div>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </header>
  );
}

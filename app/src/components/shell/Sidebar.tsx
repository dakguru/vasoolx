"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Contact,
  FileText,
  History,
  HandCoins,
  Gauge,
  Layers,
  Clock,
  CalendarDays,
  BadgeCheck,
  Wallet,
  CalendarClock,
  AlertTriangle,
  PieChart,
  Undo2,
  Landmark,
  ListChecks,
  CalendarRange,
  BookOpen,
  Route,
  ClipboardList,
  MapPin,
  Coins,
  Receipt,
  TrendingDown,
  Banknote,
  Scale,
  BarChart3,
  Trophy,
  LineChart,
  Download,
  Database,
  Package,
  Boxes,
  CreditCard,
  Tags,
  ShieldCheck,
  UserCog,
  KeyRound,
  Activity,
  LogIn,
  Settings,
  Crown,
  Blocks,
  Bell,
  ChevronsUpDown,
  ChevronRight,
  Check,
  Plus,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { ALL_LINES } from "@/lib/data/selectors";
import { useAuth } from "@/lib/auth/provider";
import { Wordmark, LogoMark } from "@/components/ui/Logo";
import { Sheet } from "@/components/ui/Sheet";
import { cx } from "@/components/ui/primitives";

type NavItem = { label: string; href: string; Icon: LucideIcon; badgeKey?: "overdue" | "pending" };
type NavSection = { key: string; title?: string; Icon: LucideIcon; items: NavItem[]; more?: boolean };

const SECTIONS: NavSection[] = [
  {
    key: "home",
    Icon: LayoutDashboard,
    items: [{ label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard }],
  },
  {
    key: "customers",
    title: "Customers",
    Icon: Users,
    items: [
      { label: "Customer Directory", href: "/customers", Icon: Contact },
      { label: "Customer Groups", href: "/customers?group=all", Icon: UsersRound },
      { label: "Customer Documents", href: "/customers?tab=documents", Icon: FileText },
      { label: "Customer History", href: "/customers?tab=history", Icon: History },
    ],
  },
  {
    key: "collections",
    title: "Collections",
    Icon: HandCoins,
    items: [
      { label: "Collection Dashboard", href: "/collect", Icon: Gauge },
      { label: "Collect Now", href: "/collect?mode=instant", Icon: HandCoins },
      { label: "Bulk Collection", href: "/collect?mode=bulk", Icon: Layers },
      { label: "Pending Collections", href: "/collect?filter=pending", Icon: Clock },
      { label: "Collection Schedule", href: "/collect?tab=schedule", Icon: CalendarDays },
      { label: "Collection Verification", href: "/collect?tab=verify", Icon: BadgeCheck },
    ],
  },
  {
    key: "receivables",
    title: "Receivables",
    Icon: Wallet,
    items: [
      { label: "Outstanding", href: "/receivables", Icon: Wallet },
      { label: "Due Today", href: "/receivables?view=due", Icon: CalendarClock },
      { label: "Overdue", href: "/receivables?view=overdue", Icon: AlertTriangle, badgeKey: "overdue" },
      { label: "Aging Analysis", href: "/receivables?view=aging", Icon: PieChart },
      { label: "Recovery Tracking", href: "/receivables?view=recovery", Icon: Undo2 },
    ],
  },
  {
    key: "loans",
    title: "Loans / Accounts",
    Icon: Landmark,
    items: [
      { label: "Active Loans", href: "/loans", Icon: Landmark },
      { label: "Installments", href: "/loans?view=installments", Icon: ListChecks },
      { label: "Payment Schedule", href: "/loans?view=schedule", Icon: CalendarRange },
      { label: "Loan Register", href: "/loans?view=register", Icon: BookOpen },
    ],
  },
  {
    key: "field",
    title: "Field Operations",
    Icon: Route,
    items: [
      { label: "Collection Routes", href: "/field", Icon: Route },
      { label: "Field Agents", href: "/field?view=agents", Icon: Users },
      { label: "Daily Assignments", href: "/field?view=assignments", Icon: ClipboardList },
      { label: "Location Tracking", href: "/field?view=tracking", Icon: MapPin },
      { label: "Visit History", href: "/field?view=visits", Icon: History },
    ],
  },
  {
    key: "finance",
    title: "Finance",
    Icon: Coins,
    more: true,
    items: [
      { label: "Receipts", href: "/finance?tab=receipts", Icon: Receipt },
      { label: "Expenses", href: "/finance?tab=expenses", Icon: TrendingDown },
      { label: "Cash Management", href: "/finance?tab=cash", Icon: Banknote },
      { label: "Reconciliation", href: "/finance?tab=recon", Icon: Scale },
      { label: "Ledger", href: "/reports/ledger", Icon: BookOpen },
    ],
  },
  {
    key: "reports",
    title: "Reports",
    Icon: BarChart3,
    more: true,
    items: [
      { label: "Collection Reports", href: "/reports/loan-summary", Icon: BarChart3 },
      { label: "Agent Performance", href: "/field?view=agents", Icon: Trophy },
      { label: "Customer Reports", href: "/reports/customer", Icon: UsersRound },
      { label: "Financial Reports", href: "/reports/investment", Icon: LineChart },
      { label: "Export Center", href: "/reports?tab=export", Icon: Download },
    ],
  },
  {
    key: "master",
    title: "Master Data",
    Icon: Database,
    more: true,
    items: [
      { label: "Areas", href: "/areas", Icon: MapPin },
      { label: "Lines", href: "/lines", Icon: Layers },
      { label: "Products", href: "/master", Icon: Package },
      { label: "Schemes", href: "/master?view=schemes", Icon: Boxes },
      { label: "Payment Methods", href: "/master?view=methods", Icon: CreditCard },
      { label: "Categories", href: "/master?view=categories", Icon: Tags },
    ],
  },
  {
    key: "access",
    title: "Users & Access",
    Icon: ShieldCheck,
    more: true,
    items: [
      { label: "Users", href: "/users", Icon: Users },
      { label: "Roles", href: "/users?tab=roles", Icon: UserCog },
      { label: "Permissions", href: "/users?tab=permissions", Icon: KeyRound },
      { label: "Activity Logs", href: "/users?tab=activity", Icon: Activity },
      { label: "Login History", href: "/users?tab=logins", Icon: LogIn },
    ],
  },
  {
    key: "admin",
    title: "Administration",
    Icon: Settings,
    more: true,
    items: [
      { label: "Subscription", href: "/subscription", Icon: Crown },
      { label: "Integrations", href: "/settings?tab=integrations", Icon: Blocks },
      { label: "Notifications", href: "/settings?tab=notifications", Icon: Bell },
      { label: "Settings", href: "/settings", Icon: Settings },
      { label: "Security", href: "/settings?tab=security", Icon: ShieldCheck },
    ],
  },
];

const COLLAPSE_KEY = "vasoolx.sidebar.collapsed";
const MORE_KEY = "vasoolx.sidebar.more";

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="hidden md:block w-[258px] shrink-0" style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--line)" }} />}>
      <SidebarInner />
    </Suspense>
  );
}

function SidebarInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const { data, activeLine, setActiveLine } = useStore();
  const { signOut, email } = useAuth();
  const [picker, setPicker] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    setShowMore(localStorage.getItem(MORE_KEY) === "1");
    const onToggle = () =>
      setCollapsed((c) => {
        const n = !c;
        localStorage.setItem(COLLAPSE_KEY, n ? "1" : "0");
        return n;
      });
    window.addEventListener("vx-sidebar-toggle", onToggle);
    return () => window.removeEventListener("vx-sidebar-toggle", onToggle);
  }, []);

  // Auto-expand "More Modules" when the current route lives inside one of its sections
  useEffect(() => {
    const inMore = SECTIONS.some(
      (s) =>
        s.more &&
        s.items.some((i) => {
          const base = i.href.split("?")[0];
          return base !== "/dashboard" && (pathname === base || pathname.startsWith(base + "/"));
        })
    );
    if (inMore) setShowMore(true);
  }, [pathname]);

  const badges = useMemo(() => {
    const lineId = activeLine?.id;
    if (!lineId) return { overdue: 0, pending: 0 };
    return {
      overdue: data.loans.filter((l) => l.lineId === lineId && l.status === "bad").length,
      pending: data.members.filter((m) => m.lineId === lineId && m.status === "pending").length,
    };
  }, [data, activeLine]);

  function setCollapse(v: boolean) {
    setCollapsed(v);
    localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
  }
  function toggleMore() {
    setShowMore((m) => {
      localStorage.setItem(MORE_KEY, !m ? "1" : "0");
      return !m;
    });
  }
  async function doLogout() {
    await signOut();
    router.replace("/login");
  }

  // Query-aware active state: exactly one item highlights per module hub.
  const isActive = (href: string) => {
    const [path, qs] = href.split("?");
    if (path === "/dashboard") return pathname === "/dashboard";
    const pathMatch = pathname === path || pathname.startsWith(path + "/");
    if (!pathMatch) return false;
    if (!qs) {
      // canonical (no-query) item: active only when no view/tab is selected
      return !search.get("view") && !search.get("tab");
    }
    // every param in the href must match the current URL
    const want = new URLSearchParams(qs);
    for (const [k, v] of want.entries()) {
      if (search.get(k) !== v) return false;
    }
    return true;
  };
  const sectionActive = (s: NavSection) =>
    s.items.some((i) => {
      const base = i.href.split("?")[0];
      return base !== "/dashboard" && (pathname === base || pathname.startsWith(base + "/"));
    });

  const visibleSections = SECTIONS.filter((s) => !s.more || showMore);
  const railSections = SECTIONS; // rail shows all module icons

  return (
    <aside
      className={cx(
        "hidden md:flex flex-col shrink-0 h-dvh sticky top-0 z-30 transition-[width] duration-200",
        collapsed ? "w-[70px]" : "w-[258px]"
      )}
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--line)" }}
    >
      {/* Brand */}
      <div className={cx("flex items-center h-[60px] shrink-0", collapsed ? "justify-center px-2" : "justify-between pl-4 pr-3")}>
        {collapsed ? (
          <LogoMark size={34} />
        ) : (
          <Link href="/dashboard" className="pl-0.5">
            <Wordmark height={25} />
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapse(true)}
            className="w-8 h-8 grid place-items-center rounded-lg text-[color:var(--text-faint)] hover:bg-[color:var(--brand)]/10 hover:text-[color:var(--brand)] transition"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Workspace selector */}
      <div className={cx("shrink-0 pb-2", collapsed ? "px-2" : "px-3")}>
        {collapsed ? (
          <button
            onClick={() => setCollapse(false)}
            className="w-full h-11 grid place-items-center rounded-xl bg-gradient-to-br from-[color:var(--brand)] to-[color:var(--brand-strong)] text-white font-extrabold shadow-sm"
            title={`${activeLine?.name ?? "VasoolX"} — expand`}
          >
            {activeLine?.name?.charAt(0) ?? "V"}
          </button>
        ) : (
          <button
            onClick={() => setPicker(true)}
            className="w-full panel-2 rounded-xl p-2.5 flex items-center gap-2.5 text-left hover:border-[color:var(--line-strong)] transition"
          >
            <div className="w-9 h-9 rounded-lg grid place-items-center bg-gradient-to-br from-[color:var(--brand)] to-[color:var(--brand-strong)] text-white font-extrabold shrink-0 shadow-sm">
              {activeLine?.name?.charAt(0) ?? "V"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wide text-[color:var(--text-faint)] flex items-center gap-1">
                <Building2 size={10} /> {activeLine?.id === ALL_LINES ? "Consolidated" : activeLine ? t(`line.${activeLine.loanType}`) : "Workspace"}
              </div>
              <div className="font-bold text-[color:var(--text)] truncate text-[14px] leading-tight">
                {activeLine?.name ?? "VasoolX"}
              </div>
            </div>
            <ChevronsUpDown size={15} className="text-[color:var(--text-faint)] shrink-0" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={cx("flex-1 overflow-y-auto scrollbar-thin pb-3 flex flex-col", collapsed ? "px-2 gap-1 items-center" : "px-3 gap-3")}>
        {collapsed
          ? railSections.map((s) => {
              const active = s.key === "home" ? pathname === "/dashboard" : sectionActive(s);
              const badge = s.items.some((i) => i.badgeKey === "overdue") ? badges.overdue : 0;
              return (
                <Link
                  key={s.key}
                  href={s.items[0].href}
                  title={s.title ?? "Dashboard"}
                  className={cx(
                    "relative w-10 h-10 grid place-items-center rounded-lg transition",
                    active
                      ? "bg-[color:var(--sidebar-active)] text-[color:var(--brand)]"
                      : "text-[color:var(--text-soft)] hover:bg-[color:var(--brand)]/8 hover:text-[color:var(--text)]"
                  )}
                >
                  <s.Icon size={19} strokeWidth={active ? 2.4 : 2} />
                  {badge > 0 && (
                    <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-[color:var(--crit)]" />
                  )}
                </Link>
              );
            })
          : visibleSections.map((s) => (
              <div key={s.key}>
                {s.title && <div className="nav-section mb-1">{s.title}</div>}
                <div className="flex flex-col gap-0.5">
                  {s.items.map((it) => {
                    const active = isActive(it.href);
                    const badge = it.badgeKey ? badges[it.badgeKey] : 0;
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        className={cx("nav-item", active && "nav-item-active")}
                      >
                        <it.Icon size={17} strokeWidth={active ? 2.4 : 2} className="shrink-0" />
                        <span className="truncate flex-1">{it.label}</span>
                        {badge > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[color:var(--crit-bg)] text-[color:var(--crit)] text-[10px] font-bold grid place-items-center border border-[color:var(--crit-line)]">
                            {badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

        {/* More Modules toggle */}
        {!collapsed && (
          <button
            onClick={toggleMore}
            className="nav-item mt-1 text-[color:var(--brand)] hover:bg-[color:var(--brand)]/8"
          >
            <Boxes size={17} className="shrink-0" />
            <span className="truncate flex-1 text-left font-semibold">
              {showMore ? "Fewer Modules" : "More Modules"}
            </span>
            <ChevronRight size={15} className={cx("transition-transform", showMore && "rotate-90")} />
          </button>
        )}
      </nav>

      {/* Expand toggle (collapsed) */}
      {collapsed && (
        <button
          onClick={() => setCollapse(false)}
          className="mx-auto mb-1.5 w-9 h-9 grid place-items-center rounded-lg text-[color:var(--text-faint)] hover:bg-[color:var(--brand)]/10 hover:text-[color:var(--brand)] transition"
          title="Expand sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

      {/* Profile */}
      <div className={cx("shrink-0 border-t border-[color:var(--line)]", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          <button
            onClick={doLogout}
            className="w-full h-10 grid place-items-center rounded-lg text-[color:var(--crit)] hover:bg-[color:var(--crit)]/10 transition"
            title={`${data.profile.name || "User"} — sign out`}
          >
            <LogOut size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full grid place-items-center bg-[color:var(--brand)]/14 text-[color:var(--brand)] font-bold shrink-0 text-sm">
              {(data.profile.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[color:var(--text)] truncate text-[13px] leading-tight">
                {data.profile.name || "User"}
              </div>
              <div className="text-[11px] text-[color:var(--text-faint)] truncate flex items-center gap-1">
                <ShieldCheck size={10} className="text-[color:var(--ok)]" /> Administrator
              </div>
            </div>
            <button
              onClick={doLogout}
              className="w-8 h-8 grid place-items-center rounded-lg text-[color:var(--crit)] hover:bg-[color:var(--crit)]/10 transition shrink-0"
              aria-label={t("set.logout")}
              title={email || t("set.logout")}
            >
              <LogOut size={17} />
            </button>
          </div>
        )}
      </div>

      {/* Workspace picker */}
      <Sheet open={picker} onClose={() => setPicker(false)} title={t("line.switchLine")}>
        <div className="flex flex-col gap-3 pb-2">
          {data.lines.length > 1 && (
            <button
              onClick={() => { setActiveLine(ALL_LINES); setPicker(false); }}
              className={cx(
                "flex items-center justify-between h-16 px-5 rounded-2xl border transition",
                activeLine?.id === ALL_LINES ? "bg-[color:var(--brand)]/12 border-[color:var(--brand)]/40" : "field"
              )}
            >
              <div className="flex items-center gap-3 text-left">
                <span className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-[color:var(--brand)] to-[color:var(--brand-strong)] text-white shrink-0">
                  <Layers size={20} />
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--brand)]">Consolidated</div>
                  <div className="text-lg font-bold text-[color:var(--text)]">All Lines</div>
                </div>
              </div>
              {activeLine?.id === ALL_LINES && <Check className="text-[color:var(--brand)]" />}
            </button>
          )}
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

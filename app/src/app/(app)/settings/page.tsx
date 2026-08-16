"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  FileText,
  UsersRound,
  Fingerprint,
  Bell,
  Languages,
  Sun,
  Moon,
  Monitor,
  SlidersHorizontal,
  RefreshCw,
  Info,
  Sparkles,
  ShieldCheck,
  LogOut,
  ChevronRight,
  RotateCcw,
  Blocks,
  Lock,
  MessageSquare,
  Smartphone,
  CreditCard,
  Cloud,
  KeyRound,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Button, Toggle } from "@/components/ui/primitives";
import { Loader } from "@/components/ui/Loader";
import { Panel, PanelHead, PageHead, StatusBadge } from "@/components/ui/erp";
import { LanguageSheet } from "@/components/shell/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/provider";
import { useTheme, type Theme } from "@/lib/theme/provider";
import { useAuth } from "@/lib/auth/provider";
import { useStore } from "@/lib/data/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const TABS = [
  { key: "general", label: "General" },
  { key: "integrations", label: "Integrations" },
  { key: "notifications", label: "Notifications" },
  { key: "security", label: "Security" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function Row({
  icon,
  label,
  sub,
  right,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3 py-3.5">
      <span className="text-[color:var(--text-soft)]">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[color:var(--text)]">{label}</div>
        {sub && <div className="text-sm text-[color:var(--text-soft)]">{sub}</div>}
      </div>
      {right}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  if (onClick)
    return (
      <button onClick={onClick} className="w-full text-left">
        {inner}
      </button>
    );
  return inner;
}

const Divider = () => (
  <div className="h-px bg-[color:var(--line)] ml-8" />
);

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel>
      <PanelHead title={title} />
      <div className="px-4 py-1">{children}</div>
    </Panel>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="py-20"><Loader size={64} /></div>}>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const { t, locale, locales } = useI18n();
  const { theme, setTheme } = useTheme();
  const { signOut, email } = useAuth();
  const { data, resetDemo } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const tab = (TABS.find((x) => x.key === params.get("tab"))?.key ?? "general") as Tab;

  const [langOpen, setLangOpen] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const themeCycle: Record<Theme, { next: Theme; label: string; Icon: typeof Sun }> = {
    light: { next: "dark", label: t("set.themeLight"), Icon: Sun },
    dark: { next: "system", label: t("set.themeDark"), Icon: Moon },
    system: { next: "light", label: t("set.themeSystem"), Icon: Monitor },
  };
  const th = themeCycle[theme];
  const localeLabel = locales.find((l) => l.code === locale)?.native ?? "English";

  async function doLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <>
      <TopBar />
      <PageHead title={t("set.settings")} subtitle="Workspace preferences, access & administration" />

      <main className="px-4 md:px-6 py-4 space-y-4">
        <div className="segtab w-fit flex-wrap">
          {TABS.map((x) => (
            <button key={x.key} data-active={tab === x.key} onClick={() => router.replace(x.key === "general" ? "/settings" : `/settings?tab=${x.key}`)}>{x.label}</button>
          ))}
        </div>

        {tab === "general" && (
        <div className="grid gap-4 lg:grid-cols-2 items-start">
        {/* Profile */}
        <SettingsCard title={t("set.profile")}>
          <Row
            icon={<User size={20} />}
            label={t("set.name")}
            right={
              <span className="flex items-center gap-1 text-[color:var(--text-soft)]">
                {data.profile.name || "—"} <ChevronRight size={18} />
              </span>
            }
          />
          <Divider />
          <Row
            icon={<Mail size={20} />}
            label={t("set.email")}
            right={
              <span className="flex items-center gap-1 text-[color:var(--text-soft)]">
                {email || data.profile.email || "—"} <ChevronRight size={18} />
              </span>
            }
          />
          <Divider />
          <Row
            icon={<Phone size={20} />}
            label={t("set.phone")}
            right={<span className="text-[color:var(--text-soft)]">{data.profile.phone || "—"}</span>}
          />
        </SettingsCard>

        {/* Lines */}
        <SettingsCard title={t("set.lines")}>
          <Row
            icon={<FileText size={20} />}
            label={t("line.manageLines")}
            href="/lines"
            right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />}
          />
          <Divider />
          <Row
            icon={<UsersRound size={20} />}
            label={t("set.users")}
            sub={t("set.whoCanAccess")}
            href="/users"
            right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />}
          />
        </SettingsCard>

        {/* Preferences */}
        <SettingsCard title={t("set.preferences")}>
          <Row
            icon={<Fingerprint size={20} />}
            label={t("set.biometric")}
            right={<Toggle checked={biometric} onChange={setBiometric} />}
          />
          <Divider />
          <Row
            icon={<Bell size={20} />}
            label={t("set.enableNotifications")}
            right={<Toggle checked={notifications} onChange={setNotifications} />}
          />
          <Divider />
          <Row
            icon={<Languages size={20} />}
            label={t("set.language")}
            onClick={() => setLangOpen(true)}
            right={
              <span className="flex items-center gap-1 text-[color:var(--text-soft)]">
                {localeLabel} <ChevronRight size={18} />
              </span>
            }
          />
          <Divider />
          <Row
            icon={<th.Icon size={20} />}
            label={t("set.theme")}
            onClick={() => setTheme(th.next)}
            right={
              <span className="flex items-center gap-1 text-[color:var(--text-soft)]">
                {th.label} <ChevronRight size={18} />
              </span>
            }
          />
          <Divider />
          <Row
            icon={<SlidersHorizontal size={20} />}
            label={t("set.inAppSettings")}
            right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />}
          />
        </SettingsCard>

        {/* Subscription */}
        <Link href="/subscription">
          <Panel className="panel-hover flex items-center gap-3 p-4 active:scale-[.99] transition cursor-pointer">
            <span className="w-10 h-10 rounded-lg grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] shrink-0">
              <RefreshCw size={20} />
            </span>
            <div className="flex-1">
              <div className="font-bold text-[color:var(--text)]">
                {t("set.proTitle")}
              </div>
              <div className="text-[12.5px] text-[color:var(--text-soft)]">
                {t("set.daysLeftInTrial", { n: 29 })}
              </div>
            </div>
            <span className="badge badge-info" style={{ height: 22 }}>{t("set.pro")}</span>
            <ChevronRight size={18} className="text-[color:var(--text-faint)]" />
          </Panel>
        </Link>

        {/* App */}
        <SettingsCard title={t("set.app")}>
          <Row icon={<Info size={20} />} label={t("set.about")} right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />} />
          <Divider />
          <Row icon={<Sparkles size={20} />} label={t("set.exploreFeatures")} right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />} />
          <Divider />
          <Row icon={<FileText size={20} />} label={t("set.termsOfService")} right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />} />
          <Divider />
          <Row icon={<ShieldCheck size={20} />} label={t("set.privacyPolicy")} right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />} />
          {/* Demo-only: the Supabase-backed app has no seed to reset. */}
          {!isSupabaseConfigured && (
            <>
              <Divider />
              <Row
                icon={<RotateCcw size={20} />}
                label="Reset demo data"
                onClick={() => { if (confirm(t("set.resetConfirm"))) resetDemo(); }}
                right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />}
              />
            </>
          )}
        </SettingsCard>

        <div className="lg:col-span-2">
          <Button variant="danger" full size="lg" onClick={doLogout}>
            <LogOut size={20} /> {t("set.logout")}
          </Button>
        </div>
        </div>
        )}

        {tab === "integrations" && <IntegrationsView />}
        {tab === "notifications" && <NotificationsView />}
        {tab === "security" && <SecurityView />}
      </main>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </>
  );
}

/* ---------------- Integrations ---------------- */
function IntegrationsView() {
  const items = [
    { Icon: MessageSquare, name: "WhatsApp Business", desc: "Send payment reminders & receipts", on: true, tone: "ok" as const },
    { Icon: Smartphone, name: "SMS Gateway", desc: "Automated SMS alerts to customers", on: true, tone: "ok" as const },
    { Icon: CreditCard, name: "Payment Gateway (UPI)", desc: "Accept online collections via UPI", on: false, tone: "neutral" as const },
    { Icon: Cloud, name: "Cloud Backup", desc: "Daily encrypted data backup", on: true, tone: "ok" as const },
    { Icon: FileText, name: "Accounting Export", desc: "Export ledger to Tally / Excel", on: false, tone: "neutral" as const },
    { Icon: Blocks, name: "REST API Access", desc: "Programmatic access for developers", on: false, tone: "neutral" as const },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((it) => (
        <Panel key={it.name} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <span className="w-10 h-10 rounded-xl grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)]"><it.Icon size={20} /></span>
            <StatusBadge tone={it.on ? "ok" : "neutral"}>{it.on ? "Connected" : "Available"}</StatusBadge>
          </div>
          <div className="font-bold text-[color:var(--text)]">{it.name}</div>
          <div className="text-[12px] text-[color:var(--text-soft)] mt-0.5">{it.desc}</div>
          <button className={`mt-3 w-full h-9 rounded-lg text-[12.5px] font-semibold transition ${it.on ? "chip justify-center" : "btn-primary"}`}>
            {it.on ? "Manage" : "Connect"}
          </button>
        </Panel>
      ))}
    </div>
  );
}

/* ---------------- Notifications ---------------- */
function NotificationsView() {
  const groups = [
    { title: "Collection Alerts", rows: ["Payment received", "Missed collection", "Daily target reached", "Overdue account flagged"] },
    { title: "Operational", rows: ["Agent assignment updates", "Route changes", "Reconciliation mismatches", "New customer added"] },
    { title: "System", rows: ["Product updates & announcements", "Security alerts", "Subscription reminders"] },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3 items-start">
      {groups.map((g) => (
        <Panel key={g.title}>
          <PanelHead title={g.title} icon={<Bell size={15} />} />
          <div className="px-4 py-2">
            {g.rows.map((r, i) => (
              <NotifRow key={r} label={r} defaultOn={i % 3 !== 2} />
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}
function NotifRow({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[color:var(--line)] last:border-0">
      <span className="text-[13px] text-[color:var(--text)]">{label}</span>
      <Toggle checked={on} onChange={setOn} />
    </div>
  );
}

/* ---------------- Security ---------------- */
function SecurityView() {
  return (
    <div className="grid gap-3 md:grid-cols-2 items-start">
      <Panel>
        <PanelHead title="Authentication" icon={<Lock size={15} />} />
        <div className="px-4 py-2">
          <SecRow Icon={KeyRound} label="Two-factor authentication" sub="Add an extra layer of security" defaultOn={false} />
          <SecRow Icon={Fingerprint} label="Biometric login" sub="Fingerprint / Face unlock on mobile" defaultOn={true} />
          <SecRow Icon={ShieldCheck} label="Session timeout" sub="Auto sign-out after inactivity" defaultOn={true} />
        </div>
      </Panel>
      <Panel>
        <PanelHead title="Access & Compliance" icon={<ShieldCheck size={15} />} />
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-[13px]"><span className="text-[color:var(--text-soft)]">Data encryption</span><StatusBadge tone="ok">256-bit AES</StatusBadge></div>
          <div className="flex items-center justify-between text-[13px]"><span className="text-[color:var(--text-soft)]">Connection</span><StatusBadge tone="ok">SSL / TLS 1.3</StatusBadge></div>
          <div className="flex items-center justify-between text-[13px]"><span className="text-[color:var(--text-soft)]">Last security audit</span><span className="tabular text-[color:var(--text)]">01 Aug 2026</span></div>
          <div className="flex items-center justify-between text-[13px]"><span className="text-[color:var(--text-soft)]">Active sessions</span><span className="tabular text-[color:var(--text)]">2 devices</span></div>
          <button className="w-full h-9 rounded-lg text-[12.5px] font-semibold border border-[color:var(--crit-line)] bg-[color:var(--crit-bg)] text-[color:var(--crit)] mt-1">Sign out all other devices</button>
        </div>
      </Panel>
    </div>
  );
}
function SecRow({ Icon, label, sub, defaultOn }: { Icon: typeof Lock; label: string; sub: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[color:var(--line)] last:border-0">
      <span className="w-8 h-8 rounded-lg grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)] shrink-0"><Icon size={15} /></span>
      <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold text-[color:var(--text)]">{label}</div><div className="text-[11.5px] text-[color:var(--text-faint)]">{sub}</div></div>
      <Toggle checked={on} onChange={setOn} />
    </div>
  );
}

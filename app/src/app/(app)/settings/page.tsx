"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import { GlassCard, Button, Toggle } from "@/components/ui/primitives";
import { LanguageSheet } from "@/components/shell/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/provider";
import { useTheme, type Theme } from "@/lib/theme/provider";
import { useAuth } from "@/lib/auth/provider";
import { useStore } from "@/lib/data/store";

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
  <div className="h-px bg-[color:var(--glass-border)] ml-9" />
);

export default function SettingsPage() {
  const { t, locale, locales } = useI18n();
  const { theme, setTheme } = useTheme();
  const { signOut, email } = useAuth();
  const { data, resetDemo } = useStore();
  const router = useRouter();

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
      <PageHeader title={t("set.settings")} />

      <main className="px-4 md:px-8 pb-8 grid gap-5 lg:grid-cols-2 items-start">
        {/* Profile */}
        <GlassCard>
          <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">
            {t("set.profile")}
          </h3>
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
        </GlassCard>

        {/* Lines */}
        <GlassCard>
          <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">
            {t("set.lines")}
          </h3>
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
        </GlassCard>

        {/* Preferences */}
        <GlassCard>
          <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">
            {t("set.preferences")}
          </h3>
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
        </GlassCard>

        {/* Subscription */}
        <Link href="/subscription">
          <GlassCard className="flex items-center gap-3 active:scale-[.99] transition">
            <span className="text-[color:var(--brand)]">
              <RefreshCw size={22} />
            </span>
            <div className="flex-1">
              <div className="font-bold text-[color:var(--text)]">
                {t("set.proTitle")}
              </div>
              <div className="text-sm text-[color:var(--text-soft)]">
                {t("set.daysLeftInTrial", { n: 29 })}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[color:var(--brand)]/12 text-[color:var(--brand)] text-xs font-extrabold tracking-wide">
              {t("set.pro")}
            </span>
            <ChevronRight size={18} className="text-[color:var(--text-faint)]" />
          </GlassCard>
        </Link>

        {/* App */}
        <GlassCard>
          <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">
            {t("set.app")}
          </h3>
          <Row icon={<Info size={20} />} label={t("set.about")} right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />} />
          <Divider />
          <Row icon={<Sparkles size={20} />} label={t("set.exploreFeatures")} right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />} />
          <Divider />
          <Row icon={<FileText size={20} />} label={t("set.termsOfService")} right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />} />
          <Divider />
          <Row icon={<ShieldCheck size={20} />} label={t("set.privacyPolicy")} right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />} />
          <Divider />
          <Row
            icon={<RotateCcw size={20} />}
            label="Reset demo data"
            onClick={resetDemo}
            right={<ChevronRight size={18} className="text-[color:var(--text-faint)]" />}
          />
        </GlassCard>

        <div className="lg:col-span-2">
          <Button variant="danger" full size="lg" onClick={doLogout}>
            <LogOut size={20} /> {t("set.logout")}
          </Button>
        </div>
      </main>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </>
  );
}

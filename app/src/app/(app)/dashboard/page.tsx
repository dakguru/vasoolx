"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  UserPlus,
  Plus,
  MapPin,
  UploadCloud,
  Info,
  PlayCircle,
  Send,
  X,
  TrendingUp,
  Wallet,
  AlertTriangle,
  IndianRupee,
  ChevronRight,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { GlassCard, Button, Select } from "@/components/ui/primitives";
import { AreaChart } from "@/components/ui/Chart";
import { CustomerSheet } from "@/components/sheets/CustomerSheet";
import { FinanceSheet } from "@/components/sheets/FinanceSheet";
import { KpiDetailSheet, type KpiKind } from "@/components/sheets/KpiDetailSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { lineStats, collectionTrend } from "@/lib/data/selectors";
import { inr, inrCompact, toDateInput, fmtDate } from "@/lib/format";

export default function DashboardPage() {
  const { t } = useI18n();
  const { data, activeLine } = useStore();
  const router = useRouter();

  const [date, setDate] = useState(toDateInput(new Date().toISOString()));
  const [areaId, setAreaId] = useState("");
  const [custSheet, setCustSheet] = useState(false);
  const [expSheet, setExpSheet] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [kpiKind, setKpiKind] = useState<KpiKind>(null);

  const areas = data.areas.filter((a) => a.lineId === activeLine?.id);
  const stats = useMemo(
    () => (activeLine ? lineStats(data, activeLine.id) : null),
    [data, activeLine]
  );
  const trend = useMemo(
    () => (activeLine ? collectionTrend(data, activeLine.id, 7) : []),
    [data, activeLine]
  );

  function goCollect(mode: "instant" | "bulk") {
    const qs = new URLSearchParams({ mode, date });
    if (areaId) qs.set("area", areaId);
    router.push(`/collect?${qs.toString()}`);
  }

  const kpis = stats
    ? [
        { kind: "collected" as const, label: t("dash.statCollected"), value: inr(stats.collectedToday), Icon: IndianRupee, tone: "text-[color:var(--color-success)]", bg: "bg-[color:var(--color-success)]/12" },
        { kind: "outstanding" as const, label: t("dash.statOutstanding"), value: inrCompact(stats.outstanding), Icon: Wallet, tone: "text-[color:var(--brand)]", bg: "bg-[color:var(--brand)]/12" },
        { kind: "active" as const, label: t("dash.statActiveLoans"), value: String(stats.activeLoans), Icon: TrendingUp, tone: "text-[color:var(--brand)]", bg: "bg-[color:var(--brand)]/12" },
        { kind: "overdue" as const, label: t("dash.statOverdue"), value: String(stats.overdue), Icon: AlertTriangle, tone: "text-[color:var(--color-danger)]", bg: "bg-[color:var(--color-danger)]/12" },
      ]
    : [];

  const actions = [
    { label: t("dash.addCustomer"), Icon: UserPlus, tone: "text-[color:var(--color-success)]", bg: "bg-[color:var(--color-success)]/12", onClick: () => setCustSheet(true) },
    { label: t("dash.addExpense"), Icon: Plus, tone: "text-[color:var(--color-danger)]", bg: "bg-[color:var(--color-danger)]/12", onClick: () => setExpSheet(true) },
    { label: t("dash.manageAreas"), Icon: MapPin, tone: "text-[color:var(--brand)]", bg: "bg-[color:var(--brand)]/12", href: "/areas" },
    { label: t("dash.importLine"), Icon: UploadCloud, tone: "text-[color:var(--brand)]", bg: "bg-[color:var(--brand)]/12", href: "/lines" },
  ];

  const CollectCard = (
    <GlassCard className="animate-float-in">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] shrink-0">
          <CalendarDays size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[color:var(--text)]">{t("dash.collect")}</h2>
          <p className="text-sm text-[color:var(--text-soft)]">{t("dash.collectSubtitle")}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl p-4 bg-black/[0.03] dark:bg-white/[0.03] space-y-3">
        <div>
          <label className="text-sm font-medium text-[color:var(--text-soft)]">{t("dash.date")}</label>
          <div className="relative mt-1.5">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field w-full h-12 px-4 pr-11 text-[15px]" />
            <CalendarDays size={20} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-[color:var(--text-soft)]">{t("dash.areaOptional")}</label>
          <div className="mt-1.5">
            <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value="">{t("dash.allAreas")}</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="outline" onClick={() => goCollect("bulk")}>{t("dash.bulkCollect")}</Button>
          <Button onClick={() => goCollect("instant")}>{t("dash.instantCollect")}</Button>
        </div>
      </div>
    </GlassCard>
  );

  const KpiGrid = (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {kpis.map((k) => (
        <button key={k.label} onClick={() => setKpiKind(k.kind)} className="text-left">
          <GlassCard className="p-4 h-full active:scale-[.98] hover:brightness-105 transition cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl grid place-items-center ${k.bg} ${k.tone}`}>
                <k.Icon size={20} />
              </div>
              <ChevronRight size={18} className="text-[color:var(--text-faint)]" />
            </div>
            <div className="text-2xl font-extrabold text-[color:var(--text)]">{k.value}</div>
            <div className="text-sm text-[color:var(--text-soft)]">{k.label}</div>
          </GlassCard>
        </button>
      ))}
    </div>
  );

  const TrendCard = (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[color:var(--text)]">{t("dash.statCollected")} · 7d</h3>
        <span className="text-sm font-semibold text-[color:var(--color-success)]">
          {inr(trend.reduce((s, d) => s + d.amount, 0))}
        </span>
      </div>
      <AreaChart data={trend} height={180} />
    </GlassCard>
  );

  const QuickActions = (
    <section>
      <h3 className="text-lg font-bold text-[color:var(--text)] mb-3">{t("dash.quickActions")}</h3>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {actions.map((a) => {
          const inner = (
            <div className="flex flex-col items-center justify-center gap-3 py-2">
              <div className={`w-14 h-14 rounded-full grid place-items-center ${a.bg} ${a.tone}`}>
                <a.Icon size={26} />
              </div>
              <span className="font-semibold text-[color:var(--text)] text-center">{a.label}</span>
            </div>
          );
          return a.href ? (
            <Link key={a.label} href={a.href}>
              <GlassCard className="p-4 active:scale-[.98] hover:brightness-105 transition h-full">{inner}</GlassCard>
            </Link>
          ) : (
            <button key={a.label} onClick={a.onClick} className="text-left">
              <GlassCard className="p-4 active:scale-[.98] hover:brightness-105 transition h-full w-full">{inner}</GlassCard>
            </button>
          );
        })}
      </div>
    </section>
  );

  const Tips = (
    <section className="space-y-3">
      <h3 className="text-lg font-bold text-[color:var(--text)]">{t("dash.tipsUpdates")}</h3>
      {bannerOpen && (
        <GlassCard className="relative">
          <button onClick={() => setBannerOpen(false)} className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-full bg-[color:var(--color-danger)]/12 text-[color:var(--color-danger)]">
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 text-[color:var(--brand)] font-bold text-lg pr-8">
            <Info size={22} /> {t("dash.welcomeBanner")} ✨
          </div>
          <p className="mt-2 text-[color:var(--text-soft)]">{t("dash.trialBanner")}</p>
        </GlassCard>
      )}
      <a href="https://vasool.app" target="_blank" rel="noreferrer" className="block">
        <GlassCard className="flex items-center justify-between active:scale-[.99] hover:brightness-105 transition">
          <div>
            <div className="font-bold text-[color:var(--text)]">{t("dash.watchDemo")}</div>
            <div className="text-sm text-[color:var(--text-soft)]">{t("dash.watchDemoDesc")}</div>
          </div>
          <PlayCircle className="text-[#ff0000] shrink-0" size={34} />
        </GlassCard>
      </a>
      <GlassCard className="flex items-center justify-between">
        <div>
          <div className="font-bold text-[color:var(--text)]">{t("dash.shareApp")}</div>
          <div className="text-sm text-[color:var(--text-soft)]">{t("dash.shareAppDesc")}</div>
        </div>
        <Send className="text-[color:var(--brand)] shrink-0" size={26} />
      </GlassCard>
    </section>
  );

  return (
    <>
      <TopBar />

      <main className="px-4 md:px-8 pt-1 md:pt-2 pb-8 space-y-6">
        {/* Desktop title */}
        <div className="hidden md:flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[color:var(--text)]">
              {t("nav.dashboard")}
            </h1>
            <p className="text-[color:var(--text-soft)] mt-1">
              {activeLine?.name} · {fmtDate(new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Row 1: Collect + KPIs/Chart */}
        <div className="grid gap-5 lg:grid-cols-3 items-start">
          <div className="lg:col-span-1">{CollectCard}</div>
          <div className="lg:col-span-2 space-y-5">
            {KpiGrid}
            {TrendCard}
          </div>
        </div>

        {/* Row 2: Quick actions + Tips */}
        <div className="grid gap-5 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2">{QuickActions}</div>
          <div className="lg:col-span-1">{Tips}</div>
        </div>

      </main>

      <CustomerSheet open={custSheet} onClose={() => setCustSheet(false)} />
      <FinanceSheet open={expSheet} onClose={() => setExpSheet(false)} kind="expense" />
      <KpiDetailSheet kind={kpiKind} onClose={() => setKpiKind(null)} />
    </>
  );
}

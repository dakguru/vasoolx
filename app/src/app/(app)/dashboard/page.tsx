"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  IndianRupee,
  Wallet,
  Landmark,
  Target,
  AlertTriangle,
  TrendingUp,
  Zap,
  Layers,
  ScanLine,
  Receipt,
  UserPlus,
  HandCoins,
  Plus,
  Route,
  UploadCloud,
  FileBarChart,
  Scale,
  Download,
  SlidersHorizontal,
  Wand2,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Building2,
  CircleUserRound,
  Activity,
  Sparkles,
  Bell,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import {
  Panel,
  PanelHead,
  StatusBadge,
  Trend,
  Sparkline,
  BarList,
  ProgressBar,
  DonutRing,
  SeverityTag,
  AutoStatus,
} from "@/components/ui/erp";
import { PerformanceChart, SegmentDonut, type PerfPoint } from "@/components/ui/erpcharts";
import { CustomerSheet } from "@/components/sheets/CustomerSheet";
import { FinanceSheet } from "@/components/sheets/FinanceSheet";
import { KpiDetailSheet, type KpiKind } from "@/components/sheets/KpiDetailSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inLine } from "@/lib/data/selectors";
import {
  lineStats,
  collectionTrend,
  collectionByArea,
  agingBuckets,
  agentPerformance,
  recentTransactions,
  exceptions,
  collectionTarget,
  customerActiveLoan,
  loanOutstanding,
  areaName,
} from "@/lib/data/selectors";
import { inr, inrCompact, toDateInput, fmtDate } from "@/lib/format";

type Range = "7d" | "30d" | "month" | "custom";

export default function DashboardPage() {
  const { t } = useI18n();
  const { data, activeLine } = useStore();
  const router = useRouter();

  const [date, setDate] = useState(toDateInput(new Date().toISOString()));
  const [areaId, setAreaId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [custQuery, setCustQuery] = useState("");
  const [range, setRange] = useState<Range>("7d");
  const [custSheet, setCustSheet] = useState(false);
  const [expSheet, setExpSheet] = useState(false);
  const [kpiKind, setKpiKind] = useState<KpiKind>(null);

  const lineId = activeLine?.id ?? "";
  const areas = data.areas.filter((a) => inLine(a.lineId, lineId));
  const members = data.members.filter((m) => inLine(m.lineId, lineId));

  const stats = useMemo(() => (activeLine ? lineStats(data, lineId) : null), [data, lineId, activeLine]);
  const trend7 = useMemo(() => (activeLine ? collectionTrend(data, lineId, 7) : []), [data, lineId, activeLine]);
  const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : range === "month" ? new Date().getDate() : 14;
  const trendR = useMemo(
    () => (activeLine ? collectionTrend(data, lineId, rangeDays) : []),
    [data, lineId, activeLine, rangeDays]
  );
  const byArea = useMemo(() => (activeLine ? collectionByArea(data, lineId) : []), [data, lineId, activeLine]);
  const aging = useMemo(() => (activeLine ? agingBuckets(data, lineId) : null), [data, lineId, activeLine]);
  const agents = useMemo(() => (activeLine ? agentPerformance(data, lineId) : []), [data, lineId, activeLine]);
  const recent = useMemo(() => (activeLine ? recentTransactions(data, lineId, 6) : []), [data, lineId, activeLine]);
  const alerts = useMemo(() => (activeLine ? exceptions(data, lineId) : []), [data, lineId, activeLine]);
  const target = activeLine ? collectionTarget(data, lineId) : 25000;

  if (!stats || !aging) return null;

  // ---- Derived KPI metrics (all from real data) ----
  const collected = stats.collectedToday;
  const yesterday = trend7.length >= 2 ? trend7[trend7.length - 2].amount : 0;
  const collectedTrend = yesterday > 0 ? ((collected - yesterday) / yesterday) * 100 : collected > 0 ? 100 : 0;
  const spark = trend7.map((d) => d.amount);
  const outstandingBefore = stats.outstanding + collected;
  const outstandingTrend = outstandingBefore > 0 ? (-collected / outstandingBefore) * 100 : 0;
  const achievement = target > 0 ? collected / target : 0;
  const rate = achievement; // collection rate = achieved vs target
  const yRate = yesterday > 0 ? yesterday / target : 0;
  const rateTrend = yRate > 0 ? (rate - yRate) * 100 : 0;
  const closedLoans = data.loans.filter((l) => inLine(l.lineId, lineId) && l.status === "closed").length;

  function goCollect(mode: "instant" | "bulk") {
    const qs = new URLSearchParams({ mode, date });
    if (areaId) qs.set("area", areaId);
    router.push(`/collect?${qs.toString()}`);
  }

  // ---- KPI cards ----
  const KPIS = (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <Kpi kind="collected" onOpen={setKpiKind} label={t("dash.collectedToday")} value={inr(collected)}
        icon={<IndianRupee size={17} />} color="var(--ok)" trend={collectedTrend} trendNote={t("dash.vsYesterday")} spark={spark} />
      <Kpi kind="outstanding" onOpen={setKpiKind} label={t("dash.outstanding")} value={inrCompact(stats.outstanding)}
        icon={<Wallet size={17} />} color="var(--brand)" trend={outstandingTrend} trendInvert trendNote={t("dash.vsYesterday")} spark={spark} />
      <Kpi kind="active" onOpen={setKpiKind} label={t("dash.activeLoans")} value={String(stats.activeLoans)}
        icon={<Landmark size={17} />} color="#7c6bf0" foot={t("dash.closedCustomers", { closed: closedLoans, customers: stats.totalCustomers })} />
      <Kpi kind={null} label={t("dash.todaysTarget")} value={inrCompact(target)}
        icon={<Target size={17} />} color="var(--warn)" ring={achievement} ringNote={t("dash.achieved", { pct: Math.round(achievement * 100) })} />
      <Kpi kind="overdue" onOpen={setKpiKind} label={t("dash.overdue")} value={String(stats.overdue)}
        icon={<AlertTriangle size={17} />} color="var(--crit)" foot={stats.overdue > 0 ? t("dash.requiresAttention") : t("dash.allCurrent")} />
      <Kpi kind={null} label={t("dash.collectionRate")} value={`${(rate * 100).toFixed(1)}%`}
        icon={<TrendingUp size={17} />} color="var(--ok)" trend={rateTrend} trendNote={t("dash.vsYesterday")} spark={spark} />
    </div>
  );

  // ---- Collection performance series ----
  const perf: PerfPoint[] = trendR.map((d) => ({ label: d.label, actual: d.amount, target }));
  const rangeSum = trendR.reduce((s, d) => s + d.amount, 0);
  const rangeTargetSum = target * trendR.length;

  // ---- Aging segments ----
  const agingSegs = [
    { label: t("dash.agingCurrent"), value: aging.current, color: "var(--ok)" },
    { label: t("dash.aging1_30"), value: aging.d1_30, color: "var(--brand)" },
    { label: t("dash.aging31_60"), value: aging.d31_60, color: "var(--warn)" },
    { label: t("dash.aging61_90"), value: aging.d61_90, color: "#f97316" },
    { label: t("dash.aging90p"), value: aging.d90p, color: "var(--crit)" },
  ];
  const agingTotal = Math.max(1, aging.total);

  // ---- Quick actions ----
  const actions = [
    { label: t("dash.qaAddCustomer"), Icon: UserPlus, color: "var(--ok)", onClick: () => setCustSheet(true) },
    { label: t("dash.qaRecordCollection"), Icon: HandCoins, color: "var(--brand)", href: "/collect?mode=instant" },
    { label: t("dash.qaAddExpense"), Icon: Plus, color: "var(--crit)", onClick: () => setExpSheet(true) },
    { label: t("dash.qaCreateRoute"), Icon: Route, color: "#7c6bf0", href: "/areas" },
    { label: t("dash.qaImportData"), Icon: UploadCloud, color: "var(--brand)", href: "/lines" },
    { label: t("dash.qaGenerateReport"), Icon: FileBarChart, color: "var(--warn)", href: "/reports" },
    { label: t("dash.qaReconcile"), Icon: Scale, color: "var(--ok)", href: "/finance" },
    { label: t("dash.qaExportData"), Icon: Download, color: "var(--muted)", href: "/reports?tab=export" },
  ];

  const alertTimes = ["10m ago", "35m ago", "1h ago", "2h ago", "3h ago", "5h ago"];
  const updates = [
    { Icon: RefreshCw, title: "System maintenance scheduled", sub: "20 Aug 2026, 11:00 PM – 01:00 AM", tag: "New", tone: "info" as const },
    { Icon: Sparkles, title: "Bulk Collection improvements", sub: "New performance analytics released", tag: "New", tone: "ok" as const },
    { Icon: Download, title: "VasoolX Android App v2.4.1", sub: "New version available. Update now.", tag: "Update", tone: "warn" as const },
  ];

  const now = new Date();
  const syncTime = now.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });

  return (
    <>
      <TopBar />
      <main className="px-4 md:px-6 py-4 space-y-4 animate-fade-up">
        {/* Page toolbar */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold text-[color:var(--text)] tracking-tight leading-none">{t("dash.title")}</h1>
            <p className="text-[13px] text-[color:var(--text-soft)] mt-1.5">
              {t("dash.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="chip">
              <CalendarDays size={15} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent outline-none text-[13px] font-medium tabular w-[110px]"
              />
            </label>
            <button className="chip">
              <SlidersHorizontal size={15} /> {t("dash.filters")}
            </button>
            <button className="btn-primary h-[34px] px-3.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5">
              <Wand2 size={15} /> {t("dash.customize")}
            </button>
          </div>
        </div>

        {/* KPI row */}
        {KPIS}

        {/* Performance + Workspace */}
        <div className="grid gap-4 xl:grid-cols-12 items-stretch">
          <Panel className="xl:col-span-8 flex flex-col">
            <PanelHead
              title={t("dash.collectionPerformance")}
              desc={t("dash.collectedVsTarget", { collected: inr(rangeSum), target: inr(rangeTargetSum) })}
              action={
                <div className="flex items-center gap-3">
                  <div className="segtab">
                    {([["7d", t("dash.range7d")], ["30d", t("dash.range30d")], ["month", t("dash.rangeMonth")], ["custom", t("dash.rangeCustom")]] as [Range, string][]).map(
                      ([v, lbl]) => (
                        <button key={v} data-active={range === v} onClick={() => setRange(v)}>
                          {lbl}
                        </button>
                      )
                    )}
                  </div>
                  <Link href="/reports/loan-summary" className="text-[12px] font-semibold text-[color:var(--brand)] hidden lg:inline-flex items-center gap-0.5">
                    {t("dash.viewReport")} <ChevronRight size={13} />
                  </Link>
                </div>
              }
            />
            <div className="p-4 flex-1">
              <div className="flex items-center gap-4 mb-2 text-[11.5px] font-medium">
                <Legend color="var(--brand)" label={t("dash.legendActual")} />
                <Legend color="var(--text-faint)" label={t("dash.legendTarget")} dashed />
                <Legend color="var(--ok)" label={t("dash.legendVariance")} square />
              </div>
              <PerformanceChart data={perf} height={248} />
            </div>
          </Panel>

          {/* Collection Workspace */}
          <Panel className="xl:col-span-4 flex flex-col">
            <PanelHead title={t("dash.workspace")} icon={<Zap size={15} />} desc={t("dash.workspaceDesc")} />
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("dash.date")}>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field-erp w-full h-9 px-2.5 text-[13px]" />
                </Field>
                <Field label={t("dash.area")}>
                  <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="field-erp w-full h-9 px-2.5 text-[13px] appearance-none cursor-pointer">
                    <option value="">{t("dash.allAreas")}</option>
                    {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </Field>
                <Field label={t("dash.agent")}>
                  <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="field-erp w-full h-9 px-2.5 text-[13px] appearance-none cursor-pointer">
                    <option value="">{t("dash.allAgents")}</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </Field>
                <Field label={t("dash.customer")}>
                  <input value={custQuery} onChange={(e) => setCustQuery(e.target.value)} placeholder={t("dash.searchCustomer")} className="field-erp w-full h-9 px-2.5 text-[13px]" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-1 mt-auto">
                <button onClick={() => goCollect("instant")} className="btn-primary h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5">
                  <Zap size={15} /> {t("dash.instantCollect")}
                </button>
                <button onClick={() => goCollect("bulk")} className="h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 border border-[color:var(--ok-line)] bg-[color:var(--ok-bg)] text-[color:var(--ok)] hover:brightness-105 transition">
                  <Layers size={15} /> {t("dash.bulkCollect")}
                </button>
                <button onClick={() => router.push("/collect")} className="chip h-10 justify-center">
                  <ScanLine size={15} /> {t("dash.searchScan")}
                </button>
                <button onClick={() => router.push("/collect?mode=instant")} className="chip h-10 justify-center">
                  <Receipt size={15} /> {t("dash.recordPayment")}
                </button>
              </div>
            </div>
          </Panel>
        </div>

        {/* Aging + Agents + Area */}
        <div className="grid gap-4 xl:grid-cols-12 items-stretch">
          {/* Aging */}
          <Panel className="xl:col-span-4 flex flex-col">
            <PanelHead
              title={t("dash.outstandingAging")}
              action={<Link href="/receivables?view=aging" className="text-[12px] font-semibold text-[color:var(--brand)]">{t("dash.viewReport")}</Link>}
            />
            <div className="p-4 flex items-center gap-4 flex-1">
              <SegmentDonut
                segments={agingSegs}
                centerTop={inrCompact(aging.total)}
                centerSub={t("dash.totalOutstanding")}
              />
              <div className="flex-1 min-w-0 space-y-2">
                {agingSegs.map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-[12px]">
                    <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: s.color }} />
                    <span className="text-[color:var(--text-soft)] truncate flex-1">{s.label}</span>
                    <span className="font-bold text-[color:var(--text)] tabular">{inrCompact(s.value)}</span>
                    <span className="text-[color:var(--text-faint)] tabular w-9 text-right">
                      {Math.round((s.value / agingTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Agents */}
          <Panel className="xl:col-span-4 flex flex-col overflow-hidden">
            <PanelHead
              title={t("dash.topAgents")}
              action={<Link href="/users" className="text-[12px] font-semibold text-[color:var(--brand)]">{t("dash.viewAll")}</Link>}
            />
            <div className="overflow-x-auto flex-1">
              <table className="dt">
                <thead>
                  <tr>
                    <th>{t("dash.agent")}</th>
                    <th className="text-right">{t("dash.thTarget")}</th>
                    <th className="text-right">{t("dash.thCollected")}</th>
                    <th>{t("dash.thAchievement")}</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.slice(0, 5).map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] text-[10px] font-bold shrink-0">
                            {a.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-medium truncate max-w-[90px]">{a.name}</span>
                        </div>
                      </td>
                      <td className="text-right tabular text-[color:var(--text-soft)]">{inrCompact(a.target)}</td>
                      <td className="text-right tabular font-semibold">{inrCompact(a.collected)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-14"><ProgressBar value={a.achievement} color={a.achievement >= 0.9 ? "var(--ok)" : a.achievement >= 0.7 ? "var(--warn)" : "var(--crit)"} /></div>
                          <span className="tabular text-[11px] font-semibold text-[color:var(--text-soft)] w-9">{Math.round(a.achievement * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Area */}
          <Panel className="xl:col-span-4 flex flex-col">
            <PanelHead
              title={t("dash.collectionByArea")}
              action={<Link href="/areas" className="text-[12px] font-semibold text-[color:var(--brand)]">{t("dash.viewReport")}</Link>}
            />
            <div className="p-4 flex-1">
              {byArea.some((a) => a.amount > 0) ? (
                <BarList
                  items={byArea.slice(0, 6).map((a) => ({ label: a.name, value: a.amount, sub: t("dash.custShort", { n: a.customers }) }))}
                  format={inrCompact}
                />
              ) : (
                <BarList
                  items={byArea.slice(0, 6).map((a) => ({ label: a.name, value: a.customers, sub: t("dash.customersLower") }))}
                  format={(n) => String(n)}
                />
              )}
            </div>
          </Panel>
        </div>

        {/* Recent transactions + Alerts */}
        <div className="grid gap-4 xl:grid-cols-12 items-stretch">
          <Panel className="xl:col-span-8 flex flex-col overflow-hidden">
            <PanelHead
              title={t("dash.recentTransactions")}
              desc={t("dash.recentTransactionsDesc")}
              action={<Link href="/finance" className="text-[12px] font-semibold text-[color:var(--brand)]">{t("dash.viewAll")}</Link>}
            />
            <div className="overflow-x-auto flex-1">
              <table className="dt">
                <thead>
                  <tr>
                    <th>{t("dash.thDateTime")}</th>
                    <th>{t("dash.thReceipt")}</th>
                    <th>{t("dash.customer")}</th>
                    <th>{t("dash.area")}</th>
                    <th>{t("dash.thMode")}</th>
                    <th className="text-right">{t("dash.thAmount")}</th>
                    <th className="text-right">{t("dash.outstanding")}</th>
                    <th>{t("dash.thStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((tx, i) => {
                    const cust = data.customers.find((c) => c.name === tx.customer);
                    const loan = cust ? customerActiveLoan(data, cust.id) : null;
                    const outstanding = loan ? loanOutstanding(data, loan) : 0;
                    const area = cust ? areaName(data, cust.areaId) : null;
                    const rcpt = `RCPT-${String(1230 - i).padStart(6, "0")}`;
                    const status = tx.kind === "payment" ? (outstanding > 0 ? "partial" : "completed") : tx.kind;
                    return (
                      <tr key={tx.id}>
                        <td className="tabular text-[color:var(--text-soft)] whitespace-nowrap">{fmtDate(tx.date)}</td>
                        <td><span className="font-semibold text-[color:var(--brand)]">{rcpt}</span></td>
                        <td className="font-medium">{tx.customer ?? <span className="text-[color:var(--text-faint)]">{tx.note}</span>}</td>
                        <td className="text-[color:var(--text-soft)]">{area ?? "—"}</td>
                        <td><span className="uppercase text-[11px] font-semibold text-[color:var(--text-soft)]">{tx.method}</span></td>
                        <td className="text-right tabular font-bold">{inr(tx.amount)}</td>
                        <td className="text-right tabular text-[color:var(--text-soft)]">{outstanding > 0 ? inr(outstanding) : "₹0"}</td>
                        <td><AutoStatus value={status} /></td>
                      </tr>
                    );
                  })}
                  {recent.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-[color:var(--text-faint)] py-8">{t("dash.noTransactions")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Alerts */}
          <Panel className="xl:col-span-4 flex flex-col">
            <PanelHead
              title={t("dash.alerts")}
              icon={<Bell size={15} />}
              action={<Link href="/dashboard" className="text-[12px] font-semibold text-[color:var(--brand)]">{t("dash.viewAll")}</Link>}
            />
            <div className="divide-y divide-[color:var(--line)] flex-1 overflow-y-auto">
              {alerts.length ? alerts.slice(0, 5).map((a, i) => (
                <Link key={a.id} href={a.href ?? "#"} className="flex items-start gap-3 px-4 py-3 hover:bg-[color:var(--brand)]/5 transition">
                  <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 badge-${sevTone(a.severity)}`}>
                    <AlertTriangle size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[color:var(--text)] leading-snug">{a.title}</div>
                    <div className="text-[11.5px] text-[color:var(--text-faint)] mt-0.5 truncate">{a.detail}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <SeverityTag severity={a.severity} />
                    <span className="text-[10px] text-[color:var(--text-faint)]">{alertTimes[i]}</span>
                  </div>
                </Link>
              )) : (
                <div className="flex flex-col items-center justify-center text-center py-10 px-4">
                  <ShieldCheck size={28} className="text-[color:var(--ok)] mb-2" />
                  <div className="text-[13px] font-semibold text-[color:var(--text)]">{t("dash.allClear")}</div>
                  <div className="text-[12px] text-[color:var(--text-faint)]">{t("dash.noExceptions")}</div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Quick actions + System updates */}
        <div className="grid gap-4 xl:grid-cols-12 items-stretch">
          <Panel className="xl:col-span-8 flex flex-col">
            <PanelHead title={t("dash.quickActionsTitle")} desc={t("dash.quickActionsDesc")} />
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              {actions.map((a) => {
                const inner = (
                  <div className="panel-2 panel-hover rounded-xl p-3 flex items-center gap-3 h-full">
                    <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
                      style={{ background: `color-mix(in srgb, ${a.color} 14%, transparent)`, color: a.color }}>
                      <a.Icon size={17} />
                    </span>
                    <span className="text-[12.5px] font-semibold text-[color:var(--text)] leading-tight">{a.label}</span>
                  </div>
                );
                return a.href ? (
                  <Link key={a.label} href={a.href}>{inner}</Link>
                ) : (
                  <button key={a.label} onClick={a.onClick} className="text-left">{inner}</button>
                );
              })}
            </div>
          </Panel>

          <Panel className="xl:col-span-4 flex flex-col">
            <PanelHead
              title={t("dash.systemUpdates")}
              action={<Link href="/subscription" className="text-[12px] font-semibold text-[color:var(--brand)]">{t("dash.viewAll")}</Link>}
            />
            <div className="divide-y divide-[color:var(--line)] flex-1">
              {updates.map((u, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="w-8 h-8 rounded-lg grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)] shrink-0">
                    <u.Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[color:var(--text)] leading-snug">{u.title}</div>
                    <div className="text-[11.5px] text-[color:var(--text-faint)] mt-0.5">{u.sub}</div>
                  </div>
                  <StatusBadge tone={u.tone} dot={false}>{u.tag}</StatusBadge>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Enterprise status strip */}
        <Panel className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px]">
            <StatusItem Icon={RefreshCw} label={t("dash.lastSync")} value={`${syncTime} IST`} />
            <StatusItem Icon={Building2} label={t("dash.branch")} value={t("dash.branchName", { name: activeLine?.name ?? "—" })} />
            <StatusItem Icon={CircleUserRound} label={t("dash.userRole")} value={t("dash.administrator")} />
            <StatusItem Icon={Activity} label={t("dash.dataStatus")} value={t("dash.systemsOperational")} ok />
            <StatusItem Icon={ShieldCheck} label={t("dash.secureConnection")} value={t("dash.sslEncrypted")} ok />
          </div>
        </Panel>
      </main>

      <CustomerSheet open={custSheet} onClose={() => setCustSheet(false)} />
      <FinanceSheet open={expSheet} onClose={() => setExpSheet(false)} kind="expense" />
      <KpiDetailSheet kind={kpiKind} onClose={() => setKpiKind(null)} />
    </>
  );
}

/* ---------------- Local subcomponents ---------------- */

function Kpi({
  label, value, icon, color, trend, trendInvert, trendNote, spark, foot, ring, ringNote, kind, onOpen,
}: {
  label: string; value: string; icon: React.ReactNode; color: string;
  trend?: number; trendInvert?: boolean; trendNote?: string; spark?: number[];
  foot?: string; ring?: number; ringNote?: string;
  kind?: KpiKind; onOpen?: (k: KpiKind) => void;
}) {
  const clickable = kind !== null && kind !== undefined && !!onOpen;
  const Tag = clickable ? "button" : "div";
  return (
    <Tag
      onClick={clickable ? () => onOpen!(kind!) : undefined}
      style={{ ["--kpi-color" as string]: color }}
      className={`panel kpi-accent panel-hover text-left w-full p-3.5 pl-4 ${clickable ? "cursor-pointer active:scale-[.99] transition" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="w-8 h-8 rounded-full grid place-items-center shrink-0"
          style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
          {icon}
        </span>
        {ring !== undefined ? (
          <DonutRing value={ring} size={40} stroke={5} color={color} label={`${Math.round(ring * 100)}`} />
        ) : spark ? (
          <div className="w-16"><Sparkline data={spark} color={color} height={30} /></div>
        ) : clickable ? (
          <ChevronRight size={16} className="text-[color:var(--text-faint)]" />
        ) : null}
      </div>
      <div className="text-[12px] text-[color:var(--text-soft)] font-medium mt-2.5">{label}</div>
      <div className="text-[22px] leading-none font-extrabold text-[color:var(--text)] tabular mt-1">{value}</div>
      <div className="mt-1.5 min-h-[16px] flex items-center gap-1.5">
        {trend !== undefined ? (
          <>
            <Trend value={trend} invert={trendInvert} />
            {trendNote && <span className="text-[11px] text-[color:var(--text-faint)]">{trendNote}</span>}
          </>
        ) : ringNote ? (
          <span className="text-[11px] font-medium" style={{ color }}>{ringNote}</span>
        ) : foot ? (
          <span className="text-[11px] text-[color:var(--text-faint)]">{foot}</span>
        ) : null}
      </div>
    </Tag>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-[color:var(--text-soft)] mb-1">{label}</span>
      {children}
    </label>
  );
}

function Legend({ color, label, dashed, square }: { color: string; label: string; dashed?: boolean; square?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[color:var(--text-soft)]">
      {square ? (
        <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: color, opacity: 0.5 }} />
      ) : dashed ? (
        <span className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <span className="w-4 h-[3px] rounded-full" style={{ background: color }} />
      )}
      {label}
    </span>
  );
}

function StatusItem({ Icon, label, value, ok }: { Icon: typeof ShieldCheck; label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${ok ? "bg-[color:var(--ok-bg)] text-[color:var(--ok)]" : "bg-[color:var(--brand)]/10 text-[color:var(--brand)]"}`}>
        <Icon size={14} />
      </span>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wide text-[color:var(--text-faint)]">{label}</div>
        <div className="text-[12px] font-semibold text-[color:var(--text)] flex items-center gap-1">
          {ok && <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--ok)]" />}
          {value}
        </div>
      </div>
    </div>
  );
}

function sevTone(s: "critical" | "high" | "medium" | "low") {
  return s === "critical" ? "crit" : s === "high" ? "warn" : s === "medium" ? "info" : "neutral";
}

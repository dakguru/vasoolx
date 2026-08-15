"use client";

import { ArrowDownRight, ArrowUpRight, Minus, Search } from "lucide-react";
import { cx } from "./primitives";

/* ============================================================
   VasoolX — Enterprise ERP component kit
   Shared, dense, professional building blocks used across every module.
   ============================================================ */

/* ---------------- Panel ---------------- */
export function Panel({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return (
    <Tag className={cx("panel", className)} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------------- Panel header ---------------- */
export function PanelHead({
  title,
  desc,
  icon,
  action,
}: {
  title: React.ReactNode;
  desc?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="panel-head">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="w-8 h-8 rounded-lg grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] shrink-0">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-[color:var(--text)] leading-tight truncate">
            {title}
          </h3>
          {desc && (
            <p className="text-[12px] text-[color:var(--text-faint)] leading-tight mt-0.5 truncate">
              {desc}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </header>
  );
}

/* ---------------- Section title (page-level) ---------------- */
export function SectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-center gap-2", className)}>
      <span className="w-1 h-4 rounded-full bg-[color:var(--brand)]" />
      <h2 className="text-[15px] font-bold text-[color:var(--text)] tracking-tight">
        {children}
      </h2>
    </div>
  );
}

/* ---------------- Page header (module pages) ---------------- */
export function PageHead({
  title,
  subtitle,
  actions,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-3 px-4 md:px-6 pt-4 md:pt-5", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-[color:var(--brand)]" />
          <h1 className="text-[22px] font-extrabold text-[color:var(--text)] tracking-tight leading-none truncate">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-[13px] text-[color:var(--text-soft)] mt-1.5 ml-3">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/* ---------------- Search input ---------------- */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cx("relative", className)}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-erp w-full h-9 pl-9 pr-3 text-[13px]"
      />
    </div>
  );
}

/* ---------------- Toolbar ---------------- */
export function Toolbar({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-[color:var(--line)] bg-[color:var(--panel-3)]", className)}>
      {children}
    </div>
  );
}

/* ---------------- Stat tile (compact metric) ---------------- */
export function StatTile({
  label,
  value,
  icon,
  color = "var(--brand)",
  sub,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="panel kpi-accent p-3.5 pl-4" style={{ ["--kpi-color" as string]: color }}>
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
            style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <div className="text-[11px] text-[color:var(--text-faint)] font-medium uppercase tracking-wide truncate">{label}</div>
          <div className="text-[19px] font-extrabold text-[color:var(--text)] tabular leading-tight">{value}</div>
        </div>
      </div>
      {sub && <div className="text-[11px] text-[color:var(--text-faint)] mt-1.5">{sub}</div>}
    </div>
  );
}

/* ---------------- Status badge ---------------- */
export type Tone = "ok" | "warn" | "crit" | "info" | "neutral";
export function StatusBadge({
  tone = "neutral",
  dot = true,
  children,
  className = "",
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx("badge", `badge-${tone}`, dot && "badge-dot", className)}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  paid: "ok",
  active: "ok",
  completed: "ok",
  verified: "ok",
  online: "info",
  bank: "info",
  pending: "warn",
  partial: "warn",
  cash: "neutral",
  inactive: "neutral",
  closed: "neutral",
  overdue: "crit",
  failed: "crit",
  bad: "crit",
};
export function AutoStatus({ value, label }: { value: string; label?: string }) {
  const tone = STATUS_TONE[value.toLowerCase()] ?? "neutral";
  return <StatusBadge tone={tone}>{label ?? cap(value)}</StatusBadge>;
}
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------------- Trend pill ---------------- */
export function Trend({
  value,
  suffix = "%",
  invert = false,
  className = "",
}: {
  value: number;
  suffix?: string;
  invert?: boolean; // for metrics where down is good (e.g. outstanding)
  className?: string;
}) {
  const up = value > 0;
  const flat = value === 0;
  const good = invert ? !up : up;
  const tone = flat
    ? "text-[color:var(--text-faint)]"
    : good
      ? "text-[color:var(--ok)]"
      : "text-[color:var(--crit)]";
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cx("inline-flex items-center gap-0.5 text-[12px] font-semibold tabular", tone, className)}>
      <Icon size={13} strokeWidth={2.6} />
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

/* ---------------- KPI card ---------------- */
export function KpiCard({
  label,
  value,
  icon,
  color = "var(--brand)",
  trend,
  trendInvert,
  foot,
  spark,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  trend?: number;
  trendInvert?: boolean;
  foot?: string;
  spark?: number[];
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      style={{ ["--kpi-color" as string]: color }}
      className={cx(
        "panel kpi-accent panel-hover text-left w-full p-3.5 pl-4 flex flex-col gap-2",
        onClick && "cursor-pointer active:scale-[.99] transition"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
          style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
        >
          {icon}
        </span>
        {trend !== undefined && <Trend value={trend} invert={trendInvert} />}
      </div>
      <div>
        <div className="text-[22px] leading-none font-extrabold text-[color:var(--text)] tabular">
          {value}
        </div>
        <div className="text-[12px] text-[color:var(--text-soft)] mt-1 font-medium">
          {label}
        </div>
      </div>
      {spark ? (
        <Sparkline data={spark} color={color} />
      ) : foot ? (
        <div className="text-[11px] text-[color:var(--text-faint)] tabular">{foot}</div>
      ) : null}
    </Tag>
  );
}

/* ---------------- Sparkline ---------------- */
export function Sparkline({
  data,
  color = "var(--brand)",
  height = 26,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const w = 100;
  const max = Math.max(1, ...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const y = (v: number) => height - 2 - ((v - min) / range) * (height - 4);
  const pts = data.map((d, i) => [i * step, y(d)] as const);
  const line = pts.map(([x, yy], i) => `${i ? "L" : "M"}${x.toFixed(1)},${yy.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const gid = `spk-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ---------------- Progress bar ---------------- */
export function ProgressBar({
  value, // 0..1
  color = "var(--brand)",
  height = 6,
  track = "var(--panel-3)",
}: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: track }}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }}
      />
    </div>
  );
}

/* ---------------- Horizontal bar list ---------------- */
export function BarList({
  items,
  format,
}: {
  items: { label: string; value: number; sub?: string; color?: string }[];
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[13px] font-medium text-[color:var(--text)] truncate">{it.label}</span>
              {it.sub && (
                <span className="text-[11px] text-[color:var(--text-faint)] shrink-0">{it.sub}</span>
              )}
            </div>
            <span className="text-[13px] font-bold text-[color:var(--text)] tabular shrink-0">
              {format(it.value)}
            </span>
          </div>
          <ProgressBar value={it.value / max} color={it.color ?? "var(--brand)"} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Donut ring ---------------- */
export function DonutRing({
  value, // 0..1
  size = 92,
  stroke = 10,
  color = "var(--brand)",
  label,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        {label && <div className="text-[17px] font-extrabold text-[color:var(--text)] tabular leading-none">{label}</div>}
        {sub && <div className="text-[10px] text-[color:var(--text-faint)] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

/* ---------------- Severity dot ---------------- */
export function SeverityTag({ severity }: { severity: "critical" | "high" | "medium" | "low" }) {
  const map = {
    critical: { tone: "crit" as Tone, label: "Critical" },
    high: { tone: "warn" as Tone, label: "High" },
    medium: { tone: "info" as Tone, label: "Medium" },
    low: { tone: "neutral" as Tone, label: "Low" },
  };
  const m = map[severity];
  return <StatusBadge tone={m.tone}>{m.label}</StatusBadge>;
}

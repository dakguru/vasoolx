"use client";

import { inrCompact } from "@/lib/format";

/** Lightweight SVG area/line chart — no external deps. */
export function AreaChart({
  data,
  height = 140,
}: {
  data: { label: string; amount: number }[];
  height?: number;
}) {
  if (data.length === 0) {
    return <div className="w-full" style={{ height }} />;
  }
  const w = 320;
  const pad = 8;
  const max = Math.max(1, ...data.map((d) => d.amount));
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const pts = data.map((d, i) => [pad + i * step, y(d.amount)] as const);
  const line = pts.map(([x, yy], i) => `${i ? "L" : "M"}${x},${yy}`).join(" ");
  const area = `${line} L${pad + (data.length - 1) * step},${height - pad} L${pad},${height - pad} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="vx-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#vx-area)" />
        <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, yy], i) => (
          <circle key={i} cx={x} cy={yy} r="3" fill="var(--brand)" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[11px] text-[color:var(--text-faint)]">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MiniBars({ data }: { data: { label: string; amount: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end h-full">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-[color:var(--brand)]/40 to-[color:var(--brand)]"
              style={{ height: `${(d.amount / max) * 100}%`, minHeight: 3 }}
              title={inrCompact(d.amount)}
            />
          </div>
          <span className="text-[11px] text-[color:var(--text-faint)]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

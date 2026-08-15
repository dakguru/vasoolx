"use client";

/* ============================================================
   VasoolX — Enterprise chart primitives (dependency-free SVG)
   ============================================================ */

export interface PerfPoint {
  label: string;
  actual: number;
  target: number;
}

/** Collection performance: actual (area+line) vs target (dashed) + variance bars. */
export function PerformanceChart({ data, height = 260 }: { data: PerfPoint[]; height?: number }) {
  const W = 760;
  const H = height;
  const padL = 46;
  const padR = 14;
  const padT = 14;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const max = Math.max(1, ...data.map((d) => Math.max(d.actual, d.target)));
  const niceMax = niceCeil(max);
  const n = data.length;
  const x = (i: number) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => padT + plotH - (v / niceMax) * plotH;

  const actualPts = data.map((d, i) => [x(i), y(d.actual)] as const);
  const targetPts = data.map((d, i) => [x(i), y(d.target)] as const);
  const line = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const actualLine = line(actualPts);
  const actualArea = `${actualLine} L${x(n - 1)},${padT + plotH} L${x(0)},${padT + plotH} Z`;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => f * niceMax);
  const barW = Math.min(16, (plotW / n) * 0.34);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Collection performance">
      <defs>
        <linearGradient id="perf-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines + y labels */}
      {gridVals.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
          <text x={padL - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--text-faint)">
            {compact(v)}
          </text>
        </g>
      ))}

      {/* variance bars */}
      {data.map((d, i) => {
        const good = d.actual >= d.target;
        const barH = Math.min(plotH, (Math.abs(d.actual - d.target) / niceMax) * plotH);
        const yb = padT + plotH - barH;
        return (
          <rect
            key={`v${i}`}
            x={x(i) - barW / 2}
            y={yb}
            width={barW}
            height={barH}
            rx="2"
            fill={good ? "var(--ok)" : "var(--crit)"}
            opacity="0.28"
          />
        );
      })}

      {/* target dashed line */}
      <path d={line(targetPts)} fill="none" stroke="var(--text-faint)" strokeWidth="1.6" strokeDasharray="5 4" opacity="0.7" />

      {/* actual area + line */}
      <path d={actualArea} fill="url(#perf-area)" />
      <path d={actualLine} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {actualPts.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r="3.4" fill="var(--panel)" stroke="var(--brand)" strokeWidth="2" />
      ))}

      {/* x labels */}
      {data.map((d, i) => (
        <text key={`x${i}`} x={x(i)} y={H - 14} textAnchor="middle" fontSize="10.5" fill="var(--text-faint)">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

export interface DonutSeg {
  label: string;
  value: number;
  color: string;
}

/** Multi-segment donut for aging / distribution. */
export function SegmentDonut({
  segments,
  size = 168,
  stroke = 20,
  centerTop,
  centerSub,
}: {
  segments: DonutSeg[];
  size?: number;
  stroke?: number;
  centerTop?: string;
  centerSub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  let acc = 0;
  const gap = 2; // px gap between segments
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-3)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const segCount = segments.filter((s) => s.value > 0).length;
          const len = Math.max(0, frac * c - (frac > 0 && segCount > 1 ? gap : 0));
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          );
          acc += frac * c;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        {centerTop && <div className="text-[20px] font-extrabold text-[color:var(--text)] tabular leading-none">{centerTop}</div>}
        {centerSub && <div className="text-[10.5px] text-[color:var(--text-faint)] mt-1">{centerSub}</div>}
      </div>
    </div>
  );
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * pow;
}
function compact(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${Math.round(v / 1000)}K`;
  return `₹${Math.round(v)}`;
}

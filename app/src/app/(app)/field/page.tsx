"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Route,
  Users,
  ClipboardList,
  MapPin,
  History,
  CheckCircle2,
  Clock,
  Download,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Loader } from "@/components/ui/Loader";
import { Panel, PageHead, PanelHead, StatTile, StatusBadge, ProgressBar } from "@/components/ui/erp";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inLine } from "@/lib/data/selectors";
import {
  collectionByArea,
  customerActiveLoan,
  loanOutstanding,
  areaName,
} from "@/lib/data/selectors";
import { inr, inrCompact, fmtDate } from "@/lib/format";
import { csvExport } from "@/lib/report";

const VIEWS = [
  { key: "routes", labelKey: "sb.collectionRoutes", Icon: Route },
  { key: "agents", labelKey: "sb.fieldAgents", Icon: Users },
  { key: "assignments", labelKey: "sb.dailyAssignments", Icon: ClipboardList },
  { key: "tracking", labelKey: "sb.locationTracking", Icon: MapPin },
  { key: "visits", labelKey: "sb.visitHistory", Icon: History },
] as const;
type View = (typeof VIEWS)[number]["key"];

export default function FieldPage() {
  return (
    <Suspense fallback={<div className="py-20"><Loader size={64} /></div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const { data, activeLine } = useStore();
  const { t } = useI18n();

  const view = (VIEWS.find((v) => v.key === params.get("view"))?.key ?? "routes") as View;
  const lineId = activeLine?.id ?? "";

  const areas = data.areas.filter((a) => inLine(a.lineId, lineId));
  const members = useMemo(() => {
    const m = data.members.filter((x) => x.lineId === null || inLine(x.lineId, lineId));
    return m.length ? m : [{ id: "self", name: data.profile.name || "You", accessType: "agent" }];
  }, [data, lineId]);
  const byArea = useMemo(() => collectionByArea(data, lineId), [data, lineId]);

  const custByArea = (areaId: string) => data.customers.filter((c) => inLine(c.lineId, lineId) && c.areaId === areaId);
  const expectedForArea = (areaId: string) =>
    custByArea(areaId).reduce((s, c) => {
      const l = customerActiveLoan(data, c.id);
      return s + (l ? Math.min(l.installmentAmount, loanOutstanding(data, l)) : 0);
    }, 0);

  const recentVisits = useMemo(
    () =>
      data.payments
        .filter((p) => inLine(p.lineId, lineId))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        .slice(0, 12),
    [data, lineId]
  );

  const totalExpected = areas.reduce((s, a) => s + expectedForArea(a.id), 0);
  const collectedToday = byArea.reduce((s, a) => s + a.amount, 0);

  function exportCsv() {
    csvExport("vasoolx-routes", ["Route / Area", "Customers", "Expected", "Collected"],
      areas.map((a) => [a.name, custByArea(a.id).length, expectedForArea(a.id), byArea.find((b) => b.areaId === a.id)?.amount ?? 0]));
  }

  return (
    <>
      <TopBar />
      <PageHead
        title={t("sb.field")}
        subtitle={`${activeLine?.name ?? ""} · ${t("fld.subtitle", { agents: members.length, routes: areas.length })}`}
        actions={<button className="chip" onClick={exportCsv}><Download size={15} /> {t("common.export")}</button>}
      />

      <main className="px-4 md:px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatTile label={t("fld.activeAgents")} value={String(members.length)} icon={<Users size={16} />} color="var(--brand)" />
          <StatTile label={t("sb.collectionRoutes")} value={String(areas.length)} icon={<Route size={16} />} color="#7c6bf0" />
          <StatTile label={t("fld.expectedToday")} value={inrCompact(totalExpected)} icon={<ClipboardList size={16} />} color="var(--warn)" />
          <StatTile label={t("col.collectedToday")} value={inrCompact(collectedToday)} icon={<CheckCircle2 size={16} />} color="var(--ok)" />
        </div>

        <div className="segtab w-fit flex-wrap">
          {VIEWS.map((v) => (
            <button key={v.key} data-active={view === v.key} onClick={() => router.replace(`/field?view=${v.key}`)}>{t(v.labelKey)}</button>
          ))}
        </div>

        {view === "routes" && (
          <Panel className="overflow-hidden">
            <PanelHead title={t("sb.collectionRoutes")} desc={t("fld.activeRoutes", { n: areas.length })} />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>{t("fld.thRouteArea")}</th><th className="text-right">{t("fld.thCustomers")}</th><th className="text-right">{t("col.expected")}</th><th className="text-right">{t("col.collected")}</th><th>{t("rec.thProgress")}</th></tr></thead>
                <tbody>
                  {areas.map((a) => {
                    const cust = custByArea(a.id).length;
                    const exp = expectedForArea(a.id);
                    const col = byArea.find((b) => b.areaId === a.id)?.amount ?? 0;
                    const pct = exp ? Math.min(1, col / exp) : 0;
                    return (
                      <tr key={a.id}>
                        <td><div className="flex items-center gap-2.5"><span className="w-7 h-7 rounded-lg grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] shrink-0"><Route size={15} /></span><span className="font-semibold">{a.name}</span></div></td>
                        <td className="text-right tabular">{cust}</td>
                        <td className="text-right tabular text-[color:var(--text-soft)]">{inr(exp)}</td>
                        <td className="text-right tabular font-semibold text-[color:var(--ok)]">{inr(col)}</td>
                        <td><div className="flex items-center gap-2"><div className="w-20"><ProgressBar value={pct} color={pct >= 0.9 ? "var(--ok)" : "var(--brand)"} /></div><span className="text-[11px] tabular w-8">{Math.round(pct * 100)}%</span></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {view === "agents" && (
          <ComingSoon icon={<Users size={26} />} title={t("fld.comingSoon")} desc={t("fld.agentsSoon")} />
        )}

        {view === "assignments" && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {members.map((m, i) => {
              const area = areas[i % Math.max(1, areas.length)];
              const cust = area ? custByArea(area.id) : [];
              const exp = area ? expectedForArea(area.id) : 0;
              return (
                <Panel key={m.id}>
                  <PanelHead title={m.name} desc={area ? t("fld.route", { name: area.name }) : t("cust.unassigned")} icon={<Users size={15} />} />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[color:var(--text-soft)]">{t("fld.customersToVisit")}</span>
                      <span className="font-bold tabular">{cust.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[color:var(--text-soft)]">{t("col.expectedCollection")}</span>
                      <span className="font-bold tabular">{inr(exp)}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <StatusBadge tone="ok">{t("fld.assigned")}</StatusBadge>
                      <StatusBadge tone="neutral" dot={false}>{fmtDate(new Date().toISOString())}</StatusBadge>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}

        {view === "tracking" && (
          <ComingSoon icon={<MapPin size={26} />} title={t("fld.comingSoon")} desc={t("fld.trackingSoon")} />
        )}

        {view === "visits" && (
          <Panel className="overflow-hidden">
            <PanelHead title={t("sb.visitHistory")} desc={t("fld.visitHistoryDesc", { n: recentVisits.length })} />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>{t("dash.date")}</th><th>{t("dash.customer")}</th><th>{t("dash.area")}</th><th>{t("fld.thOutcome")}</th><th className="text-right">{t("col.collected")}</th></tr></thead>
                <tbody>
                  {recentVisits.map((p) => {
                    const c = data.customers.find((x) => x.id === p.customerId);
                    return (
                      <tr key={p.id}>
                        <td className="tabular text-[color:var(--text-soft)]">{fmtDate(p.date)}</td>
                        <td className="font-semibold">{c?.name ?? "—"}</td>
                        <td className="text-[color:var(--text-soft)]">{areaName(data, c?.areaId ?? null) ?? "—"}</td>
                        <td><StatusBadge tone="ok">{t("col.collected")}</StatusBadge></td>
                        <td className="text-right tabular font-bold text-[color:var(--ok)]">{inr(p.amount)}</td>
                      </tr>
                    );
                  })}
                  {recentVisits.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[color:var(--text-faint)]"><Clock size={20} className="inline mr-1" /> {t("fld.noVisits")}</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </main>
    </>
  );
}

// Placeholder for field features that require data not yet captured
// (per-agent attribution, GPS location). Shown instead of fabricated data.
function ComingSoon({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Panel>
      <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
        <span className="w-14 h-14 rounded-2xl grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
          {icon}
        </span>
        <div className="text-lg font-bold text-[color:var(--text)]">{title}</div>
        <p className="text-sm text-[color:var(--text-soft)] max-w-sm">{desc}</p>
      </div>
    </Panel>
  );
}

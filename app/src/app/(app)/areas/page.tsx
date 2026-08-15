"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, Users, Route } from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Button, EmptyState } from "@/components/ui/primitives";
import { Panel, PageHead, StatTile, ProgressBar, Toolbar } from "@/components/ui/erp";
import { AreaSheet } from "@/components/sheets/AreaSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inLine } from "@/lib/data/selectors";

export default function AreasPage() {
  const { t } = useI18n();
  const { data, activeLine, deleteArea } = useStore();
  const [sheet, setSheet] = useState(false);

  const areas = data.areas.filter((a) => inLine(a.lineId, activeLine?.id));
  const countCustomers = (areaId: string) => data.customers.filter((c) => c.areaId === areaId).length;
  const totalCustomers = data.customers.filter((c) => inLine(c.lineId, activeLine?.id)).length;
  const maxCust = Math.max(1, ...areas.map((a) => countCustomers(a.id)));

  return (
    <>
      <TopBar />
      <PageHead
        title="Collection Routes & Areas"
        subtitle={`${activeLine?.name ?? ""} · ${areas.length} areas`}
        actions={
          areas.length > 0 ? (
            <button className="btn-primary h-9 px-3.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5" onClick={() => setSheet(true)}>
              <Plus size={15} /> Add Area
            </button>
          ) : undefined
        }
      />

      <main className="px-4 md:px-6 py-4 space-y-4">
        {areas.length === 0 ? (
          <Panel className="py-4">
            <EmptyState icon={<MapPin size={34} />} title={t("area.noAreas")} desc={t("area.noAreasDesc")}
              action={<Button full size="lg" onClick={() => setSheet(true)}>{t("area.addArea")}</Button>} />
          </Panel>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              <StatTile label="Collection Areas" value={String(areas.length)} icon={<Route size={16} />} color="var(--brand)" />
              <StatTile label="Total Customers" value={String(totalCustomers)} icon={<Users size={16} />} color="var(--ok)" />
              <StatTile label="Avg per Area" value={String(Math.round(totalCustomers / areas.length))} icon={<MapPin size={16} />} color="#7c6bf0" />
            </div>

            <Panel className="overflow-hidden">
              <Toolbar>
                <span className="text-[13px] font-bold text-[color:var(--text)]">Area Directory</span>
                <span className="ml-auto text-[12px] text-[color:var(--text-faint)]">{areas.length} areas</span>
              </Toolbar>
              <div className="overflow-x-auto">
                <table className="dt">
                  <thead>
                    <tr><th>Area</th><th className="text-right">Customers</th><th>Coverage</th><th></th></tr>
                  </thead>
                  <tbody>
                    {areas.map((a) => {
                      const n = countCustomers(a.id);
                      return (
                        <tr key={a.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-lg grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] shrink-0"><MapPin size={16} /></span>
                              <span className="font-semibold text-[color:var(--text)]">{a.name}</span>
                            </div>
                          </td>
                          <td className="text-right tabular font-semibold">{n}</td>
                          <td>
                            <div className="w-40"><ProgressBar value={n / maxCust} /></div>
                          </td>
                          <td>
                            <button onClick={() => { if (confirm(`Delete area "${a.name}"?`)) deleteArea(a.id); }}
                              className="w-7 h-7 rounded-md grid place-items-center bg-[color:var(--crit)]/10 text-[color:var(--crit)] ml-auto" aria-label="Delete">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </main>

      <AreaSheet open={sheet} onClose={() => setSheet(false)} />
    </>
  );
}

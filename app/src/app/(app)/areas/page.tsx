"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import { GlassCard, Button, EmptyState } from "@/components/ui/primitives";
import { AreaSheet } from "@/components/sheets/AreaSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";

export default function AreasPage() {
  const { t } = useI18n();
  const { data, activeLine, deleteArea } = useStore();
  const [sheet, setSheet] = useState(false);

  const areas = data.areas.filter((a) => a.lineId === activeLine?.id);

  function countCustomers(areaId: string) {
    return data.customers.filter((c) => c.areaId === areaId).length;
  }

  return (
    <>
      <PageHeader
        title={t("area.areas")}
        subtitle={activeLine?.name}
        back="/dashboard"
        action={
          areas.length > 0 ? (
            <Button size="sm" onClick={() => setSheet(true)}>
              <Plus size={18} /> {t("common.add")}
            </Button>
          ) : undefined
        }
      />

      <main className="px-4 md:px-8 pb-8">
        {areas.length === 0 ? (
          <EmptyState
            icon={<MapPin size={34} />}
            title={t("area.noAreas")}
            desc={t("area.noAreasDesc")}
            action={
              <Button full size="lg" onClick={() => setSheet(true)}>
                {t("area.addArea")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 items-start">
          {areas.map((a) => (
            <GlassCard key={a.id} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] shrink-0">
                <MapPin size={22} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[color:var(--text)]">{a.name}</div>
                <div className="text-sm text-[color:var(--text-soft)] flex items-center gap-1">
                  <Users size={13} /> {countCustomers(a.id)}
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Delete area "${a.name}"?`)) deleteArea(a.id);
                }}
                className="w-10 h-10 rounded-full grid place-items-center bg-[color:var(--color-danger)]/12 text-[color:var(--color-danger)]"
                aria-label="Delete"
              >
                <Trash2 size={18} />
              </button>
            </GlassCard>
          ))}
          </div>
        )}
      </main>

      <AreaSheet open={sheet} onClose={() => setSheet(false)} />
    </>
  );
}

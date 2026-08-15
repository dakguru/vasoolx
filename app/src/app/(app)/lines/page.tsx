"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, FileText } from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import { GlassCard, Button, EmptyState } from "@/components/ui/primitives";
import { LineSheet } from "@/components/sheets/LineSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import type { Line } from "@/lib/data/types";

export default function LinesPage() {
  const { t } = useI18n();
  const { data, deleteLine } = useStore();
  const [sheet, setSheet] = useState(false);
  const [editing, setEditing] = useState<Line | null>(null);

  function openNew() {
    setEditing(null);
    setSheet(true);
  }
  function openEdit(l: Line) {
    setEditing(l);
    setSheet(true);
  }

  return (
    <>
      <PageHeader
        title={t("line.manageLines")}
        back="/settings"
        action={
          <Button size="sm" onClick={openNew}>
            <Plus size={18} /> {t("line.addLine")}
          </Button>
        }
      />

      <main className="px-4 md:px-8 pb-8">
        {data.lines.length === 0 ? (
          <EmptyState
            icon={<FileText size={34} />}
            title={t("line.manageLines")}
            action={
              <Button full size="lg" onClick={openNew}>
                {t("line.addLine")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 items-start">
          {data.lines.map((l) => (
            <GlassCard key={l.id} className="flex items-center justify-between">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-[color:var(--brand)]/12 text-[color:var(--brand)] text-xs font-bold mb-2">
                  {t(`line.${l.loanType}`)}
                </span>
                <div className="text-xl font-extrabold text-[color:var(--text)]">
                  {l.name}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(l)}
                  className="w-11 h-11 rounded-full grid place-items-center btn-primary"
                  aria-label="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete line "${l.name}"? This removes its data.`)) {
                      const success = deleteLine(l.id);
                      if (!success) {
                        alert(`Cannot delete "${l.name}" — it has active loans. Close or mark all loans as bad first.`);
                      }
                    }
                  }}
                  className="w-11 h-11 rounded-full grid place-items-center bg-[color:var(--color-danger)] text-white"
                  aria-label="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </GlassCard>
          ))}
          </div>
        )}
      </main>

      <LineSheet open={sheet} onClose={() => setSheet(false)} editing={editing} />
    </>
  );
}

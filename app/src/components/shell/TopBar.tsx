"use client";

import { useState } from "react";
import { ChevronDown, Bell, Check, Plus, Layers, Menu } from "lucide-react";
import { useStore } from "@/lib/data/store";
import { ALL_LINES } from "@/lib/data/selectors";
import { useI18n } from "@/lib/i18n/provider";
import { LogoMark } from "@/components/ui/Logo";
import { Sheet } from "@/components/ui/Sheet";
import Link from "next/link";

export function TopBar() {
  const { data, activeLine, setActiveLine } = useStore();
  const { t } = useI18n();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <header
        className="md:hidden sticky top-0 z-30 border-b"
        style={{
          background: "var(--header-bg)",
          backdropFilter: "blur(16px) saturate(160%)",
          WebkitBackdropFilter: "blur(16px) saturate(160%)",
          borderColor: "var(--line)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => window.dispatchEvent(new Event("vx-drawer-open"))}
              className="w-11 h-11 -ml-1 grid place-items-center rounded-full glass-strong text-[color:var(--brand)] shrink-0"
              aria-label={t("sb.menu")}
            >
              <Menu size={22} />
            </button>
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-2 group min-w-0"
            >
              <LogoMark size={34} />
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-lg font-extrabold text-[color:var(--text)] truncate">
                  {activeLine?.name ?? "VasoolX"}
                </span>
                <ChevronDown
                  size={18}
                  className="text-[color:var(--brand)] transition group-hover:translate-y-0.5 shrink-0"
                />
              </div>
            </button>
          </div>

          <button
            className="w-11 h-11 grid place-items-center rounded-full glass-strong text-[color:var(--brand)] relative shrink-0"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[color:var(--color-danger)]" />
          </button>
        </div>
      </header>

      <Sheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t("line.switchLine")}
      >
        <div className="flex flex-col gap-3 pb-2">
          {data.lines.length > 1 && (
            <button
              onClick={() => { setActiveLine(ALL_LINES); setPickerOpen(false); }}
              className={`flex items-center justify-between h-16 px-5 rounded-2xl border transition ${
                activeLine?.id === ALL_LINES ? "bg-[color:var(--brand)]/12 border-[color:var(--brand)]/40" : "field"
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <span className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-[color:var(--brand)] to-[color:var(--brand-strong)] text-white shrink-0">
                  <Layers size={20} />
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--brand)]">{t("sb.consolidated")}</div>
                  <div className="text-lg font-bold text-[color:var(--text)]">{t("sb.allLines")}</div>
                </div>
              </div>
              {activeLine?.id === ALL_LINES && <Check className="text-[color:var(--brand)]" />}
            </button>
          )}
          {data.lines.map((l) => {
            const active = l.id === activeLine?.id;
            return (
              <button
                key={l.id}
                onClick={() => {
                  setActiveLine(l.id);
                  setPickerOpen(false);
                }}
                className={`flex items-center justify-between h-16 px-5 rounded-2xl border transition ${
                  active
                    ? "bg-[color:var(--brand)]/12 border-[color:var(--brand)]/40"
                    : "field"
                }`}
              >
                <div className="text-left">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--brand)]">
                    {t(`line.${l.loanType}`)}
                  </div>
                  <div className="text-lg font-bold text-[color:var(--text)]">
                    {l.name}
                  </div>
                </div>
                {active && <Check className="text-[color:var(--brand)]" />}
              </button>
            );
          })}
          <Link
            href="/lines"
            onClick={() => setPickerOpen(false)}
            className="flex items-center justify-center gap-2 h-14 rounded-2xl border border-dashed border-[color:var(--brand)]/40 text-[color:var(--brand)] font-semibold"
          >
            <Plus size={20} /> {t("line.manageLines")}
          </Link>
        </div>
      </Sheet>
    </>
  );
}

export function PageHeader({
  title,
  back,
  action,
  subtitle,
}: {
  title: string;
  back?: string;
  action?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="px-4 md:px-8 pt-5 md:pt-6 pb-3">
      <div className="w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {back && (
            <Link
              href={back}
              className="w-9 h-9 -ml-1 grid place-items-center rounded-full text-[color:var(--brand)] hover:bg-black/5 shrink-0"
              aria-label="Back"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[color:var(--brand)]" />
              <h1 className="text-2xl font-extrabold text-[color:var(--text)] truncate">
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="text-sm text-[color:var(--text-soft)] mt-0.5 ml-3.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import { Bell, Sun, Moon, Monitor, Languages } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme/provider";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageSheet } from "@/components/shell/LanguageSwitcher";

export function DesktopHeader() {
  const { theme, setTheme } = useTheme();
  const { t, locale, locales } = useI18n();
  const [langOpen, setLangOpen] = useState(false);

  const cycle: Record<Theme, { next: Theme; Icon: typeof Sun }> = {
    light: { next: "dark", Icon: Sun },
    dark: { next: "system", Icon: Moon },
    system: { next: "light", Icon: Monitor },
  };
  const { next, Icon } = cycle[theme];
  const localeLabel = locales.find((l) => l.code === locale)?.native ?? "English";

  return (
    <div className="hidden md:flex items-center justify-end gap-2 px-8 pt-5">
      <button
        onClick={() => setLangOpen(true)}
        className="h-10 px-3 rounded-full glass-strong flex items-center gap-2 text-[color:var(--text-soft)] font-medium hover:brightness-105 transition"
      >
        <Languages size={18} /> {localeLabel}
      </button>
      <button
        onClick={() => setTheme(next)}
        className="w-10 h-10 rounded-full glass-strong grid place-items-center text-[color:var(--text-soft)] hover:brightness-105 transition"
        aria-label={t("set.theme")}
      >
        <Icon size={18} />
      </button>
      <button
        className="w-10 h-10 rounded-full glass-strong grid place-items-center text-[color:var(--brand)] relative hover:brightness-105 transition"
        aria-label="Notifications"
      >
        <Bell size={18} />
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[color:var(--color-danger)]" />
      </button>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </div>
  );
}

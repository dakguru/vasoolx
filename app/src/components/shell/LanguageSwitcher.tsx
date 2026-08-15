"use client";

import { useState } from "react";
import { Languages, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Sheet } from "@/components/ui/Sheet";

export function LanguagePills() {
  const { locale, setLocale, locales } = useI18n();
  return (
    <div className="flex gap-2 justify-center">
      {locales.map((l) => {
        const active = l.code === locale;
        return (
          <button
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={`px-5 h-11 rounded-full text-[15px] font-semibold transition ${
              active
                ? "btn-primary"
                : "glass-strong text-[color:var(--text-soft)]"
            }`}
          >
            {l.native}
          </button>
        );
      })}
    </div>
  );
}

export function LanguageSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { locale, setLocale, locales, t } = useI18n();
  return (
    <Sheet open={open} onClose={onClose} title={t("set.language")}>
      <div className="flex flex-col gap-3 pb-4">
        {locales.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              onClick={() => {
                setLocale(l.code);
                onClose();
              }}
              className={`flex items-center justify-between h-14 px-5 rounded-2xl border text-[17px] font-medium transition ${
                active
                  ? "bg-[color:var(--brand)]/12 border-[color:var(--brand)]/40 text-[color:var(--text)]"
                  : "field text-[color:var(--text)]"
              }`}
            >
              <span>{l.native}</span>
              {active && <Check className="text-[color:var(--brand)]" size={22} />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

export { Languages };

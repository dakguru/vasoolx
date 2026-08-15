"use client";

import { ThemeProvider } from "@/lib/theme/provider";
import { I18nProvider } from "@/lib/i18n/provider";
import { AuthProvider } from "@/lib/auth/provider";
import { StoreProvider } from "@/lib/data/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <StoreProvider>{children}</StoreProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

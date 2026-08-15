"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { BottomNav } from "@/components/shell/BottomNav";
import { Sidebar } from "@/components/shell/Sidebar";
import { DesktopHeader } from "@/components/shell/DesktopHeader";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { Loader } from "@/components/ui/Loader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, authed } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !authed) router.replace("/login");
  }, [ready, authed, router]);

  if (!ready || !authed) {
    return <Loader full size={80} />;
  }

  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col pb-28 md:pb-0">
        <DesktopHeader />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
        {pathname === "/dashboard" && <SiteFooter />}
      </div>
      <BottomNav />
    </div>
  );
}

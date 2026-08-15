"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { BottomNav } from "@/components/shell/BottomNav";
import { Sidebar } from "@/components/shell/Sidebar";
import { DesktopHeader } from "@/components/shell/DesktopHeader";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { Loader } from "@/components/ui/Loader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, authed } = useAuth();
  const router = useRouter();

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
        <main className="flex-1 w-full">{children}</main>
        <SiteFooter />
      </div>
      <BottomNav />
    </div>
  );
}

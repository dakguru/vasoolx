"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { ready, authed } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && authed) router.replace("/dashboard");
  }, [ready, authed, router]);

  return (
    <div className="min-h-dvh flex flex-col items-center px-5 py-8">
      <div className="w-full max-w-md flex-1 flex flex-col">{children}</div>
    </div>
  );
}

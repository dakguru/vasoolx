"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { Loader } from "@/components/ui/Loader";

export default function Home() {
  const router = useRouter();
  const { ready, authed } = useAuth();

  useEffect(() => {
    if (!ready) return;
    router.replace(authed ? "/dashboard" : "/login");
  }, [ready, authed, router]);

  return <Loader full size={88} label="VasoolX" />;
}

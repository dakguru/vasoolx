"use client";

import Image from "next/image";
import { useTheme } from "@/lib/theme/provider";

/** The self-contained VX app-icon tile. Safe on any background. */
export function LogoMark({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/app-icon.png"
      alt="VasoolX"
      width={size}
      height={size}
      priority
      unoptimized
      className={`rounded-[22%] shadow-lg ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Full horizontal VasoolX wordmark (transparent). White-mono in dark theme. */
export function Wordmark({ height = 34, className = "" }: { height?: number; className?: string }) {
  const { resolved } = useTheme();
  const ratio = 2081 / 516;
  return (
    <Image
      src="/brand/wordmark-full.png"
      alt="VasoolX"
      width={Math.round(height * ratio)}
      height={height}
      priority
      unoptimized
      className={className}
      style={{
        height,
        width: "auto",
        filter: resolved === "dark" ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}

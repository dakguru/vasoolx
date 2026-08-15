"use client";

import Image from "next/image";

/** Branded VasoolX loading spinner (orbiting VX mark). */
export function Loader({
  size = 72,
  label,
  full,
}: {
  size?: number;
  label?: string;
  full?: boolean;
}) {
  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <Image
        src="/brand/loading.png"
        alt="Loading"
        width={size}
        height={size}
        priority
        className="animate-vxspin"
        style={{ width: size, height: size }}
      />
      {label && (
        <span className="text-sm font-medium text-[color:var(--text-soft)] animate-vxpulse">
          {label}
        </span>
      )}
    </div>
  );

  if (full) {
    return <div className="min-h-dvh grid place-items-center">{spinner}</div>;
  }
  return spinner;
}

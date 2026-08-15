"use client";

import { forwardRef } from "react";

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ---------------- Card ---------------- */
export function GlassCard({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return (
    <Tag
      className={cx(
        "glass glass-sheen rounded-[var(--radius-glass)] p-5",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ---------------- Button ---------------- */
type BtnVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    full?: boolean;
    size?: "sm" | "md" | "lg";
  }
>(function Button(
  { variant = "primary", full, size = "md", className = "", children, ...rest },
  ref
) {
  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-12 px-5 text-[15px]",
    lg: "h-14 px-6 text-base",
  };
  const variants: Record<BtnVariant, string> = {
    primary: "btn-primary font-semibold",
    secondary:
      "glass-strong font-semibold text-[color:var(--brand)] hover:brightness-105",
    outline:
      "font-semibold text-[color:var(--brand)] border border-[color:var(--brand)]/40 bg-transparent hover:bg-[color:var(--brand)]/8",
    danger:
      "font-semibold text-white bg-[color:var(--color-danger)] shadow-[0_10px_24px_rgba(239,68,68,0.35)] hover:brightness-105 active:scale-[.99]",
    ghost: "font-medium text-[color:var(--text-soft)] hover:bg-black/5",
  };
  return (
    <button
      ref={ref}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full transition active:scale-[.99] disabled:opacity-55 disabled:cursor-not-allowed",
        sizes[size],
        variants[variant],
        full && "w-full",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

/* ---------------- Field label ---------------- */
export function Label({
  children,
  required,
  className = "",
}: {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cx("block text-[15px] font-medium text-[color:var(--text-soft)] mb-2", className)}>
      {children}
      {required && <span className="text-[color:var(--color-danger)]"> *</span>}
    </label>
  );
}

/* ---------------- Input ---------------- */
export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cx("field w-full h-12 px-4 text-[15px]", className)}
      {...rest}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx("field w-full px-4 py-3 text-[15px] min-h-24 resize-y", className)}
      {...rest}
    />
  );
});

/* ---------------- Phone input (with +91 prefix) ---------------- */
export function PhoneInput({
  value,
  onChange,
  placeholder = "00000 00000",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex gap-2">
      <div className="field h-12 px-4 flex items-center font-semibold text-[color:var(--text)] shrink-0">
        +91
      </div>
      <Input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
        placeholder={placeholder}
      />
    </div>
  );
}

/* ---------------- Select ---------------- */
export function Select({
  className = "",
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cx(
          "field w-full h-12 pl-4 pr-10 text-[15px] appearance-none cursor-pointer",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--text-faint)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

/* ---------------- Segmented control ---------------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx("glass-strong rounded-2xl p-1 flex gap-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cx(
              "flex-1 h-11 rounded-xl text-[15px] font-semibold transition",
              active
                ? "btn-primary"
                : "text-[color:var(--text-soft)] hover:bg-black/5"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Toggle switch ---------------- */
export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative w-14 h-8 rounded-full transition-colors shrink-0",
        checked ? "bg-[color:var(--brand)]" : "bg-black/15 dark:bg-white/15"
      )}
    >
      <span
        className={cx(
          "absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-6"
        )}
      />
    </button>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      <div className="w-20 h-20 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[color:var(--text)]">{title}</h3>
      {desc && (
        <p className="mt-2 max-w-xs text-[color:var(--text-soft)]">{desc}</p>
      )}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}

export { cx };

export function inr(amount: number, withSymbol = true): string {
  const n = Math.round(amount);
  const s = n.toLocaleString("en-IN");
  return withSymbol ? `₹${s}` : s;
}

export function inrCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${Math.round(amount)}`;
}

export function fmtDate(iso: string, locale = "en-IN"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB"); // dd/mm/yyyy
}

export function toDateInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function fromDateInput(v: string): string {
  // Parse as local date parts to avoid timezone drift
  const [y, m, d] = v.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  return date.toISOString();
}

export function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

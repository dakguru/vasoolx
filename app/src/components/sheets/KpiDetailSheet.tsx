"use client";

import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { loanPaid, loanOutstanding, loanTotalDue } from "@/lib/data/selectors";
import { inr, fmtDate, sameDay } from "@/lib/format";

export type KpiKind = "collected" | "outstanding" | "active" | "overdue" | null;

export function KpiDetailSheet({
  kind,
  onClose,
}: {
  kind: KpiKind;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { data, activeLine } = useStore();
  const lineId = activeLine?.id ?? "";
  const custName = (id: string) => data.customers.find((c) => c.id === id)?.name ?? "—";

  const titleMap: Record<Exclude<KpiKind, null>, string> = {
    collected: t("dash.statCollected"),
    outstanding: t("dash.statOutstanding"),
    active: t("dash.statActiveLoans"),
    overdue: t("dash.statOverdue"),
  };

  function body() {
    if (!kind) return null;
    const today = new Date().toISOString();

    if (kind === "collected") {
      const pays = data.payments
        .filter((p) => p.lineId === lineId && sameDay(p.date, today))
        .sort((a, b) => b.amount - a.amount);
      const total = pays.reduce((s, p) => s + p.amount, 0);
      return (
        <>
          <SummaryBar label={t("common.total")} value={inr(total)} tone="success" count={pays.length} />
          {pays.length === 0 ? (
            <Empty text={t("fin.noItemsMatch")} />
          ) : (
            pays.map((p) => (
              <Row
                key={p.id}
                title={custName(p.customerId)}
                sub={`${t(`fin.${p.method}`)} · ${fmtDate(p.date)}`}
                value={`+${inr(p.amount)}`}
                tone="success"
              />
            ))
          )}
        </>
      );
    }

    const loans = data.loans.filter(
      (l) =>
        l.lineId === lineId &&
        (kind === "overdue" ? l.status === "bad" : l.status === "active")
    );
    const withCalc = loans
      .map((l) => ({ l, paid: loanPaid(data, l.id), out: loanOutstanding(data, l) }))
      .sort((a, b) => b.out - a.out);
    const total = withCalc.reduce((s, r) => s + r.out, 0);

    return (
      <>
        <SummaryBar
          label={kind === "active" ? t("dash.statActiveLoans") : t("dash.statOutstanding")}
          value={kind === "active" ? String(withCalc.length) : inr(total)}
          tone={kind === "overdue" ? "danger" : "brand"}
          count={withCalc.length}
        />
        {withCalc.length === 0 ? (
          <Empty text={t("fin.noItemsMatch")} />
        ) : (
          withCalc.map(({ l, paid, out }) => {
            const due = loanTotalDue(l);
            const pct = due ? Math.min(100, Math.round((paid / due) * 100)) : 0;
            return (
              <div key={l.id} className="py-3 border-b border-[color:var(--glass-border)] last:border-0">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[color:var(--text)]">{custName(l.customerId)}</div>
                  <div className={`font-bold ${kind === "overdue" ? "text-[color:var(--color-danger)]" : "text-[color:var(--text)]"}`}>
                    {inr(out)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[color:var(--text-soft)] mt-1">
                  <span>{inr(l.principal)} · {t(`line.${l.type}`)}</span>
                  <span>{pct}% {t("cust.activeLoan").toLowerCase()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--color-success)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </>
    );
  }

  const reportLinkMap: Record<Exclude<KpiKind, null>, string> = {
    collected: "/reports/loan-summary",
    outstanding: "/reports/multi-line",
    active: "/reports/multi-line",
    overdue: "/reports/multi-line?status=bad",
  };

  return (
    <Sheet open={!!kind} onClose={onClose} title={kind ? titleMap[kind] : ""}>
      <div className="pb-2">{body()}</div>
      {kind && (
        <Link
          href={reportLinkMap[kind]}
          onClick={onClose}
          className="flex items-center justify-center gap-2 py-3 mt-2 rounded-2xl glass-strong text-[color:var(--brand)] font-semibold hover:brightness-105 transition"
        >
          View Full Report →
        </Link>
      )}
    </Sheet>
  );
}

function SummaryBar({ label, value, tone, count }: { label: string; value: string; tone: "success" | "brand" | "danger"; count: number }) {
  const toneCls = {
    success: "text-[color:var(--color-success)]",
    brand: "text-[color:var(--brand)]",
    danger: "text-[color:var(--color-danger)]",
  }[tone];
  return (
    <div className="flex items-end justify-between mb-3 pb-3 border-b border-[color:var(--glass-border)]">
      <div>
        <div className="text-sm text-[color:var(--text-soft)]">{label}</div>
        <div className={`text-3xl font-extrabold ${toneCls}`}>{value}</div>
      </div>
      <div className="text-sm text-[color:var(--text-faint)]">{count} items</div>
    </div>
  );
}

function Row({ title, sub, value, tone }: { title: string; sub: string; value: string; tone: "success" | "brand" }) {
  const toneCls = tone === "success" ? "text-[color:var(--color-success)]" : "text-[color:var(--brand)]";
  return (
    <div className="flex items-center justify-between py-3 border-b border-[color:var(--glass-border)] last:border-0">
      <div>
        <div className="font-semibold text-[color:var(--text)]">{title}</div>
        <div className="text-xs text-[color:var(--text-soft)]">{sub}</div>
      </div>
      <div className={`font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-8 text-[color:var(--text-soft)]">{text}</div>;
}

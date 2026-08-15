"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import { GlassCard, Button, Segmented, Select } from "@/components/ui/primitives";
import { DateRangeBar, StatTile, DataTable } from "@/components/reports/parts";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inLine } from "@/lib/data/selectors";
import {
  loanPaid,
  loanOutstanding,
  loanTotalDue,
} from "@/lib/data/selectors";
import { inr, fmtDate, sameDay } from "@/lib/format";
import { inRange, csvExport, daysAgoISO } from "@/lib/report";

const TITLES: Record<string, string> = {
  "loan-summary": "rep.loanSummary",
  plan: "rep.plan",
  investment: "rep.investment",
  expense: "rep.expense",
  "multi-line": "rep.multiLine",
  customer: "rep.customer",
  ledger: "rep.ledger",
};

export default function ReportDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useI18n();
  const { data, activeLine } = useStore();

  const [from, setFrom] = useState(daysAgoISO(29));
  const [to, setTo] = useState(new Date().toISOString());
  const [loanType, setLoanType] = useState<"all" | "daily" | "weekly" | "monthly">("all");
  const [loanStatus, setLoanStatus] = useState<"all" | "active" | "closed" | "bad">("all");

  const lineId = activeLine?.id ?? "";
  const custName = (id: string) => data.customers.find((c) => c.id === id)?.name ?? "—";
  const lineName = (id: string) => data.lines.find((l) => l.id === id)?.name ?? "—";
  const title = t(TITLES[slug] ?? "rep.reports");
  const dated = ["loan-summary", "investment", "expense", "ledger"].includes(slug);

  const report = useMemo(() => buildReport(), [slug, from, to, loanType, loanStatus, data, lineId]);

  function buildReport(): {
    tiles: { label: string; value: string; tone?: "brand" | "success" | "danger" | "ink" }[];
    headers: string[];
    rows: React.ReactNode[][];
    csv: { headers: string[]; rows: (string | number)[][] };
  } {
    switch (slug) {
      case "loan-summary": {
        const days: Record<string, { collected: number; given: number }> = {};
        data.payments
          .filter((p) => inLine(p.lineId, lineId) && inRange(p.date, from, to))
          .forEach((p) => {
            const k = fmtDate(p.date);
            (days[k] ??= { collected: 0, given: 0 }).collected += p.amount;
          });
        data.loans
          .filter((l) => inLine(l.lineId, lineId) && inRange(l.startDate, from, to))
          .forEach((l) => {
            const k = fmtDate(l.startDate);
            (days[k] ??= { collected: 0, given: 0 }).given += l.disbursed;
          });
        const entries = Object.entries(days).sort(
          (a, b) => +new Date(a[0]) - +new Date(b[0])
        );
        const collected = entries.reduce((s, [, v]) => s + v.collected, 0);
        const given = entries.reduce((s, [, v]) => s + v.given, 0);
        return {
          tiles: [
            { label: t("rep.collected"), value: inr(collected), tone: "success" },
            { label: t("rep.loanGiven"), value: inr(given), tone: "brand" },
            { label: t("common.total"), value: inr(collected - given), tone: "ink" },
          ],
          headers: [t("rep.date"), t("rep.collected"), t("rep.loanGiven")],
          rows: entries.map(([d, v]) => [d, inr(v.collected), inr(v.given)]),
          csv: {
            headers: ["Date", "Collected", "Loan given"],
            rows: entries.map(([d, v]) => [d, v.collected, v.given]),
          },
        };
      }

      case "investment":
      case "expense": {
        const src = slug === "investment" ? data.investments : data.expenses;
        const items = src
          .filter((x) => inLine(x.lineId, lineId) && inRange(x.date, from, to))
          .sort((a, b) => +new Date(b.date) - +new Date(a.date));
        const total = items.reduce((s, x) => s + x.amount, 0);
        return {
          tiles: [
            { label: t("common.total"), value: inr(total), tone: slug === "investment" ? "success" : "danger" },
            { label: t("rep.count"), value: String(items.length), tone: "ink" },
          ],
          headers: [t("rep.date"), t("rep.type"), t("rep.method"), t("rep.amount")],
          rows: items.map((x) => [fmtDate(x.date), x.type, t(`fin.${x.method}`), inr(x.amount)]),
          csv: {
            headers: ["Date", "Type", "Method", "Amount", "Note"],
            rows: items.map((x) => [fmtDate(x.date), x.type, x.method, x.amount, x.note]),
          },
        };
      }

      case "multi-line": {
        const loans = data.loans.filter(
          (l) =>
            (loanType === "all" || l.type === loanType) &&
            (loanStatus === "all" || l.status === loanStatus)
        );
        const disbursed = loans.reduce((s, l) => s + l.disbursed, 0);
        const collected = loans.reduce((s, l) => s + loanPaid(data, l.id), 0);
        const outstanding = loans.reduce((s, l) => s + loanOutstanding(data, l), 0);
        return {
          tiles: [
            { label: t("rep.loansCount"), value: String(loans.length), tone: "ink" },
            { label: t("rep.disbursed"), value: inr(disbursed), tone: "brand" },
            { label: t("rep.collected"), value: inr(collected), tone: "success" },
            { label: t("rep.outstanding"), value: inr(outstanding), tone: "danger" },
          ],
          headers: [t("rep.line"), t("rep.customerOne"), t("rep.type"), "Principal", t("rep.outstanding"), t("rep.status")],
          rows: loans.map((l) => [
            lineName(l.lineId),
            <Link key={`cust-${l.id}`} href={`/customers/${l.customerId}`} className="text-[color:var(--brand)] font-semibold hover:underline">{custName(l.customerId)}</Link>,
            t(`line.${l.type}`),
            inr(l.principal),
            inr(loanOutstanding(data, l)),
            <StatusBadge key={l.id} status={l.status} />,
          ]),
          csv: {
            headers: ["Line", "Customer", "Type", "Principal", "Disbursed", "Paid", "Outstanding", "Status"],
            rows: loans.map((l) => [
              lineName(l.lineId),
              custName(l.customerId),
              l.type,
              l.principal,
              l.disbursed,
              loanPaid(data, l.id),
              loanOutstanding(data, l),
              l.status,
            ]),
          },
        };
      }

      case "customer": {
        const custs = data.customers.filter((c) => inLine(c.lineId, lineId));
        const rowData = custs.map((c) => {
          const loans = data.loans.filter((l) => l.customerId === c.id);
          const borrowed = loans.reduce((s, l) => s + l.principal, 0);
          const paid = loans.reduce((s, l) => s + loanPaid(data, l.id), 0);
          const pending = loans
            .filter((l) => l.status === "active")
            .reduce((s, l) => s + loanOutstanding(data, l), 0);
          return { c, count: loans.length, borrowed, paid, pending };
        });
        const totalPending = rowData.reduce((s, r) => s + r.pending, 0);
        return {
          tiles: [
            { label: t("nav.customers"), value: String(custs.length), tone: "ink" },
            { label: t("rep.pending"), value: inr(totalPending), tone: "danger" },
          ],
          headers: [t("rep.customerOne"), t("rep.loansCount"), "Borrowed", t("rep.collected"), t("rep.pending")],
          rows: rowData.map((r) => [
            <Link key={r.c.id} href={`/customers/${r.c.id}`} className="text-[color:var(--brand)] font-semibold hover:underline">{r.c.name}</Link>,
            String(r.count),
            inr(r.borrowed),
            inr(r.paid),
            inr(r.pending),
          ]),
          csv: {
            headers: ["Customer", "Phone", "Loans", "Borrowed", "Paid", "Pending"],
            rows: rowData.map((r) => [r.c.name, r.c.phone, r.count, r.borrowed, r.paid, r.pending]),
          },
        };
      }

      case "ledger": {
        type Entry = { date: string; entry: string; who: string; debit: number; credit: number };
        const entries: Entry[] = [];
        data.loans
          .filter((l) => inLine(l.lineId, lineId) && inRange(l.startDate, from, to))
          .forEach((l) =>
            entries.push({ date: l.startDate, entry: "Loan disbursed", who: custName(l.customerId), debit: l.disbursed, credit: 0 })
          );
        data.payments
          .filter((p) => inLine(p.lineId, lineId) && inRange(p.date, from, to))
          .forEach((p) =>
            entries.push({ date: p.date, entry: "Payment", who: custName(p.customerId), debit: 0, credit: p.amount })
          );
        data.investments
          .filter((i) => inLine(i.lineId, lineId) && inRange(i.date, from, to))
          .forEach((i) =>
            entries.push({ date: i.date, entry: `Investment: ${i.type}`, who: "—", debit: 0, credit: i.amount })
          );
        data.expenses
          .filter((e) => inLine(e.lineId, lineId) && inRange(e.date, from, to))
          .forEach((e) =>
            entries.push({ date: e.date, entry: `Expense: ${e.type}`, who: "—", debit: e.amount, credit: 0 })
          );
        entries.sort((a, b) => +new Date(b.date) - +new Date(a.date));
        const debit = entries.reduce((s, e) => s + e.debit, 0);
        const credit = entries.reduce((s, e) => s + e.credit, 0);
        return {
          tiles: [
            { label: t("rep.debit"), value: inr(debit), tone: "danger" },
            { label: t("rep.credit"), value: inr(credit), tone: "success" },
            { label: "Net", value: inr(credit - debit), tone: "ink" },
          ],
          headers: [t("rep.date"), t("rep.entry"), t("rep.customerOne"), t("rep.debit"), t("rep.credit")],
          rows: entries.map((e, i) => [
            fmtDate(e.date),
            e.entry,
            e.who,
            e.debit ? inr(e.debit) : "—",
            e.credit ? inr(e.credit) : "—",
          ]),
          csv: {
            headers: ["Date", "Entry", "Customer", "Debit", "Credit"],
            rows: entries.map((e) => [fmtDate(e.date), e.entry, e.who, e.debit, e.credit]),
          },
        };
      }

      case "plan":
      default: {
        const loans = data.loans.filter((l) => inLine(l.lineId, lineId));
        const investment = data.investments.filter((i) => inLine(i.lineId, lineId)).reduce((s, i) => s + i.amount, 0);
        const disbursed = loans.reduce((s, l) => s + l.disbursed, 0);
        const collected = data.payments.filter((p) => inLine(p.lineId, lineId)).reduce((s, p) => s + p.amount, 0);
        const outstanding = loans.filter((l) => l.status === "active").reduce((s, l) => s + loanOutstanding(data, l), 0);
        const expenses = data.expenses.filter((e) => inLine(e.lineId, lineId)).reduce((s, e) => s + e.amount, 0);
        const expectedProfit = loans.reduce((s, l) => s + (loanTotalDue(l) - l.disbursed), 0) - expenses;
        const cashInHand = investment + collected - disbursed - expenses;
        return {
          tiles: [
            { label: t("rep.investmentTotal"), value: inr(investment), tone: "brand" },
            { label: t("rep.disbursed"), value: inr(disbursed), tone: "ink" },
            { label: t("rep.collected"), value: inr(collected), tone: "success" },
            { label: t("rep.outstanding"), value: inr(outstanding), tone: "danger" },
            { label: t("rep.expensesTotal"), value: inr(expenses), tone: "danger" },
            { label: "Cash in hand", value: inr(cashInHand), tone: "ink" },
            { label: t("rep.profit"), value: inr(expectedProfit), tone: "success" },
          ],
          headers: [t("rep.summary"), t("rep.amount")],
          rows: [
            [t("rep.investmentTotal"), inr(investment)],
            [t("rep.disbursed"), inr(disbursed)],
            [t("rep.collected"), inr(collected)],
            [t("rep.outstanding"), inr(outstanding)],
            [t("rep.expensesTotal"), inr(expenses)],
            ["Cash in hand", inr(cashInHand)],
            [t("rep.profit"), inr(expectedProfit)],
          ],
          csv: {
            headers: ["Metric", "Amount"],
            rows: [
              ["Investment", investment],
              ["Disbursed", disbursed],
              ["Collected", collected],
              ["Outstanding", outstanding],
              ["Expenses", expenses],
              ["Cash in hand", cashInHand],
              ["Expected profit", expectedProfit],
            ],
          },
        };
      }
    }
  }

  return (
    <>
      <PageHeader title={title} subtitle={activeLine?.name} back="/reports" />

      <main className="px-4 md:px-8 pb-8 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {slug === "multi-line" && (
            <>
              <Select value={loanType} onChange={(e) => setLoanType(e.target.value as typeof loanType)} className="!w-auto min-w-40">
                <option value="all">{t("rep.all")} · {t("rep.type")}</option>
                <option value="daily">{t("line.daily")}</option>
                <option value="weekly">{t("line.weekly")}</option>
                <option value="monthly">{t("line.monthly")}</option>
              </Select>
              <Select value={loanStatus} onChange={(e) => setLoanStatus(e.target.value as typeof loanStatus)} className="!w-auto min-w-40">
                <option value="all">{t("rep.all")} · {t("rep.status")}</option>
                <option value="active">{t("rep.active")}</option>
                <option value="closed">{t("rep.closed")}</option>
                <option value="bad">{t("rep.bad")}</option>
              </Select>
            </>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={() => csvExport(`vasoolx-${slug}`, report.csv.headers, report.csv.rows)}>
              <Download size={16} /> {t("rep.exportCsv")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer size={16} /> {t("rep.print")}
            </Button>
          </div>
        </div>

        {dated && <DateRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo} />}

        {/* Print header */}
        <div className="hidden print:block mb-2">
          <div className="text-xl font-bold">VasoolX — {title}</div>
          <div className="text-sm">{activeLine?.name} · {fmtDate(new Date().toISOString())}</div>
        </div>

        {/* Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {report.tiles.map((tile) => (
            <StatTile key={tile.label} label={tile.label} value={tile.value} tone={tile.tone} />
          ))}
        </div>

        {/* Table */}
        <DataTable headers={report.headers} rows={report.rows} empty={t("rep.noData")} />
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: "active" | "closed" | "bad" }) {
  const map = {
    active: { label: "Active", cls: "bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]" },
    closed: { label: "Closed", cls: "bg-[color:var(--text-faint)]/15 text-[color:var(--text-soft)]" },
    bad: { label: "Bad", cls: "bg-[color:var(--color-danger)]/12 text-[color:var(--color-danger)]" },
  };
  const s = map[status];
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

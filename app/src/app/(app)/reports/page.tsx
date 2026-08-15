"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Layers,
  UsersRound,
  BookOpen,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileType,
  HandCoins,
  Wallet,
  Trophy,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Loader } from "@/components/ui/Loader";
import { Panel, PageHead, PanelHead, StatusBadge } from "@/components/ui/erp";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { fmtDate } from "@/lib/format";
import { csvExport } from "@/lib/report";

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="py-20"><Loader size={64} /></div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const { t } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const { data } = useStore();
  const isExport = params.get("tab") === "export";

  const reports = [
    { slug: "loan-summary", Icon: Clock, title: t("rep.loanSummary"), desc: t("rep.loanSummaryDesc"), color: "var(--brand)" },
    { slug: "plan", Icon: FileText, title: t("rep.plan"), desc: t("rep.planDesc"), color: "#7c6bf0" },
    { slug: "investment", Icon: TrendingUp, title: t("rep.investment"), desc: t("rep.investmentDesc"), color: "var(--ok)" },
    { slug: "expense", Icon: TrendingDown, title: t("rep.expense"), desc: t("rep.expenseDesc"), color: "var(--crit)" },
    { slug: "multi-line", Icon: Layers, title: t("rep.multiLine"), desc: t("rep.multiLineDesc"), color: "var(--warn)" },
    { slug: "customer", Icon: UsersRound, title: t("rep.customer"), desc: t("rep.customerDesc"), color: "var(--brand)" },
    { slug: "ledger", Icon: BookOpen, title: t("rep.ledger"), desc: t("rep.ledgerDesc"), color: "var(--ok)" },
  ];

  const datasets = [
    { Icon: UsersRound, name: "Customer Master", count: `${data.customers.length} records`, color: "var(--brand)" },
    { Icon: HandCoins, name: "Collections", count: `${data.payments.length} records`, color: "var(--ok)" },
    { Icon: Wallet, name: "Outstanding & Receivables", count: `${data.loans.filter((l) => l.status === "active").length} loans`, color: "var(--warn)" },
    { Icon: FileText, name: "Receipts", count: `${data.payments.length} receipts`, color: "#7c6bf0" },
    { Icon: Trophy, name: "Agent Performance", count: `${data.members.length || 1} agents`, color: "var(--brand)" },
    { Icon: BookOpen, name: "General Ledger", count: `${data.investments.length + data.expenses.length} entries`, color: "var(--crit)" },
  ];

  const recentExports: { name: string; type: string; when: string }[] = [];

  return (
    <>
      <TopBar />
      <PageHead
        title={isExport ? "Export Center" : "Reports & Analytics"}
        subtitle={isExport ? "Download your data in CSV, Excel or PDF" : "Financial, collection and performance reporting"}
        actions={
          <div className="segtab">
            <button data-active={!isExport} onClick={() => router.replace("/reports")}>Reports</button>
            <button data-active={isExport} onClick={() => router.replace("/reports?tab=export")}>Export Center</button>
          </div>
        }
      />

      {!isExport ? (
        <main className="px-4 md:px-6 py-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 items-start">
          {reports.map((r) => (
            <Link key={r.slug} href={`/reports/${r.slug}`}>
              <Panel className="panel-hover p-4 flex items-center gap-3.5 h-full cursor-pointer">
                <span className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${r.color} 14%, transparent)`, color: r.color }}><r.Icon size={22} /></span>
                <div className="flex-1 min-w-0"><div className="font-bold text-[color:var(--text)] text-[14px]">{r.title}</div><div className="text-[12px] text-[color:var(--text-soft)] leading-snug">{r.desc}</div></div>
                <ChevronRight className="text-[color:var(--text-faint)] shrink-0" size={18} />
              </Panel>
            </Link>
          ))}
        </main>
      ) : (
        <main className="px-4 md:px-6 py-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {datasets.map((d) => (
              <Panel key={d.name} className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${d.color} 14%, transparent)`, color: d.color }}><d.Icon size={20} /></span>
                  <div><div className="font-bold text-[color:var(--text)]">{d.name}</div><div className="text-[11px] text-[color:var(--text-faint)] tabular">{d.count}</div></div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-[color:var(--line)] pt-3">
                  <ExportBtn Icon={FileSpreadsheet} label="CSV" onClick={() => {
                    if (d.name === "Customer Master") csvExport("customer-master", ["Name", "Phone", "Area"], data.customers.map((c) => [c.name, c.phone, data.areas.find((a) => a.id === c.areaId)?.name ?? ""]));
                    else if (d.name === "Collections") csvExport("collections", ["Date", "Customer", "Amount", "Method"], data.payments.map((p) => [p.date.slice(0, 10), data.customers.find((c) => c.id === p.customerId)?.name ?? "", p.amount, p.method]));
                  }} />
                  <ExportBtn Icon={FileType} label="Excel" />
                  <ExportBtn Icon={FileText} label="PDF" />
                </div>
              </Panel>
            ))}
          </div>

          <Panel className="overflow-hidden">
            <PanelHead title="Recent Exports" desc="Your export history" icon={<Download size={15} />} />
              {recentExports.length === 0 ? (
                <div className="px-4 py-10 text-center text-[13px] text-[color:var(--text-faint)]">No exports yet. Use the export buttons above to generate your first export.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="dt">
                    <thead><tr><th>Export</th><th>Format</th><th>Generated</th><th>Status</th></tr></thead>
                    <tbody>
                      {recentExports.map((e, i) => (
                        <tr key={i}>
                          <td className="font-semibold">{e.name}</td>
                          <td><StatusBadge tone="info" dot={false}>{e.type}</StatusBadge></td>
                          <td className="tabular text-[color:var(--text-soft)]">{fmtDate(e.when)}</td>
                          <td><StatusBadge tone="ok">Ready</StatusBadge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </Panel>
        </main>
      )}
    </>
  );
}

function ExportBtn({ Icon, label, onClick }: { Icon: typeof FileText; label: string; onClick?: () => void }) {
  return (
    <button className="chip justify-center h-8 text-[11.5px]" onClick={onClick}><Icon size={13} /> {label}</button>
  );
}

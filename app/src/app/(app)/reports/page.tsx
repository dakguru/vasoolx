"use client";

import Link from "next/link";
import {
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Layers,
  UsersRound,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import { GlassCard } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";

export default function ReportsPage() {
  const { t } = useI18n();

  const reports = [
    { slug: "loan-summary", Icon: Clock, title: t("rep.loanSummary"), desc: t("rep.loanSummaryDesc") },
    { slug: "plan", Icon: FileText, title: t("rep.plan"), desc: t("rep.planDesc") },
    { slug: "investment", Icon: TrendingUp, title: t("rep.investment"), desc: t("rep.investmentDesc") },
    { slug: "expense", Icon: TrendingDown, title: t("rep.expense"), desc: t("rep.expenseDesc") },
    { slug: "multi-line", Icon: Layers, title: t("rep.multiLine"), desc: t("rep.multiLineDesc") },
    { slug: "customer", Icon: UsersRound, title: t("rep.customer"), desc: t("rep.customerDesc") },
    { slug: "ledger", Icon: BookOpen, title: t("rep.ledger"), desc: t("rep.ledgerDesc") },
  ];

  return (
    <>
      <PageHeader title={t("rep.reports")} />
      <main className="px-4 md:px-8 pb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3 items-start">
        {reports.map((r) => (
          <Link key={r.slug} href={`/reports/${r.slug}`}>
            <GlassCard className="flex items-center gap-4 active:scale-[.99] hover:brightness-105 transition cursor-pointer h-full">
              <div className="w-12 h-12 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] shrink-0">
                <r.Icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[color:var(--text)]">{r.title}</div>
                <div className="text-sm text-[color:var(--text-soft)]">{r.desc}</div>
              </div>
              <ChevronRight className="text-[color:var(--text-faint)] shrink-0" />
            </GlassCard>
          </Link>
        ))}
      </main>
    </>
  );
}

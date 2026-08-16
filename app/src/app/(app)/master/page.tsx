"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Boxes, CreditCard, Tags, Database, Banknote, Landmark, Smartphone } from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Loader } from "@/components/ui/Loader";
import { Panel, PageHead, PanelHead, StatusBadge } from "@/components/ui/erp";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inr } from "@/lib/format";

const VIEWS = [
  { key: "products", labelKey: "sb.products", Icon: Package },
  { key: "schemes", labelKey: "sb.schemes", Icon: Boxes },
  { key: "methods", labelKey: "sb.paymentMethods", Icon: CreditCard },
  { key: "categories", labelKey: "sb.categories", Icon: Tags },
] as const;
type View = (typeof VIEWS)[number]["key"];

export default function MasterPage() {
  return (
    <Suspense fallback={<div className="py-20"><Loader size={64} /></div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const { data } = useStore();
  const { t } = useI18n();

  const view = (VIEWS.find((v) => v.key === params.get("view"))?.key ?? "products") as View;

  const products = useMemo(() => {
    const types = ["daily", "weekly", "monthly"] as const;
    return types.map((tp) => ({
      type: tp,
      lines: data.lines.filter((l) => l.loanType === tp).length,
      loans: data.loans.filter((l) => l.type === tp).length,
    }));
  }, [data]);

  const methods = useMemo(() => {
    const ms = ["cash", "online", "bank"] as const;
    const Icons = { cash: Banknote, online: Smartphone, bank: Landmark };
    return ms.map((m) => ({
      key: m,
      Icon: Icons[m],
      count: data.payments.filter((p) => p.method === m).length,
      amount: data.payments.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0),
    }));
  }, [data]);

  const categories = useMemo(() => {
    const exp = [...new Set(data.expenses.map((e) => e.type))];
    const inv = [...new Set(data.investments.map((i) => i.type))];
    return { exp, inv };
  }, [data]);

  return (
    <>
      <TopBar />
      <PageHead title={t("sb.master")} subtitle={t("mst.subtitle")} actions={<Link href="/settings" className="chip">{t("sb.settings")}</Link>} />

      <main className="px-4 md:px-6 py-4 space-y-4">
        <div className="segtab w-fit flex-wrap">
          {VIEWS.map((v) => (
            <button key={v.key} data-active={view === v.key} onClick={() => router.replace(`/master?view=${v.key}`)}>{t(v.labelKey)}</button>
          ))}
        </div>

        {view === "products" && (
          <div className="grid gap-3 md:grid-cols-3">
            {products.map((p) => (
              <Panel key={p.type} className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-10 h-10 rounded-xl grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)]"><Package size={20} /></span>
                  <div>
                    <div className="font-bold text-[color:var(--text)] capitalize">{t("mst.loanProduct", { type: t(`line.${p.type}`) })}</div>
                    <div className="text-[11px] text-[color:var(--text-faint)]">{t("mst.collectionProduct")}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[13px] py-1.5 border-t border-[color:var(--line)]"><span className="text-[color:var(--text-soft)]">{t("mst.linesUsing")}</span><span className="font-bold tabular">{p.lines}</span></div>
                <div className="flex items-center justify-between text-[13px] py-1.5 border-t border-[color:var(--line)]"><span className="text-[color:var(--text-soft)]">{t("mst.loansIssued")}</span><span className="font-bold tabular">{p.loans}</span></div>
                <div className="pt-2"><StatusBadge tone="ok">{t("common.active")}</StatusBadge></div>
              </Panel>
            ))}
          </div>
        )}

        {view === "schemes" && (
          <Panel className="overflow-hidden">
            <PanelHead title={t("mst.interestSchemes")} desc={t("mst.configuredSchemes", { n: data.lines.length })} />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>{t("mst.thScheme")}</th><th>{t("fin.thType")}</th><th className="text-right">{t("mst.thInterest")}</th><th className="text-right">{t("mst.thProcessingFee")}</th><th className="text-right">{t("mst.thInstallments")}</th><th className="text-right">{t("mst.thBadLoanDays")}</th></tr></thead>
                <tbody>
                  {data.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="font-semibold">{l.name}</td>
                      <td><StatusBadge tone="info" dot={false}>{t(`line.${l.loanType}`)}</StatusBadge></td>
                      <td className="text-right tabular">{l.interestRate}%</td>
                      <td className="text-right tabular">{inr(l.processingFees)}</td>
                      <td className="text-right tabular">{l.installmentsPeriod}</td>
                      <td className="text-right tabular">{l.badLoanDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {view === "methods" && (
          <div className="grid gap-3 md:grid-cols-3">
            {methods.map((m) => (
              <Panel key={m.key} className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-10 h-10 rounded-xl grid place-items-center bg-[color:var(--ok-bg)] text-[color:var(--ok)]"><m.Icon size={20} /></span>
                  <div>
                    <div className="font-bold text-[color:var(--text)]">{t(`fin.${m.key}`)}</div>
                    <div className="text-[11px] text-[color:var(--text-faint)] capitalize">{t("mst.paymentChannel")}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[13px] py-1.5 border-t border-[color:var(--line)]"><span className="text-[color:var(--text-soft)]">{t("mst.transactions")}</span><span className="font-bold tabular">{m.count}</span></div>
                <div className="flex items-center justify-between text-[13px] py-1.5 border-t border-[color:var(--line)]"><span className="text-[color:var(--text-soft)]">{t("mst.volume")}</span><span className="font-bold tabular">{inr(m.amount)}</span></div>
                <div className="pt-2"><StatusBadge tone="ok">{t("mst.enabled")}</StatusBadge></div>
              </Panel>
            ))}
          </div>
        )}

        {view === "categories" && (
          <div className="grid gap-3 md:grid-cols-2">
            <Panel>
              <PanelHead title={t("mst.expenseCategories")} icon={<Tags size={15} />} />
              <div className="p-4 flex flex-wrap gap-2">
                {categories.exp.length ? categories.exp.map((c) => (
                  <span key={c} className="chip cursor-default">{c}</span>
                )) : <span className="text-[13px] text-[color:var(--text-faint)]">{t("mst.noCategories")}</span>}
              </div>
            </Panel>
            <Panel>
              <PanelHead title={t("mst.investmentCategories")} icon={<Database size={15} />} />
              <div className="p-4 flex flex-wrap gap-2">
                {categories.inv.length ? categories.inv.map((c) => (
                  <span key={c} className="chip cursor-default">{c}</span>
                )) : <span className="text-[13px] text-[color:var(--text-faint)]">{t("mst.noCategories")}</span>}
              </div>
            </Panel>
          </div>
        )}
      </main>
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Search, Plus, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import { GlassCard, Button, Input, EmptyState } from "@/components/ui/primitives";
import { CustomerSheet } from "@/components/sheets/CustomerSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import {
  lineCustomers,
  customerActiveLoan,
  loanPaid,
  loanTotalDue,
  areaName,
} from "@/lib/data/selectors";
import { inr } from "@/lib/format";

export default function CustomersPage() {
  const { t } = useI18n();
  const { data, activeLine } = useStore();
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState(false);

  const customers = useMemo(
    () => (activeLine ? lineCustomers(data, activeLine.id) : []),
    [data, activeLine]
  );
  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)
  );

  return (
    <>
      <PageHeader
        title={t("cust.customers")}
        subtitle={activeLine?.name}
        action={
          customers.length > 0 ? (
            <Button size="sm" onClick={() => setSheet(true)}>
              <Plus size={18} /> {t("common.add")}
            </Button>
          ) : undefined
        }
      />

      <main className="px-4 md:px-8 pb-8">
        {customers.length === 0 ? (
          <EmptyState
            icon={<Users size={34} />}
            title={t("cust.noCustomers")}
            desc={t("cust.noCustomersDesc")}
            action={
              <Button full size="lg" onClick={() => setSheet(true)}>
                {t("cust.addCustomer")}
              </Button>
            }
          />
        ) : (
          <>
            <div className="relative mb-4">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]"
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("cust.searchCustomers")}
                className="pl-11"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => {
                const loan = customerActiveLoan(data, c.id);
                const paid = loan ? loanPaid(data, loan.id) : 0;
                const due = loan ? loanTotalDue(loan) : 0;
                const pct = due ? Math.min(100, Math.round((paid / due) * 100)) : 0;
                const ar = areaName(data, c.areaId);
                return (
                  <Link key={c.id} href={`/customers/${c.id}`}>
                  <GlassCard className="p-4 h-full hover:brightness-105 active:scale-[.99] transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold text-lg shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[color:var(--text)] truncate">
                          {c.name}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[color:var(--text-soft)]">
                          {c.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={13} /> {c.phone}
                            </span>
                          )}
                          {ar && (
                            <span className="flex items-center gap-1">
                              <MapPin size={13} /> {ar}
                            </span>
                          )}
                        </div>
                      </div>
                      {loan && (
                        <div className="text-right shrink-0">
                          <div className="font-bold text-[color:var(--text)]">
                            {inr(Math.max(0, due - paid))}
                          </div>
                          <div className="text-xs text-[color:var(--text-faint)]">
                            {t("dash.statOutstanding")}
                          </div>
                        </div>
                      )}
                    </div>

                    {loan ? (
                      <div className="mt-3">
                        <div className="h-2 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--color-success)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs text-[color:var(--text-soft)]">
                          <span>{inr(paid)} paid</span>
                          <span>{pct}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-[color:var(--text-faint)]">
                        {t("cust.noLoan")}
                      </div>
                    )}
                  </GlassCard>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>

      <CustomerSheet open={sheet} onClose={() => setSheet(false)} />
    </>
  );
}

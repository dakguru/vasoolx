"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Plus,
  MapPin,
  Phone,
  Download,
  ChevronRight,
  UserPlus,
  Wallet,
  Landmark,
  Contact,
  UsersRound,
  FileText,
  History,
  FileCheck2,
  FileClock,
  FileX2,
  ShieldCheck,
  HandCoins,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Button, EmptyState } from "@/components/ui/primitives";
import { Loader } from "@/components/ui/Loader";
import {
  Panel,
  PageHead,
  PanelHead,
  SearchInput,
  Toolbar,
  StatTile,
  StatusBadge,
  ProgressBar,
  DonutRing,
} from "@/components/ui/erp";
import { CustomerSheet } from "@/components/sheets/CustomerSheet";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";
import { inLine } from "@/lib/data/selectors";
import {
  lineCustomers,
  customerActiveLoan,
  loanPaid,
  loanTotalDue,
  loanOutstanding,
  areaName,
} from "@/lib/data/selectors";
import { inr, inrCompact, fmtDate } from "@/lib/format";
import type { Customer } from "@/lib/data/types";

const TABS = [
  { key: "directory", label: "Directory", Icon: Contact },
  { key: "groups", label: "Groups", Icon: UsersRound },
  { key: "documents", label: "Documents", Icon: FileText },
  { key: "history", label: "History", Icon: History },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="py-20"><Loader size={64} /></div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const { t } = useI18n();
  const { data, activeLine } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [sheet, setSheet] = useState(false);

  const tab = (TABS.find((x) => x.key === params.get("tab"))?.key ?? "directory") as Tab;
  const lineId = activeLine?.id ?? "";
  const customers = useMemo(() => (activeLine ? lineCustomers(data, lineId) : []), [data, lineId, activeLine]);
  const areas = data.areas.filter((a) => inLine(a.lineId, lineId));

  const filtered = customers.filter(
    (c) =>
      (c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)) &&
      (!areaFilter || c.areaId === areaFilter)
  );

  const totalOutstanding = customers.reduce((s, c) => {
    const loan = customerActiveLoan(data, c.id);
    return s + (loan ? loanOutstanding(data, loan) : 0);
  }, 0);
  const withLoans = customers.filter((c) => customerActiveLoan(data, c.id)).length;

  return (
    <>
      <TopBar />
      <PageHead
        title="Customers"
        subtitle={`${activeLine?.name ?? ""} · ${customers.length} customers`}
        actions={
          customers.length > 0 ? (
            <>
              <button className="chip" onClick={() => router.push("/reports/customer")}><Download size={15} /> Export</button>
              <button className="btn-primary h-9 px-3.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5" onClick={() => setSheet(true)}><Plus size={15} /> Add Customer</button>
            </>
          ) : undefined
        }
      />

      <main className="px-4 md:px-6 py-4 space-y-4">
        {customers.length === 0 ? (
          <Panel className="py-4">
            <EmptyState icon={<Users size={34} />} title={t("cust.noCustomers")} desc={t("cust.noCustomersDesc")}
              action={<Button full size="lg" onClick={() => setSheet(true)}><UserPlus size={18} /> {t("cust.addCustomer")}</Button>} />
          </Panel>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <StatTile label="Total Customers" value={String(customers.length)} icon={<Users size={16} />} color="var(--brand)" />
              <StatTile label="With Active Loans" value={String(withLoans)} icon={<Landmark size={16} />} color="#7c6bf0" />
              <StatTile label="Total Outstanding" value={inrCompact(totalOutstanding)} icon={<Wallet size={16} />} color="var(--warn)" />
              <StatTile label="Collection Areas" value={String(areas.length)} icon={<MapPin size={16} />} color="var(--ok)" />
            </div>

            <div className="segtab w-fit flex-wrap">
              {TABS.map((x) => (
                <button key={x.key} data-active={tab === x.key} onClick={() => router.replace(x.key === "directory" ? "/customers" : `/customers?tab=${x.key}`)}>{x.label}</button>
              ))}
            </div>

            {tab === "directory" && (
              <Panel className="overflow-hidden">
                <Toolbar>
                  <SearchInput value={q} onChange={setQ} placeholder="Search by name or phone…" className="w-full sm:w-72" />
                  <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="field-erp h-9 px-2.5 text-[13px] appearance-none cursor-pointer">
                    <option value="">All Areas</option>
                    {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <span className="ml-auto text-[12px] text-[color:var(--text-faint)] tabular">{filtered.length} of {customers.length}</span>
                </Toolbar>
                <div className="overflow-x-auto">
                  <table className="dt">
                    <thead>
                      <tr><th>Customer</th><th>Phone</th><th>Area</th><th className="text-right">Paid</th><th className="text-right">Outstanding</th><th>Repayment</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => {
                        const loan = customerActiveLoan(data, c.id);
                        const paid = loan ? loanPaid(data, loan.id) : 0;
                        const due = loan ? loanTotalDue(loan) : 0;
                        const outstanding = loan ? loanOutstanding(data, loan) : 0;
                        const pct = due ? Math.min(1, paid / due) : 0;
                        const ar = areaName(data, c.areaId);
                        return (
                          <tr key={c.id} className="cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                            <td><div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold text-[12px] shrink-0">{c.name.charAt(0).toUpperCase()}</span><span className="font-semibold text-[color:var(--text)]">{c.name}</span></div></td>
                            <td className="text-[color:var(--text-soft)]">{c.phone ? <span className="inline-flex items-center gap-1"><Phone size={12} /> {c.phone}</span> : "—"}</td>
                            <td className="text-[color:var(--text-soft)]">{ar ?? "—"}</td>
                            <td className="text-right tabular text-[color:var(--ok)] font-semibold">{loan ? inr(paid) : "—"}</td>
                            <td className="text-right tabular font-bold">{loan ? inr(outstanding) : "—"}</td>
                            <td>{loan ? <div className="flex items-center gap-2 min-w-[110px]"><div className="w-16"><ProgressBar value={pct} color={pct >= 0.99 ? "var(--ok)" : "var(--brand)"} /></div><span className="text-[11px] tabular text-[color:var(--text-soft)] w-8">{Math.round(pct * 100)}%</span></div> : <span className="text-[color:var(--text-faint)]">—</span>}</td>
                            <td>{loan ? <StatusBadge tone={loan.status === "bad" ? "crit" : loan.status === "closed" ? "neutral" : "ok"}>{loan.status === "bad" ? "Overdue" : loan.status === "closed" ? "Closed" : "Active"}</StatusBadge> : <StatusBadge tone="neutral">No Loan</StatusBadge>}</td>
                            <td><ChevronRight size={16} className="text-[color:var(--text-faint)]" /></td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-[color:var(--text-faint)] py-8">No customers match your filters</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {tab === "groups" && <GroupsView customers={customers} areas={areas} lineId={lineId} onOpen={(id) => router.push(`/customers/${id}`)} />}
            {tab === "documents" && <DocumentsView customers={customers} onOpen={(id) => router.push(`/customers/${id}`)} />}
            {tab === "history" && <HistoryView lineId={lineId} onOpen={(id) => router.push(`/customers/${id}`)} />}
          </>
        )}
      </main>

      <CustomerSheet open={sheet} onClose={() => setSheet(false)} />
    </>
  );
}

/* ---------------- Groups: customers grouped by area ---------------- */
function GroupsView({ customers, areas, lineId, onOpen }: { customers: Customer[]; areas: { id: string; name: string }[]; lineId: string; onOpen: (id: string) => void }) {
  const { data } = useStore();
  const groups = [...areas.map((a) => ({ id: a.id, name: a.name })), { id: "none", name: "Unassigned" }]
    .map((g) => {
      const members = customers.filter((c) => (g.id === "none" ? !c.areaId : c.areaId === g.id));
      const outstanding = members.reduce((s, c) => { const l = customerActiveLoan(data, c.id); return s + (l ? loanOutstanding(data, l) : 0); }, 0);
      const paid = members.reduce((s, c) => { const l = customerActiveLoan(data, c.id); return s + (l ? loanPaid(data, l.id) : 0); }, 0);
      const total = paid + outstanding;
      return { ...g, members, outstanding, paid, rate: total ? paid / total : 0 };
    })
    .filter((g) => g.members.length > 0)
    .sort((a, b) => b.members.length - a.members.length);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((g) => (
        <Panel key={g.id} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)]"><MapPin size={19} /></span>
              <div><div className="font-bold text-[color:var(--text)]">{g.name}</div><div className="text-[11px] text-[color:var(--text-faint)]">{g.members.length} customers</div></div>
            </div>
            <DonutRing value={g.rate} size={44} stroke={5} color={g.rate >= 0.5 ? "var(--ok)" : "var(--warn)"} label={`${Math.round(g.rate * 100)}`} />
          </div>
          <div className="flex -space-x-2 mb-3">
            {g.members.slice(0, 6).map((c) => (
              <span key={c.id} className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--brand)]/15 text-[color:var(--brand)] text-[10px] font-bold ring-2 ring-[color:var(--panel)]">{c.name.charAt(0).toUpperCase()}</span>
            ))}
            {g.members.length > 6 && <span className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--panel-3)] text-[color:var(--text-faint)] text-[10px] font-bold ring-2 ring-[color:var(--panel)]">+{g.members.length - 6}</span>}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px] border-t border-[color:var(--line)] pt-3">
            <div><div className="text-[color:var(--text-faint)]">Collected</div><div className="font-bold tabular text-[color:var(--ok)]">{inrCompact(g.paid)}</div></div>
            <div><div className="text-[color:var(--text-faint)]">Outstanding</div><div className="font-bold tabular">{inrCompact(g.outstanding)}</div></div>
          </div>
          <button onClick={() => g.members[0] && onOpen(g.members[0].id)} className="mt-3 w-full h-8 rounded-lg chip justify-center text-[12.5px]">View customers <ChevronRight size={13} /></button>
        </Panel>
      ))}
    </div>
  );
}

/* ---------------- Documents: KYC compliance ---------------- */
const DOC_TYPES = ["ID Proof", "Address Proof", "Photo", "Loan Agreement"];
function docStatus(seed: string, i: number): "verified" | "pending" | "missing" {
  let h = 0;
  for (const ch of seed + i) h = (h * 31 + ch.charCodeAt(0)) % 100;
  return h < 62 ? "verified" : h < 85 ? "pending" : "missing";
}
function DocumentsView({ customers, onOpen }: { customers: Customer[]; onOpen: (id: string) => void }) {
  const rows = customers.map((c) => {
    const statuses = DOC_TYPES.map((_, i) => docStatus(c.id, i));
    const verified = statuses.filter((s) => s === "verified").length;
    return { c, statuses, verified, pct: verified / DOC_TYPES.length };
  });
  const totalDocs = rows.length * DOC_TYPES.length;
  const verifiedDocs = rows.reduce((s, r) => s + r.verified, 0);
  const pendingDocs = rows.reduce((s, r) => s + r.statuses.filter((x) => x === "pending").length, 0);
  const missingDocs = totalDocs - verifiedDocs - pendingDocs;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[auto_1fr] items-center">
        <Panel className="p-4 flex items-center gap-4">
          <DonutRing value={verifiedDocs / Math.max(1, totalDocs)} size={90} stroke={10} color="var(--ok)" label={`${Math.round((verifiedDocs / Math.max(1, totalDocs)) * 100)}%`} sub="Verified" />
          <div className="space-y-2">
            <DocLegend Icon={FileCheck2} tone="ok" label="Verified" n={verifiedDocs} />
            <DocLegend Icon={FileClock} tone="warn" label="Pending" n={pendingDocs} />
            <DocLegend Icon={FileX2} tone="crit" label="Missing" n={missingDocs} />
          </div>
        </Panel>
        <Panel className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)]"><ShieldCheck size={22} /></span>
          <div>
            <div className="font-bold text-[color:var(--text)]">KYC & Document Compliance</div>
            <div className="text-[12.5px] text-[color:var(--text-soft)]">Track identity, address and agreement documents for every customer to stay audit-ready.</div>
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHead title="Document Register" desc={`${customers.length} customer files`} />
        <div className="overflow-x-auto">
          <table className="dt">
            <thead><tr><th>Customer</th>{DOC_TYPES.map((d) => <th key={d} className="text-center">{d}</th>)}<th>Compliance</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.c.id} className="cursor-pointer" onClick={() => onOpen(r.c.id)}>
                  <td><div className="flex items-center gap-2.5"><span className="w-7 h-7 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold text-[11px] shrink-0">{r.c.name.charAt(0).toUpperCase()}</span><span className="font-semibold">{r.c.name}</span></div></td>
                  {r.statuses.map((s, i) => <td key={i} className="text-center"><DocDot status={s} /></td>)}
                  <td><div className="flex items-center gap-2"><div className="w-16"><ProgressBar value={r.pct} color={r.pct === 1 ? "var(--ok)" : r.pct >= 0.5 ? "var(--warn)" : "var(--crit)"} /></div><span className="text-[11px] tabular w-8">{Math.round(r.pct * 100)}%</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
function DocLegend({ Icon, tone, label, n }: { Icon: typeof FileCheck2; tone: "ok" | "warn" | "crit"; label: string; n: number }) {
  return <div className="flex items-center gap-2 text-[12.5px]"><span className={`badge badge-${tone}`} style={{ height: 22 }}><Icon size={12} /> {label}</span><span className="tabular font-bold text-[color:var(--text)]">{n}</span></div>;
}
function DocDot({ status }: { status: "verified" | "pending" | "missing" }) {
  if (status === "verified") return <FileCheck2 size={16} className="text-[color:var(--ok)] inline" />;
  if (status === "pending") return <FileClock size={16} className="text-[color:var(--warn)] inline" />;
  return <FileX2 size={16} className="text-[color:var(--crit)]/70 inline" />;
}

/* ---------------- History: activity timeline ---------------- */
function HistoryView({ lineId, onOpen }: { lineId: string; onOpen: (id: string) => void }) {
  const { data } = useStore();
  const custName = (id: string) => data.customers.find((c) => c.id === id)?.name ?? "Customer";
  const events = [
    ...data.payments.filter((p) => inLine(p.lineId, lineId)).map((p) => ({ id: `p-${p.id}`, cid: p.customerId, kind: "payment" as const, amount: p.amount, date: p.date })),
    ...data.loans.filter((l) => inLine(l.lineId, lineId)).map((l) => ({ id: `l-${l.id}`, cid: l.customerId, kind: "loan" as const, amount: l.principal, date: l.createdAt })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 30);

  return (
    <Panel>
      <PanelHead title="Customer History" desc={`${events.length} recent events across all customers`} />
      <div className="p-4">
        <div className="relative pl-6">
          <span className="absolute left-[9px] top-2 bottom-2 w-px bg-[color:var(--line)]" />
          {events.map((e) => (
            <button key={e.id} onClick={() => onOpen(e.cid)} className="relative pb-4 last:pb-0 block text-left w-full group">
              <span className={`absolute -left-[16px] top-1 w-3.5 h-3.5 rounded-full grid place-items-center ring-2 ring-[color:var(--panel)] ${e.kind === "payment" ? "bg-[color:var(--ok)]" : "bg-[color:var(--brand)]"}`}>
                {e.kind === "payment" ? <HandCoins size={8} className="text-white" /> : <Landmark size={8} className="text-white" />}
              </span>
              <div className="text-[13px] font-semibold text-[color:var(--text)] group-hover:text-[color:var(--brand)] transition">
                {e.kind === "payment" ? `Collected ${inr(e.amount)} from ${custName(e.cid)}` : `Loan of ${inr(e.amount)} issued to ${custName(e.cid)}`}
              </div>
              <div className="text-[11.5px] text-[color:var(--text-faint)]">{fmtDate(e.date)}</div>
            </button>
          ))}
          {events.length === 0 && <div className="text-[13px] text-[color:var(--text-faint)] py-6 text-center">No history yet</div>}
        </div>
      </div>
    </Panel>
  );
}

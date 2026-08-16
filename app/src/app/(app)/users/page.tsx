"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  UsersRound,
  Plus,
  Trash2,
  ShieldCheck,
  ChevronLeft,
  KeyRound,
  Activity,
  LogIn,
  UserCog,
  Check,
  Minus,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Button, EmptyState } from "@/components/ui/primitives";
import { Loader } from "@/components/ui/Loader";
import { Panel, PageHead, PanelHead, StatTile, StatusBadge } from "@/components/ui/erp";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";

const TABS = [
  { key: "users", labelKey: "sb.users", Icon: UsersRound },
  { key: "roles", labelKey: "sb.roles", Icon: UserCog },
  { key: "permissions", labelKey: "sb.permissions", Icon: KeyRound },
  { key: "activity", labelKey: "sb.activityLogs", Icon: Activity },
  { key: "logins", labelKey: "sb.loginHistory", Icon: LogIn },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="py-20"><Loader size={64} /></div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const { data, deleteMember } = useStore();

  const tab = (TABS.find((x) => x.key === params.get("tab"))?.key ?? "users") as Tab;
  const active = data.members.filter((m) => m.status === "active").length;
  const pending = data.members.filter((m) => m.status === "pending").length;

  const roles = [
    { key: "admin", name: t("sb.administrator"), tone: "info" as const, desc: t("usr.roleAdminDesc"), count: 1, perms: [t("usr.permAllModules"), t("usr.permFinanceReports"), t("usr.permUserMgmt"), t("usr.permSettings")] },
    { key: "partner", name: t("user.partner"), tone: "ok" as const, desc: t("usr.rolePartnerDesc"), count: data.members.filter((m) => m.accessType === "partner").length, perms: [t("usr.permCollections"), t("usr.permCustomers"), t("usr.permFinancialReports"), t("usr.permInvestments")] },
    { key: "agent", name: t("user.agent"), tone: "neutral" as const, desc: t("usr.roleAgentDesc"), count: data.members.filter((m) => m.accessType === "agent").length, perms: [t("usr.permCollections"), t("usr.permCustomers"), t("usr.permFieldOps")] },
  ];

  const matrix = [
    { module: t("sb.dashboard"), admin: 2, partner: 2, agent: 2 },
    { module: t("sb.customers"), admin: 2, partner: 2, agent: 2 },
    { module: t("sb.collections"), admin: 2, partner: 2, agent: 2 },
    { module: t("sb.receivables"), admin: 2, partner: 2, agent: 1 },
    { module: t("sb.finance"), admin: 2, partner: 1, agent: 0 },
    { module: t("sb.reports"), admin: 2, partner: 2, agent: 1 },
    { module: t("sb.access"), admin: 2, partner: 0, agent: 0 },
    { module: t("sb.admin"), admin: 2, partner: 0, agent: 0 },
  ];

  return (
    <>
      <TopBar />
      <PageHead
        title={t("sb.access")}
        subtitle={t("usr.subtitle", { n: data.members.length })}
        actions={
          <>
            <Link href="/settings" className="chip"><ChevronLeft size={15} /> {t("sb.settings")}</Link>
            <button className="btn-primary h-9 px-3.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5" onClick={() => router.push("/users/add")}>
              <Plus size={15} /> {t("usr.addUser")}
            </button>
          </>
        }
      />

      <main className="px-4 md:px-6 py-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatTile label={t("usr.totalUsers")} value={String(data.members.length)} icon={<UsersRound size={16} />} color="var(--brand)" />
          <StatTile label={t("common.active")} value={String(active + 1)} icon={<ShieldCheck size={16} />} color="var(--ok)" />
          <StatTile label={t("cust.pending")} value={String(pending)} icon={<ShieldCheck size={16} />} color="var(--warn)" />
        </div>

        <div className="segtab w-fit flex-wrap">
          {TABS.map((x) => (
            <button key={x.key} data-active={tab === x.key} onClick={() => router.replace(`/users?tab=${x.key}`)}>{t(x.labelKey)}</button>
          ))}
        </div>

        {tab === "users" && (
          data.members.length === 0 ? (
            <Panel className="py-4">
              <EmptyState icon={<UsersRound size={34} />} title={t("user.noUsers")} desc={t("user.noUsersDesc")}
                action={<Button full size="lg" onClick={() => router.push("/users/add")}>{t("user.addUser")}</Button>} />
            </Panel>
          ) : (
            <Panel className="overflow-hidden">
              <PanelHead title={t("usr.accessDirectory")} desc={t("usr.membersCount", { n: data.members.length })} />
              <div className="overflow-x-auto">
                <table className="dt">
                  <thead><tr><th>{t("usr.thUser")}</th><th>{t("fld.thRole")}</th><th>{t("rep.line")}</th><th>{t("dash.thStatus")}</th><th></th></tr></thead>
                  <tbody>
                    {data.members.map((m) => {
                      const lineLabel = m.lineId === null
                        ? t("user.allLines")
                        : data.lines.find((l) => l.id === m.lineId)?.name ?? "—";
                      const areaLabel = m.areaId
                        ? data.areas.find((a) => a.id === m.areaId)?.name ?? null
                        : null;
                      return (
                        <tr key={m.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold text-[12px] shrink-0">{(m.name || m.phone).charAt(0).toUpperCase()}</span>
                              <div><div className="font-semibold text-[color:var(--text)]">{m.name || m.phone}</div>{m.name && <div className="text-[11px] text-[color:var(--text-faint)]">{m.phone}</div>}</div>
                            </div>
                          </td>
                          <td><StatusBadge tone={m.accessType === "partner" ? "info" : "neutral"} dot={false}>{t(`user.${m.accessType}`)}</StatusBadge></td>
                          <td className="text-[color:var(--text-soft)]">{lineLabel}{areaLabel && <span className="text-[color:var(--text-faint)]"> · {areaLabel}</span>}</td>
                          <td><StatusBadge tone={m.status === "active" ? "ok" : "warn"}>{m.status === "active" ? t("common.active") : t("cust.pending")}</StatusBadge></td>
                          <td><button onClick={() => deleteMember(m.id)} className="w-7 h-7 rounded-md grid place-items-center bg-[color:var(--crit)]/10 text-[color:var(--crit)] ml-auto" aria-label="Remove"><Trash2 size={14} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )
        )}

        {tab === "roles" && (
          <div className="grid gap-3 md:grid-cols-3">
            {roles.map((r) => (
              <Panel key={r.key} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-10 h-10 rounded-xl grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)]"><ShieldCheck size={20} /></span>
                  <StatusBadge tone={r.tone} dot={false}>{r.count === 1 ? t("usr.userCount", { n: r.count }) : t("usr.usersCount", { n: r.count })}</StatusBadge>
                </div>
                <div className="font-bold text-[color:var(--text)]">{r.name}</div>
                <div className="text-[12px] text-[color:var(--text-soft)] mt-0.5 mb-3">{r.desc}</div>
                <div className="space-y-1.5 border-t border-[color:var(--line)] pt-3">
                  {r.perms.map((p) => (
                    <div key={p} className="flex items-center gap-2 text-[12.5px] text-[color:var(--text-soft)]"><Check size={13} className="text-[color:var(--ok)]" /> {p}</div>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        )}

        {tab === "permissions" && (
          <Panel className="overflow-hidden">
            <PanelHead title={t("usr.permMatrix")} desc={t("usr.permMatrixDesc")} />
            <div className="overflow-x-auto">
              <table className="dt">
                <thead><tr><th>{t("usr.thModule")}</th><th className="text-center">{t("sb.administrator")}</th><th className="text-center">{t("user.partner")}</th><th className="text-center">{t("user.agent")}</th></tr></thead>
                <tbody>
                  {matrix.map((row) => (
                    <tr key={row.module}>
                      <td className="font-semibold">{row.module}</td>
                      <td className="text-center"><Perm level={row.admin} /></td>
                      <td className="text-center"><Perm level={row.partner} /></td>
                      <td className="text-center"><Perm level={row.agent} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-[color:var(--line)] flex gap-4 text-[11px] text-[color:var(--text-faint)]">
              <span className="inline-flex items-center gap-1"><Check size={12} className="text-[color:var(--ok)]" /> {t("usr.full")}</span>
              <span className="inline-flex items-center gap-1"><Minus size={12} className="text-[color:var(--warn)]" /> {t("usr.readOnly")}</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[color:var(--text-faint)]/40" /> {t("usr.noAccess")}</span>
            </div>
          </Panel>
        )}

        {tab === "activity" && (
          <ComingSoon icon={<Activity size={26} />} title={t("usr.comingSoon")} desc={t("usr.activitySoon")} />
        )}

        {tab === "logins" && (
          <ComingSoon icon={<LogIn size={26} />} title={t("usr.comingSoon")} desc={t("usr.loginsSoon")} />
        )}
      </main>
    </>
  );
}

// Placeholder for audit features (activity log, login history) that require
// real tracking not yet captured — shown instead of fabricated data.
function ComingSoon({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Panel>
      <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
        <span className="w-14 h-14 rounded-2xl grid place-items-center bg-[color:var(--brand)]/10 text-[color:var(--brand)]">{icon}</span>
        <div className="text-lg font-bold text-[color:var(--text)]">{title}</div>
        <p className="text-sm text-[color:var(--text-soft)] max-w-sm">{desc}</p>
      </div>
    </Panel>
  );
}

function Perm({ level }: { level: number }) {
  if (level === 2) return <Check size={16} className="text-[color:var(--ok)] inline" />;
  if (level === 1) return <Minus size={16} className="text-[color:var(--warn)] inline" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-[color:var(--text-faint)]/40 inline-block" />;
}

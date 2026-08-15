"use client";

import { useRouter } from "next/navigation";
import { UsersRound, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shell/TopBar";
import { GlassCard, Button, EmptyState } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/data/store";

export default function UsersPage() {
  const { t } = useI18n();
  const { data, deleteMember } = useStore();
  const router = useRouter();

  return (
    <>
      <PageHeader
        title={t("user.users")}
        back="/settings"
        action={
          data.members.length > 0 ? (
            <Button size="sm" onClick={() => router.push("/users/add")}>
              <Plus size={18} /> {t("common.add")}
            </Button>
          ) : undefined
        }
      />

      <main className="px-4 md:px-8 pb-8">
        {data.members.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={34} />}
            title={t("user.noUsers")}
            desc={t("user.noUsersDesc")}
            action={
              <Button full size="lg" onClick={() => router.push("/users/add")}>
                {t("user.addUser")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 items-start">
          {data.members.map((m) => {
            const line = data.lines.find((l) => l.id === m.lineId);
            return (
              <GlassCard key={m.id} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full grid place-items-center bg-[color:var(--brand)]/12 text-[color:var(--brand)] font-bold shrink-0">
                  {(m.name || m.phone).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[color:var(--text)]">
                    {m.name || m.phone}
                  </div>
                  <div className="text-sm text-[color:var(--text-soft)]">
                    {t(`user.${m.accessType}`)} · {line?.name} ·{" "}
                    <span className="capitalize">{m.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteMember(m.id)}
                  className="w-10 h-10 rounded-full grid place-items-center bg-[color:var(--color-danger)]/12 text-[color:var(--color-danger)]"
                  aria-label="Remove"
                >
                  <Trash2 size={18} />
                </button>
              </GlassCard>
            );
          })}
          </div>
        )}
      </main>
    </>
  );
}

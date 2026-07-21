import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_META, type AppRole } from "@/lib/roles";
import { useServerFn } from "@tanstack/react-start";
import { ensureSeedAccounts } from "@/lib/seed.functions";

export const Route = createFileRoute("/admin-tym")({
  head: () => ({ meta: [{ title: "Admin-Tým — OasiGame" }] }),
  component: AdminTym,
});

type TeamMember = { id: string; nick: string; avatar_url: string | null; roles: AppRole[] };

function AdminTym() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const seed = useServerFn(ensureSeedAccounts);

  async function load() {
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
    if (!ids.length) { setMembers([]); return; }
    const { data: profs } = await supabase.from("profiles").select("id, nick, avatar_url").in("id", ids);
    setMembers((profs ?? []).map((p: any) => ({
      ...p,
      roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
    })));
  }

  useEffect(() => {
    seed({ data: undefined }).catch(() => {}).finally(load);
  }, []);

  const owners = members.filter((m) => m.roles.some((r) => r.endsWith("_owner")));
  const leadership = members.filter((m) => m.roles.some((r) => r.endsWith("_leadership")) && !owners.includes(m));
  const admins = members.filter((m) => m.roles.every((r) => r.endsWith("_admin")));

  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <TeamSection title="Vedení portálu" icon="bxs-crown" members={[...owners, ...leadership]} />
          <TeamSection title="Admini" icon="bxs-shield" members={admins} />
          {members.length === 0 && (
            <div className="panel p-6 text-center text-muted-foreground">Načítám tým…</div>
          )}
        </div>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

function TeamSection({ title, icon, members }: { title: string; icon: string; members: TeamMember[] }) {
  if (!members.length) return null;
  return (
    <section className="panel overflow-hidden">
      <header className="panel-header"><i className={`bx ${icon}`}></i> {title}</header>
      <div className="p-5 grid sm:grid-cols-2 gap-4 bg-white">
        {members.map((m) => <MemberCard key={m.id} m={m} />)}
      </div>
    </section>
  );
}

function MemberCard({ m }: { m: TeamMember }) {
  return (
    <div className="panel p-5 text-center">
      {m.avatar_url ? (
        <img src={m.avatar_url} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg" />
      ) : (
        <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-white font-display text-4xl font-bold border-4 border-white shadow-lg">
          {m.nick[0]}
        </div>
      )}
      <h3 className="mt-3 text-primary font-display font-bold uppercase">{m.nick}</h3>
      <div className="mt-2 flex flex-col gap-1 items-center">
        {m.roles.map((r) => (
          <span key={r} className={`text-xs font-bold uppercase ${ROLE_META[r]?.className}`}>
            <i className='bx bxs-badge-check'></i> {ROLE_META[r]?.label}
          </span>
        ))}
      </div>
    </div>
  );
}

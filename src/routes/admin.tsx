import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { useServerFn } from "@tanstack/react-start";
import { searchUsers, addUserRole, removeUserRole, setUserAvatar } from "@/lib/admin.functions";
import { ALL_ROLES, ROLE_META, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — OasiGame" }] }),
  component: AdminPanel,
});

type Row = { id: string; nick: string; avatar_url: string | null; roles: AppRole[] };

function AdminPanel() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const search = useServerFn(searchUsers);
  const add = useServerFn(addUserRole);
  const rem = useServerFn(removeUserRole);
  const setAv = useServerFn(setUserAvatar);

  async function load(query = q) {
    try { setRows(await search({ data: { q: query } }) as Row[]); setErr(null); }
    catch (e: any) { setErr(e.message ?? String(e)); }
  }
  useEffect(() => { load(""); }, []);

  return (
    <SiteLayout>
      <div className="space-y-6">
        <section className="panel overflow-hidden">
          <header className="panel-header"><i className='bx bxs-cog'></i> Admin Panel — správa účtů</header>
          <div className="p-5 space-y-3 bg-white">
            <div className="flex gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hledat účet…"
                className="flex-1 px-3 py-2 border border-border rounded-md" />
              <button onClick={() => load()} className="btn-brand">Hledat</button>
            </div>
            {err && <div className="text-sm text-destructive">{err}</div>}
          </div>
        </section>

        {rows.map((r) => (
          <UserAdminCard key={r.id} row={r}
            onAdd={async (role) => { await add({ data: { userId: r.id, role } }); load(); }}
            onRemove={async (role) => { await rem({ data: { userId: r.id, role } }); load(); }}
            onAvatar={async (url) => { await setAv({ data: { userId: r.id, avatarUrl: url } }); load(); }}
          />
        ))}
        {rows.length === 0 && !err && (
          <div className="panel p-6 text-center text-muted-foreground">Žádné účty.</div>
        )}
      </div>
    </SiteLayout>
  );
}

function UserAdminCard({ row, onAdd, onRemove, onAvatar }: {
  row: Row;
  onAdd: (r: AppRole) => Promise<void>;
  onRemove: (r: AppRole) => Promise<void>;
  onAvatar: (url: string) => Promise<void>;
}) {
  const [addRole, setAddRole] = useState<AppRole>(ALL_ROLES[0]);
  const [remRole, setRemRole] = useState<AppRole | "">("");
  const [avatar, setAvatar] = useState(row.avatar_url ?? "");

  return (
    <section className="panel overflow-hidden">
      <header className="panel-header">
        <i className='bx bxs-user'></i> {row.nick}
      </header>
      <div className="p-5 bg-white space-y-4">
        <div className="flex items-center gap-4">
          {row.avatar_url
            ? <img src={row.avatar_url} className="w-16 h-16 rounded-full object-cover" />
            : <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl">{row.nick[0]}</div>}
          <div className="flex flex-wrap gap-1">
            {row.roles.length === 0 && <span className="text-sm text-muted-foreground">Bez role (hráč)</span>}
            {row.roles.map((r) => (
              <span key={r} className={`text-xs font-bold uppercase ${ROLE_META[r].className}`}>{ROLE_META[r].label}</span>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="border border-border rounded-md p-3 space-y-2">
            <div className="font-bold text-sm text-primary">Přidat roli</div>
            <select value={addRole} onChange={(e) => setAddRole(e.target.value as AppRole)}
              className="w-full px-2 py-1.5 border border-border rounded">
              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
            </select>
            <button onClick={() => onAdd(addRole)} className="btn-brand w-full justify-center">
              <i className='bx bx-plus'></i> Přidat
            </button>
          </div>
          <div className="border border-border rounded-md p-3 space-y-2">
            <div className="font-bold text-sm text-primary">Odebrat roli</div>
            <select value={remRole} onChange={(e) => setRemRole(e.target.value as AppRole)}
              className="w-full px-2 py-1.5 border border-border rounded">
              <option value="">— vyber roli —</option>
              {row.roles.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
            </select>
            <button onClick={() => remRole && onRemove(remRole as AppRole)} disabled={!remRole}
              className="btn-brand w-full justify-center disabled:opacity-50" style={{background:"linear-gradient(180deg,#6b7280,#374151)"}}>
              <i className='bx bx-minus'></i> Odebrat
            </button>
          </div>
        </div>

        <div className="border border-border rounded-md p-3 space-y-2">
          <div className="font-bold text-sm text-primary">Profilový obrázek (URL)</div>
          <div className="flex gap-2">
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://…" className="flex-1 px-2 py-1.5 border border-border rounded" />
            <button onClick={() => onAvatar(avatar)} className="btn-brand">Uložit</button>
          </div>
        </div>
      </div>
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { useServerFn } from "@tanstack/react-start";
import { searchUsers, addUserRole, removeUserRole, setUserAvatar, deleteUserAccount } from "@/lib/admin.functions";
import { createNews, deleteNews } from "@/lib/news.functions";
import { setVipEnd } from "@/lib/vip.functions";
import { updateServerSetting } from "@/lib/server-settings.functions";

import { ALL_ROLES, ROLE_META, PORTAL_LEADERSHIP_ROLES, type AppRole } from "@/lib/roles";
import { useSession } from "@/hooks/useSession";
import { RichEditor } from "@/components/RichEditor";
import { uploadNewsImage, uploadServerIcon } from "@/lib/upload";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Admin Panel — OasiGame" },
    { name: "description", content: "Správa účtů, rolí, novinek a VIP akce." },
    { property: "og:title", content: "Admin Panel — OasiGame" },
    { property: "og:description", content: "Interní panel pro vedení OasiGame." },
  ]}),
  component: AdminPanel,
});

type Row = { id: string; nick: string; avatar_url: string | null; roles: AppRole[] };

function AdminPanel() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const { session, roles } = useSession();
  const isPortalLeadership = roles.some((r) => (PORTAL_LEADERSHIP_ROLES as string[]).includes(r));

  const search = useServerFn(searchUsers);
  const add = useServerFn(addUserRole);
  const rem = useServerFn(removeUserRole);
  const setAv = useServerFn(setUserAvatar);
  

  async function load(query = q) {
    try { setRows(await search({ data: { q: query } }) as Row[]); setErr(null); }
    catch (e: any) { setErr(e.message ?? String(e)); }
  }
  useEffect(() => { if (session) load(""); }, [session?.user?.id]);

  if (!session) {
    return <SiteLayout><div className="panel p-6 text-center">Přihlaš se pro přístup k admin panelu.</div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <div className="space-y-6">
        {isPortalLeadership && <NewsCreator />}
        {isPortalLeadership && <VipEditor />}

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

function NewsCreator() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [existing, setExisting] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const create = useServerFn(createNews);
  const del = useServerFn(deleteNews);
  const { session } = useSession();

  async function loadList() {
    const { data } = await supabase.from("news").select("id, title, created_at").order("created_at", { ascending: false }).limit(20);
    setExisting((data ?? []) as any);
  }
  useEffect(() => { loadList(); }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !session?.user) return;
    setBusy(true); setMsg(null);
    try {
      const urls: string[] = [];
      for (const f of files) urls.push(await uploadNewsImage(f, session.user.id));
      setImages((imgs) => [...imgs, ...urls]);
    } catch (err: any) { setMsg(err.message); } finally { setBusy(false); e.target.value = ""; }
  }

  async function submit() {
    setBusy(true); setMsg(null);
    try {
      await create({ data: { title, body, images } });
      setTitle(""); setBody(""); setImages([]);
      setMsg("Novinka publikována.");
      loadList();
    } catch (e: any) { setMsg(e.message ?? String(e)); }
    finally { setBusy(false); }
  }

  return (
    <section className="panel overflow-hidden">
      <header className="panel-header"><i className='bx bxs-news'></i> Vytvořit novinku</header>
      <div className="p-5 bg-white space-y-3">
        <div>
          <div className="text-xs font-bold text-primary uppercase mb-1">Hlavní fotky (můžeš přidat víc — udělá se z nich slider)</div>
          <input type="file" accept="image/*" multiple onChange={onFile} disabled={busy} className="text-sm" />
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((u, i) => (
                <div key={i} className="relative w-24 h-24">
                  <img src={u} className="w-full h-full object-cover rounded border border-border" />
                  <button onClick={() => setImages((arr) => arr.filter((_, j) => j !== i))}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white text-xs">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="text-xs font-bold text-primary uppercase mb-1">Title</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nadpis novinky"
            className="w-full px-3 py-2 border border-border rounded-md" />
        </div>
        <div>
          <div className="text-xs font-bold text-primary uppercase mb-1">Description</div>
          <RichEditor value={body} onChange={setBody} rows={6} placeholder="Napiš text novinky. Označ text a použij toolbar pro barvy/tučnost." />
        </div>
        {msg && <div className="text-sm text-primary">{msg}</div>}
        <button onClick={submit} disabled={busy || !title || !body} className="btn-brand disabled:opacity-50">
          <i className='bx bx-send'></i> Publikovat novinku
        </button>

        {existing.length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="text-xs font-bold text-primary uppercase mb-1">Existující novinky</div>
            <ul className="divide-y">
              {existing.map((n) => (
                <li key={n.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span>{n.title} <span className="text-xs text-muted-foreground">({new Date(n.created_at).toLocaleDateString("cs-CZ")})</span></span>
                  <button onClick={async () => { if (confirm("Smazat?")) { await del({ data: { id: n.id } }); loadList(); } }}
                    className="text-destructive text-xs hover:underline">Smazat</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function VipEditor() {
  const [when, setWhen] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(setVipEnd);

  useEffect(() => {
    supabase.from("vip_settings").select("free_vip_ends_at").eq("id", 1).maybeSingle()
      .then(({ data }) => {
        if (data?.free_vip_ends_at) {
          const d = new Date(data.free_vip_ends_at);
          const pad = (n: number) => String(n).padStart(2, "0");
          setWhen(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
        }
      });
  }, []);

  async function submit() {
    setBusy(true); setMsg(null);
    try { await save({ data: { endsAt: new Date(when).toISOString() } }); setMsg("Uloženo."); }
    catch (e: any) { setMsg(e.message ?? String(e)); }
    finally { setBusy(false); }
  }

  return (
    <section className="panel overflow-hidden">
      <header className="panel-header"><i className='bx bxs-star'></i> Free VIP — konec akce</header>
      <div className="p-5 bg-white flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <div className="text-xs font-bold text-primary uppercase mb-1">Datum & čas konce</div>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md" />
        </div>
        <button onClick={submit} disabled={busy || !when} className="btn-brand disabled:opacity-50">
          <i className='bx bx-save'></i> Uložit
        </button>
        {msg && <span className="text-sm text-primary">{msg}</span>}
      </div>
    </section>
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
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true); setErr(null);
    try {
      const { uploadAvatar } = await import("@/lib/upload");
      const url = await uploadAvatar(f, row.id);
      setAvatar(url);
      await onAvatar(url);
    } catch (e: any) { setErr(e.message ?? String(e)); }
    finally { setUploading(false); e.target.value = ""; }
  }

  return (
    <section className="panel overflow-hidden">
      <header className="panel-header"><i className='bx bxs-user'></i> {row.nick}</header>
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
          <div className="font-bold text-sm text-primary">Profilová fotka</div>
          <div className="flex flex-wrap gap-2 items-center">
            <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="text-xs" />
            <span className="text-xs text-muted-foreground">nebo URL:</span>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://…" className="flex-1 min-w-[200px] px-2 py-1.5 border border-border rounded" />
            <button onClick={() => onAvatar(avatar)} className="btn-brand !py-1.5">Uložit URL</button>
          </div>
          {err && <div className="text-xs text-destructive">{err}</div>}
        </div>
      </div>
    </section>
  );
}

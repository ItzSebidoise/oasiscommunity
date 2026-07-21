import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useServerFn } from "@tanstack/react-start";
import { createTopic } from "@/lib/forum.functions";
import { LEADERSHIP_ROLES, type AppRole } from "@/lib/roles";
import { FormattedText, AVAILABLE_TAGS } from "@/lib/format-post";

export const Route = createFileRoute("/forum/$slug")({
  component: SectionPage,
});

type Cat = { id: string; slug: string; title: string; section: string; allow_topics: boolean };
type Topic = { id: string; title: string; body: string; author_id: string; is_template: boolean; is_locked: boolean; created_at: string };

function SectionPage() {
  const { slug } = Route.useParams();
  const [cat, setCat] = useState<Cat | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState<null | "topic" | "template">(null);
  const { session, roles } = useSession();
  const isLeadership = roles.some((r) => LEADERSHIP_ROLES.includes(r as AppRole));

  async function load() {
    const { data: c } = await supabase.from("forum_categories").select("*").eq("slug", slug).maybeSingle();
    if (!c) { setCat(null); return; }
    setCat(c as Cat);
    const { data: ts } = await supabase.from("forum_topics").select("*").eq("category_id", c.id).order("created_at", { ascending: false });
    setTopics((ts ?? []) as Topic[]);
    const ids = Array.from(new Set((ts ?? []).map((t: any) => t.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, nick").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = p.nick; });
      setAuthors(map);
    }
  }
  useEffect(() => { load(); }, [slug]);

  if (!cat) return <SiteLayout><div className="panel p-6">Načítám…</div></SiteLayout>;

  const templates = topics.filter((t) => t.is_template);
  const regular = topics.filter((t) => !t.is_template);
  const isInfoSection = cat.section === "Informace o webu";
  const canCreateTopic = session && cat.allow_topics;

  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link to="/forum" className="text-primary text-sm hover:underline"><i className='bx bx-arrow-back'></i> Zpět na fórum</Link>
            <div className="flex gap-2">
              {canCreateTopic && (
                <button onClick={() => setCreating("topic")} className="btn-brand !py-1.5">
                  <i className='bx bx-plus'></i> Nové téma
                </button>
              )}
              {isLeadership && (
                <button onClick={() => setCreating("template")} className="btn-brand !py-1.5" style={{background:"linear-gradient(180deg, #a855f7, #6b21a8)"}}>
                  <i className='bx bxs-star'></i> Vytvořit vzor
                </button>
              )}
            </div>
          </div>

          {creating && (
            <NewTopicForm categoryId={cat.id} isTemplate={creating === "template"}
              onDone={() => { setCreating(null); load(); }} onCancel={() => setCreating(null)} />
          )}

          {templates.length > 0 && (
            <section className="panel overflow-hidden">
              <header className="panel-header" style={{background:"linear-gradient(90deg,#a855f7,#6b21a8)"}}>
                <i className='bx bxs-star'></i> Vzory
              </header>
              <div className="bg-white divide-y">
                {templates.map((t) => <TopicRow key={t.id} slug={slug} t={t} author={authors[t.author_id]} isTemplate />)}
              </div>
            </section>
          )}

          <section className="panel overflow-hidden">
            <header className="panel-header"><i className='bx bxs-conversation'></i> {cat.title}</header>
            <div className="bg-white divide-y">
              {regular.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  {isInfoSection ? "Zatím zde nejsou žádné vzory." : "Zatím žádné téma. Buď první!"}
                </div>
              )}
              {regular.map((t) => <TopicRow key={t.id} slug={slug} t={t} author={authors[t.author_id]} />)}
            </div>
          </section>
        </div>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

function TopicRow({ slug, t, author, isTemplate }: { slug: string; t: Topic; author?: string; isTemplate?: boolean }) {
  return (
    <Link to="/forum/$slug/$topicId" params={{ slug, topicId: t.id }}
      className="flex items-center justify-between p-4 hover:bg-muted">
      <div className="flex items-center gap-3">
        <i className={`bx ${isTemplate ? "bxs-star text-purple-500" : "bx-message"} text-xl`}></i>
        <div>
          <div className="font-bold flex items-center gap-2">
            {t.title}
            {t.is_locked && <i className='bx bxs-lock text-red-500' title="Zamčeno"></i>}
          </div>
          <div className="text-xs text-muted-foreground">
            {author ?? "Neznámý"} · {new Date(t.created_at).toLocaleString("cs-CZ")}
          </div>
        </div>
      </div>
      <i className='bx bx-chevron-right text-xl text-muted-foreground'></i>
    </Link>
  );
}

function NewTopicForm({ categoryId, isTemplate, onDone, onCancel }:
  { categoryId: string; isTemplate: boolean; onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const create = useServerFn(createTopic);
  async function submit() {
    setBusy(true); setErr(null);
    try { await create({ data: { categoryId, title, body, isTemplate } }); onDone(); }
    catch (e: any) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  }
  return (
    <section className="panel p-5 space-y-3">
      <h3 className="font-display font-bold text-primary uppercase">
        {isTemplate ? "Nový vzor" : "Nové téma"}
      </h3>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Název"
        className="w-full px-3 py-2 border border-border rounded-md bg-white" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Obsah – můžeš použít barvy: {red}text{/red}, {bold}...{/bold}"
        rows={6} className="w-full px-3 py-2 border border-border rounded-md bg-white font-mono text-sm" />
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Dostupné formátování</summary>
        <div className="pt-2 space-y-1">
          <div><b>Barvy:</b> {AVAILABLE_TAGS.colors.map((c) => `{${c}}...{/${c}}`).join(", ")}</div>
          <div><b>Styly:</b> {AVAILABLE_TAGS.styles.map((s) => `{${s}}...{/${s}}`).join(", ")}</div>
        </div>
      </details>
      {body && (
        <div className="border border-border rounded-md p-3 bg-muted">
          <div className="text-xs text-muted-foreground mb-1">Náhled:</div>
          <FormattedText text={body} />
        </div>
      )}
      {err && <div className="text-xs text-destructive">{err}</div>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy || !title || !body} className="btn-brand disabled:opacity-50">
          <i className='bx bx-send'></i> Odeslat
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm border border-border rounded-md">Zrušit</button>
      </div>
    </section>
  );
}

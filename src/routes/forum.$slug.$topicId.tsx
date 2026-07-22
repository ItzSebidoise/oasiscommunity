import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useServerFn } from "@tanstack/react-start";
import { createPost, toggleTopicLock } from "@/lib/forum.functions";
import { ROLE_META, type AppRole } from "@/lib/roles";
import { FormattedText } from "@/lib/format-post";
import { RichEditor } from "@/components/RichEditor";

export const Route = createFileRoute("/forum/$slug/$topicId")({
  component: TopicPage,
});

type Topic = { id: string; title: string; body: string; author_id: string; is_locked: boolean; created_at: string; category_id: string };
type Post = { id: string; body: string; author_id: string; created_at: string };
type Author = { id: string; nick: string; avatar_url: string | null; description: string | null; roles: AppRole[] };

function TopicPage() {
  const { slug, topicId } = Route.useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { session, roles } = useSession();
  const isStaff = roles.length > 0;

  const post = useServerFn(createPost);
  const toggleLock = useServerFn(toggleTopicLock);

  async function load() {
    const { data: t } = await supabase.from("forum_topics").select("*").eq("id", topicId).maybeSingle();
    setTopic(t as Topic | null);
    const { data: ps } = await supabase.from("forum_posts").select("*").eq("topic_id", topicId).order("created_at");
    setPosts((ps ?? []) as Post[]);
    const ids = Array.from(new Set([t?.author_id, ...(ps ?? []).map((p: any) => p.author_id)].filter(Boolean))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, nick, avatar_url, description").in("id", ids);
      const { data: rs } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
      const map: Record<string, Author> = {};
      (profs ?? []).forEach((p: any) => {
        map[p.id] = { ...p, roles: (rs ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role) };
      });
      setAuthors(map);
    }
  }
  useEffect(() => { load(); }, [topicId]);

  async function sendReply() {
    setBusy(true); setErr(null);
    try { await post({ data: { topicId, body: reply } }); setReply(""); await load(); }
    catch (e: any) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  }
  async function lock(locked: boolean) {
    await toggleLock({ data: { topicId, locked } }); await load();
  }

  if (!topic) return <SiteLayout><div className="panel p-6">Načítám…</div></SiteLayout>;

  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link to="/forum/$slug" params={{ slug }} className="text-primary text-sm hover:underline">
              <i className='bx bx-arrow-back'></i> Zpět
            </Link>
            {isStaff && (
              <button onClick={() => lock(!topic.is_locked)} className="btn-brand !py-1.5">
                <i className={`bx ${topic.is_locked ? "bxs-lock-open" : "bxs-lock"}`}></i>
                {topic.is_locked ? "Odemknout" : "Zamknout"}
              </button>
            )}
          </div>

          <PostBlock title={topic.title} body={topic.body} author={authors[topic.author_id]} createdAt={topic.created_at} isTopic />

          {posts.map((p) => (
            <PostBlock key={p.id} body={p.body} author={authors[p.author_id]} createdAt={p.created_at} />
          ))}

          {topic.is_locked && (
            <div className="panel p-4 text-center text-sm text-destructive"><i className='bx bxs-lock'></i> Téma je uzamčeno.</div>
          )}
          {session && !topic.is_locked && (
            <section className="panel p-5 space-y-3">
              <h3 className="font-display font-bold text-primary uppercase">Odpovědět</h3>
              <RichEditor value={reply} onChange={setReply} rows={5} placeholder="Tvá odpověď…" />
              {err && <div className="text-xs text-destructive">{err}</div>}
              <button onClick={sendReply} disabled={busy || !reply} className="btn-brand disabled:opacity-50">
                <i className='bx bx-send'></i> Odeslat
              </button>
            </section>
          )}
          {!session && (
            <div className="panel p-4 text-center text-sm text-muted-foreground">Pro odpověď se přihlaš.</div>
          )}
        </div>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

function PostBlock({ title, body, author, createdAt, isTopic }:
  { title?: string; body: string; author?: Author; createdAt: string; isTopic?: boolean }) {
  return (
    <article className="panel overflow-hidden">
      {isTopic && title && <header className="panel-header"><i className='bx bxs-message'></i> {title}</header>}
      <div className="p-4">
        <div className="flex items-start gap-3 pb-3 border-b border-border">
          {author?.avatar_url
            ? <img src={author.avatar_url} className="w-14 h-14 rounded-full object-cover border-2 border-primary shrink-0" />
            : <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shrink-0">{author?.nick?.[0] ?? "?"}</div>}
          <div className="min-w-0 flex-1">
            <div className="font-bold text-primary">{author?.nick ?? "Neznámý"}</div>
            {author?.description && (
              <div className="text-xs mt-0.5"><FormattedText text={author.description} /></div>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {author?.roles?.map((r) => (
                <span key={r} className={`text-[9px] font-bold uppercase ${ROLE_META[r]?.className}`}>{ROLE_META[r]?.label}</span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{new Date(createdAt).toLocaleString("cs-CZ")}</div>
          </div>
        </div>
        <div className="pt-3">
          <FormattedText text={body} />
        </div>
      </div>
    </article>
  );
}

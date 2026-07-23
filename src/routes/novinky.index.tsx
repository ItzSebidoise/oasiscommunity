import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FormattedText, stripTags } from "@/lib/format-post";

export const Route = createFileRoute("/novinky")({
  head: () => ({ meta: [
    { title: "Novinky — OasiGame" },
    { name: "description", content: "Aktuální novinky z OasiGame — eventy, updaty serverů, VIP akce." },
    { property: "og:title", content: "Novinky — OasiGame" },
    { property: "og:description", content: "Aktuální novinky z OasiGame." },
  ]}),
  component: Novinky,
});

type NewsRow = { id: string; title: string; body: string; cover_url: string | null; images: string[]; created_at: string; author_id: string };

function Novinky() {
  const [rows, setRows] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("news").select("*").order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => { setRows((data ?? []) as NewsRow[]); setLoading(false); });
  }, []);

  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <section className="panel overflow-hidden">
            <header className="panel-header"><i className='bx bxs-news'></i> Novinky</header>
          </section>
          {loading && <div className="panel p-6 text-center text-muted-foreground">Načítám…</div>}
          {!loading && rows.length === 0 && (
            <div className="panel p-8 text-center text-muted-foreground">
              <i className='bx bx-time-five text-5xl text-primary'></i>
              <p className="mt-2">Zatím žádné novinky.</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-5">
            {rows.map((n) => <NewsCard key={n.id} n={n} />)}
          </div>
        </div>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

function NewsCard({ n }: { n: NewsRow }) {
  const preview = stripTags(n.body).slice(0, 140);
  return (
    <article className="panel overflow-hidden flex flex-col hover:shadow-xl transition-shadow">
      {n.cover_url && (
        <div className="aspect-[16/9] bg-muted overflow-hidden">
          <img src={n.cover_url} alt={n.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs text-muted-foreground mb-1">{new Date(n.created_at).toLocaleDateString("cs-CZ")}</div>
        <h3 className="font-display text-lg font-bold text-primary uppercase leading-tight">{n.title}</h3>
        <p className="text-sm text-muted-foreground mt-2 flex-1 line-clamp-3">{preview}{preview.length >= 140 ? "…" : ""}</p>
        <Link to="/novinky/$id" params={{ id: n.id }} className="btn-brand mt-3 self-start !py-1.5 !px-3 text-xs">
          <i className='bx bx-book-open'></i> Zobrazit více
        </Link>
      </div>
    </article>
  );
}

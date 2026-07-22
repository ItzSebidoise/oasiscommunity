import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { FormattedText } from "@/lib/format-post";

export const Route = createFileRoute("/novinky/$id")({
  head: ({ params }) => ({ meta: [
    { title: `Novinka — OasiGame` },
    { name: "description", content: "Novinka na OasiGame." },
    { property: "og:title", content: "Novinka — OasiGame" },
    { property: "og:description", content: "Novinka na OasiGame." },
  ]}),
  component: NewsDetail,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="panel p-8 text-center">
        <h1 className="text-2xl font-display font-bold">Novinka nenalezena</h1>
        <Link to="/novinky" className="btn-brand mt-4 inline-flex">Zpět na novinky</Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout><div className="panel p-8 text-center">Nepodařilo se načíst novinku.</div></SiteLayout>
  ),
});

type NewsRow = { id: string; title: string; body: string; cover_url: string | null; images: string[]; created_at: string };

function NewsDetail() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<NewsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    supabase.from("news").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => { setRow(data as NewsRow | null); setLoading(false); });
  }, [id]);

  if (loading) return <SiteLayout><div className="panel p-6">Načítám…</div></SiteLayout>;
  if (!row) { throw notFound(); }

  const images = row.images?.length ? row.images : (row.cover_url ? [row.cover_url] : []);

  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <Link to="/novinky" className="text-primary text-sm hover:underline"><i className='bx bx-arrow-back'></i> Zpět na novinky</Link>
        <article className="panel overflow-hidden">
          {images.length > 0 && (
            <div className="relative bg-muted">
              <img src={images[idx]} alt={row.title} className="w-full max-h-[480px] object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/70">
                    <i className='bx bx-chevron-left text-2xl'></i>
                  </button>
                  <button onClick={() => setIdx((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/70">
                    <i className='bx bx-chevron-right text-2xl'></i>
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setIdx(i)}
                        className={`w-2 h-2 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="p-6">
            <div className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("cs-CZ")}</div>
            <h1 className="font-display text-3xl font-bold text-primary uppercase mt-1">{row.title}</h1>
            <div className="mt-4">
              <FormattedText text={row.body} />
            </div>
          </div>
        </article>
      </div>
    </SiteLayout>
  );
}

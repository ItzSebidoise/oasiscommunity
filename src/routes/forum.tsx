import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forum")({
  head: () => ({ meta: [{ title: "Fórum — OasiGame" }] }),
  component: Forum,
});

type Cat = { id: string; section: string; slug: string; title: string; allow_topics: boolean; sort_order: number };

const SECTION_META: Record<string, { icon: string; color: string }> = {
  "Counter-Strike": { icon: "bxs-crosshair", color: "panel-header" },
  "TeamSpeak": { icon: "bxs-microphone", color: "panel-header-blue" },
  "Informace o webu": { icon: "bxs-info-circle", color: "panel-header" },
};

function Forum() {
  const [cats, setCats] = useState<Cat[]>([]);
  useEffect(() => {
    supabase.from("forum_categories").select("*").order("sort_order").then(({ data }) => setCats((data ?? []) as Cat[]));
  }, []);

  const sections = Array.from(new Set(cats.map((c) => c.section)));

  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {sections.map((sec) => {
            const meta = SECTION_META[sec] ?? { icon: "bxs-folder", color: "panel-header" };
            return (
              <section key={sec} className="panel overflow-hidden">
                <header className={meta.color}><i className={`bx ${meta.icon}`}></i> {sec}</header>
                <div className="bg-white divide-y">
                  {cats.filter((c) => c.section === sec).map((c) => (
                    <Link key={c.id} to="/forum/$slug" params={{ slug: c.slug }}
                      className="flex items-center justify-between p-4 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <i className='bx bxs-message-square-detail text-primary text-xl'></i>
                        <div>
                          <div className="font-bold">{c.title}</div>
                          {!c.allow_topics && <div className="text-xs text-muted-foreground">Pouze vzory — hráči nemohou přidávat témata</div>}
                        </div>
                      </div>
                      <i className='bx bx-chevron-right text-xl text-muted-foreground'></i>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

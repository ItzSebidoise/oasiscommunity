import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/server/$id")({
  head: ({ params }) => ({ meta: [{ title: `Server ${params.id} — OasiGame` }] }),
  component: Detail,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="panel p-8 text-center">
        <h1 className="text-2xl font-display font-bold">Server nenalezen</h1>
        <Link to="/servery" className="btn-brand mt-4 inline-flex">Zpět na servery</Link>
      </div>
    </SiteLayout>
  ),
});

const ICONS = { ts: "bxs-headphone", cs: "bxs-crosshair", discord: "bxl-discord-alt" } as const;

type Row = { id: string; type: keyof typeof ICONS; name: string; address: string };

function Detail() {
  const { id } = Route.useParams();
  const [server, setServer] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("server_settings").select("id, type, name, address").eq("id", id).maybeSingle()
      .then(({ data }) => { setServer(data as Row | null); setLoading(false); });
  }, [id]);

  if (loading) return <SiteLayout><div className="panel p-6">Načítám…</div></SiteLayout>;
  if (!server) { throw notFound(); }

  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto">
        <section className="panel overflow-hidden">
          <header className="panel-header text-lg">
            <i className={`bx ${ICONS[server.type] ?? "bxs-server"} text-2xl`}></i>
            {server.name}
          </header>
          <div className="p-6 space-y-4">
            <div>
              <div className="text-muted-foreground text-sm uppercase tracking-wider">IP adresa</div>
              <div className="font-mono text-primary text-xl">{server.address}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Informace o serveru</div>
              <p className="text-sm leading-relaxed">
                {server.type === "cs" && "Jailbreak mód s aktivními guardy, vlastní pluginy a féroví admini. VIP hráči dostávají menu s vlastními zbraněmi."}
                {server.type === "ts" && "TeamSpeak 3 server pro celou komunitu — vlastní kanály, kvalitní audio, 64 slotů."}
                {server.type === "discord" && "Oficiální Discord OasiGame — novinky, podpora, kanály pro každý server."}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Link to="/servery" className="btn-brand"><i className='bx bx-arrow-back'></i> Zpět</Link>
              {server.type === "discord" && (
                <a href={`https://${server.address}`} target="_blank" rel="noreferrer" className="btn-brand">
                  <i className='bx bxl-discord-alt'></i> Připojit se
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

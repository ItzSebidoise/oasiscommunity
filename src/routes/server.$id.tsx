import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { SERVERS } from "@/components/Servers";

export const Route = createFileRoute("/server/$id")({
  head: ({ params }) => ({ meta: [{ title: `Server ${params.id} — OasiGame` }] }),
  loader: ({ params }) => {
    const server = SERVERS.find((s) => s.id === params.id);
    if (!server) throw notFound();
    return { server };
  },
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

function Detail() {
  const { server } = Route.useLoaderData();
  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto">
        <section className="panel overflow-hidden">
          <header className="panel-header text-lg">
            <i className={`bx ${ICONS[server.type as keyof typeof ICONS]} text-2xl`}></i>
            {server.name}
          </header>
          <div className="p-6 space-y-4">
            <div>
              <div className="text-muted-foreground text-sm uppercase tracking-wider">IP adresa</div>
              <div className="font-mono text-primary text-xl">{server.ip}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Informace o serveru</div>
              <p className="text-sm leading-relaxed">
                {server.type === "cs" && "Jailbreak mód s aktivními guardy, vlastní pluginy a féroví admini. VIP hráči dostávají menu s vlastními zbraněmi."}
                {server.type === "ts" && "TeamSpeak 3 server pro celou komunitu — vlastní kanály, kvalitní audio, 64 slotů."}
                {server.type === "discord" && "Oficiální Discord OasiGame — novinky, podpora, kanály pro každý server."}
              </p>
              <a href="#" className="inline-block mt-3 text-primary hover:underline font-semibold">
                <i className='bx bx-book-open'></i> Pravidla serveru
              </a>
            </div>
            <div className="flex gap-3 pt-2">
              <Link to="/servery" className="btn-brand"><i className='bx bx-arrow-back'></i> Zpět</Link>
              {server.type === "discord" && (
                <a href={`https://${server.ip}`} target="_blank" rel="noreferrer" className="btn-brand">
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

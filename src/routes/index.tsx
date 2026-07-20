import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { ServersPanel } from "@/components/Servers";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <ServersPanel />

          <section className="panel overflow-hidden">
            <header className="panel-header-blue">
              <i className='bx bxs-news text-xl'></i>
              Vítej na OasiGame!
            </header>
            <div className="p-5 text-sm leading-relaxed space-y-2">
              <p>
                Vítej na <b className="text-primary">OasiGame</b> — českém herním portálu.
                Spravujeme <b>CS 1.6 Jailbreak</b>, <b>TeamSpeak</b> a <b>Discord</b> server.
              </p>
              <p className="text-muted-foreground">
                Připoj se ke komunitě, získej VIP a hraj s reálnými hráči — bez botů.
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <AuthCard />
        </aside>
      </div>
    </SiteLayout>
  );
}

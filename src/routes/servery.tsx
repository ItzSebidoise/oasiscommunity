import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { ServersPanel } from "@/components/Servers";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/servery")({
  head: () => ({ meta: [{ title: "Servery — OasiGame" }] }),
  component: Servery,
});

function Servery() {
  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <ServersPanel title="Přehled serverů" />
          <section className="panel overflow-hidden">
            <header className="panel-header"><i className='bx bxs-info-circle'></i> O našich serverech</header>
            <div className="p-5 text-sm space-y-2">
              <p>Naše servery jedou 24/7 na výkonném hardwaru od <b className="text-primary">Goodhost.cz</b>.</p>
              <p className="text-muted-foreground">Máme aktivní admin tým, pravidelné eventy a férovou hru.</p>
            </div>
          </section>
        </div>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

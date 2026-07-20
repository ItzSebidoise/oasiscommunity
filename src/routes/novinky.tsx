import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/novinky")({
  head: () => ({ meta: [{ title: "Novinky — OasiGame" }] }),
  component: Novinky,
});

function Novinky() {
  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <section className="panel overflow-hidden">
          <header className="panel-header"><i className='bx bxs-news'></i> Novinky</header>
          <div className="p-6 text-center text-muted-foreground">
            <i className='bx bx-time-five text-5xl text-primary'></i>
            <p className="mt-2">Novinky se právě připravují. Sleduj nás na Discordu!</p>
          </div>
        </section>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

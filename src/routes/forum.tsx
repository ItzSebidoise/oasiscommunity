import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/forum")({
  head: () => ({ meta: [{ title: "Fórum — OasiGame" }] }),
  component: Forum,
});

function Forum() {
  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <section className="panel overflow-hidden">
          <header className="panel-header"><i className='bx bxs-conversation'></i> Fórum</header>
          <div className="p-10 text-center text-muted-foreground">
            <i className='bx bx-message-square-detail text-5xl text-primary'></i>
            <p className="mt-3">Fórum se právě staví. Brzy tu vznikne diskuze pro celou komunitu.</p>
          </div>
        </section>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/kontakt")({
  head: () => ({ meta: [{ title: "Kontakt — OasiGame" }] }),
  component: Kontakt,
});

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="py-4 border-b border-dashed border-border last:border-b-0">
      <div className="text-muted-foreground text-sm">{label}</div>
      {href ? (
        <a href={href} className="text-primary font-semibold text-lg hover:underline">{value}</a>
      ) : (
        <div className="text-primary font-semibold text-lg">{value}</div>
      )}
    </div>
  );
}

function Kontakt() {
  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <section className="panel overflow-hidden">
          <header className="panel-header"><i className='bx bxs-envelope'></i> Kontakty</header>
          <div className="p-6">
            <Row label="Naše emailová adresa" value="OasiGame@seznam.cz" href="mailto:OasiGame@seznam.cz" />
            <Row label="Náš discord server" value="dsc.gg/oasiscom" href="https://dsc.gg/oasiscom" />
            <Row label="Provozovatel serverů" value="Goodhost.cz" href="https://goodhost.cz" />
          </div>
        </section>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/kontakt")({
  head: () => ({ meta: [{ title: "Kontakt — OasiGame" }] }),
  component: Kontakt,
});

type Credit = { id: string; nick: string; role: string; avatar_url: string | null };

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
  const [credits, setCredits] = useState<Credit[]>([]);
  useEffect(() => {
    supabase.from("credits").select("id, nick, role, avatar_url").order("sort_order")
      .then(({ data }) => setCredits((data ?? []) as Credit[]));
  }, []);

  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <section className="panel overflow-hidden">
            <header className="panel-header"><i className='bx bxs-envelope'></i> Kontakty</header>
            <div className="p-6">
              <Row label="Naše emailová adresa" value="OasiGame@seznam.cz" href="mailto:OasiGame@seznam.cz" />
              <Row label="Náš discord server" value="dsc.gg/oasiscom" href="https://dsc.gg/oasiscom" />
              <Row label="Provozovatel serverů" value="Goodhost.cz" href="https://goodhost.cz" />
            </div>
          </section>

          <section className="panel overflow-hidden">
            <header className="panel-header" style={{background:"linear-gradient(90deg,#a855f7,#6b21a8)"}}>
              <i className='bx bxs-heart'></i> Kredity
            </header>
            <div className="p-6 bg-white">
              <p className="text-muted-foreground text-sm mb-4">Speciální děkuji hráčům</p>
              <ul className="space-y-3">
                {credits.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 border-b border-dashed border-border last:border-b-0 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {c.avatar_url
                          ? <img src={c.avatar_url} alt={c.nick} className="w-full h-full object-cover" />
                          : <i className='bx bxs-user-circle text-2xl text-muted-foreground'></i>}
                      </div>
                      <span className="font-semibold text-primary truncate">{c.nick}</span>
                    </div>
                    <span className="text-sm text-muted-foreground italic text-right">| {c.role} |</span>
                  </li>
                ))}
                {credits.length === 0 && (
                  <li className="text-sm text-muted-foreground">Načítám…</li>
                )}
              </ul>
              <div className="mt-5 text-sm text-foreground/80 space-y-1">
                <p>Děkuji všem těmto lidem za pomoc s portálem.</p>
                <p>Jsme rádi, že si každý z těchto lidí na nás udělal čas :)</p>
                <p className="pt-2 font-semibold text-primary">Speciální děkuji &lt;3</p>
              </div>
            </div>
          </section>
        </div>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

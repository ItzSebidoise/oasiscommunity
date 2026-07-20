import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/vip")({
  head: () => ({ meta: [{ title: "VIP — OasiGame" }] }),
  component: Vip,
});

const END = new Date("2026-08-20T00:00:00").getTime();

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return { d, h, m, s };
}

function Cell({ v, label }: { v: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-gradient-to-b from-[var(--brand)] to-[var(--brand-dark)] text-white rounded-lg px-4 py-3 min-w-[70px] shadow-md">
      <span className="font-display text-3xl font-bold tabular-nums">{String(v).padStart(2, "0")}</span>
      <span className="text-xs uppercase tracking-wider opacity-90">{label}</span>
    </div>
  );
}

function Vip() {
  const { d, h, m, s } = useCountdown(END);
  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <section className="panel overflow-hidden">
          <header className="panel-header"><i className='bx bxs-star'></i> VIP výhody</header>
          <div className="p-6 text-center space-y-5">
            <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full font-semibold uppercase text-sm tracking-wider">
              <i className='bx bxs-gift'></i> Probíhá akce: Free VIP
            </div>
            <h2 className="text-2xl font-display font-bold">
              Free VIP od <span className="text-primary">30. 7.</span> do <span className="text-primary">20. 8.</span>
            </h2>
            <p className="text-muted-foreground">Zbývá do konce akce:</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Cell v={d} label="Dnů" />
              <Cell v={h} label="Hodin" />
              <Cell v={m} label="Minut" />
              <Cell v={s} label="Sekund" />
            </div>
            <p className="text-sm text-muted-foreground pt-3">
              Připoj se na server a napiš adminovi na Discordu pro aktivaci VIP.
            </p>
          </div>
        </section>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/admin-tym")({
  head: () => ({ meta: [{ title: "Admin-Tým — OasiGame" }] }),
  component: AdminTym,
});

type Member = {
  name: string;
  initials: string;
  role: string;
  icon: string;
  hue: string;
};

const VEDENI: Member[] = [
  { name: "Seb1k_Jk", initials: "S", role: "Majitel portálu", icon: "bxs-crown", hue: "text-yellow-400" },
  { name: "XxNamiyXx", initials: "N", role: "Vedení portálu", icon: "bxs-crown", hue: "text-yellow-300" },
];

const ADMINI: Member[] = [
  { name: "T3RM1N4T0R.exe", initials: "T", role: "Admin CS1.6 / Jailbreak", icon: "bxs-user-badge", hue: "text-primary" },
  { name: "BehaviØuRiaN", initials: "B", role: "Admin CS1.6 / Jailbreak", icon: "bxs-user-badge", hue: "text-primary" },
];

function Card({ m }: { m: Member }) {
  return (
    <div className="panel p-5 text-center">
      <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-white font-display text-4xl font-bold border-4 border-white shadow-lg">
        {m.initials}
      </div>
      <h3 className="mt-3 text-primary font-display font-bold uppercase">{m.name}</h3>
      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm font-semibold">
        <i className={`bx ${m.icon} ${m.hue} text-lg`}></i>
        {m.role}
      </div>
    </div>
  );
}

function AdminTym() {
  return (
    <SiteLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <section className="panel overflow-hidden">
            <header className="panel-header"><i className='bx bxs-crown'></i> Vedení portálu</header>
            <div className="p-5 grid sm:grid-cols-2 gap-4 bg-white">
              {VEDENI.map((m) => <Card key={m.name} m={m} />)}
            </div>
          </section>

          <section className="panel overflow-hidden">
            <header className="panel-header"><i className='bx bxs-shield'></i> Admini</header>
            <div className="p-5 grid sm:grid-cols-2 gap-4 bg-white">
              {ADMINI.map((m) => <Card key={m.name} m={m} />)}
            </div>
          </section>
        </div>
        <aside><AuthCard /></aside>
      </div>
    </SiteLayout>
  );
}

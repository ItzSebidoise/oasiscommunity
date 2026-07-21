import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { LEADERSHIP_ROLES, type AppRole } from "@/lib/roles";

const NAV = [
  { to: "/", label: "OasiGame" },
  { to: "/novinky", label: "Novinky" },
  { to: "/servery", label: "Servery" },
  { to: "/admin-tym", label: "Admin-Tým" },
  { to: "/forum", label: "Fórum" },
  { to: "/vip", label: "VIP" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const { session, profile, roles } = useSession();
  const isLeadership = roles.some((r) => LEADERSHIP_ROLES.includes(r as AppRole));

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-[oklch(0.2_0.02_260)] text-white">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-3 justify-between text-sm">
          <div className="flex items-center gap-2 font-display uppercase tracking-wider">
            <i className='bx bxs-joystick text-primary text-xl'></i>
            <span className="font-bold">OasiGame</span>
            <span className="text-white/50 hidden sm:inline">— česká herní komunita</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-brand !py-1.5">
              <i className='bx bx-play text-lg'></i> Začít hrát
            </button>
            {session && profile ? (
              <div className="flex items-center gap-2 text-white/90">
                <i className='bx bxs-user-circle text-primary'></i>
                <span className="font-bold">{profile.nick}</span>
                {isLeadership && (
                  <Link to="/admin" className="text-xs bg-primary/80 hover:bg-primary px-2 py-0.5 rounded font-bold uppercase">
                    Admin panel
                  </Link>
                )}
                <button onClick={() => supabase.auth.signOut()} className="text-white/60 hover:text-white text-xs">
                  <i className='bx bx-log-out'></i> Odhlásit
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 text-white/80">
                <i className='bx bxs-circle text-[oklch(0.62_0.19_145)] text-[8px] animate-pulse'></i>
                <span>Právě hraje na CS 1.6: <b className="text-white">14 hráčů</b></span>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="bg-gradient-to-b from-[var(--brand)] to-[var(--brand-dark)] shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <ul className="flex flex-wrap">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="block px-5 py-3 text-white font-display font-semibold uppercase tracking-wider text-sm hover:bg-black/20 transition-colors"
                  activeProps={{ className: "block px-5 py-3 text-white font-display font-semibold uppercase tracking-wider text-sm bg-black/25" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      <footer className="mt-10 bg-[oklch(0.18_0.02_260)] text-white/70 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-between gap-3 text-sm">
          <div>© {new Date().getFullYear()} OasiGame — všechna práva vyhrazena.</div>
          <div className="flex gap-4">
            <a href="https://dsc.gg/oasiscom" className="hover:text-white flex items-center gap-1"><i className='bx bxl-discord-alt'></i> Discord</a>
            <span>Provozovatel: <span className="text-primary">Goodhost.cz</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

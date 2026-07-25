import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset hesla — OasiGame" },
    { name: "description", content: "Nastavení nového hesla k účtu OasiGame." },
    { property: "og:title", content: "Reset hesla — OasiGame" },
    { property: "og:description", content: "Nastavení nového hesla k účtu OasiGame." },
  ]}),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery hash and fires PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit() {
    setErr(null);
    if (password.length < 6) { setErr("Heslo musí mít alespoň 6 znaků."); return; }
    if (password !== password2) { setErr("Hesla se neshodují."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setOk(true);
      setTimeout(() => nav({ to: "/" }), 2000);
    } catch (e: any) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  }

  return (
    <SiteLayout>
      <div className="max-w-md mx-auto">
        <section className="panel overflow-hidden">
          <header className="panel-header"><i className='bx bxs-lock'></i> Nastavit nové heslo</header>
          <div className="p-5 space-y-3">
            {!ready && <div className="text-sm text-muted-foreground">Ověřuji reset odkaz…</div>}
            {ready && !ok && (
              <>
                <div>
                  <div className="text-xs font-bold text-primary uppercase mb-1">Nové heslo</div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md" />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary uppercase mb-1">Potvrzení hesla</div>
                  <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md" />
                </div>
                {err && <div className="text-sm text-destructive">{err}</div>}
                <button onClick={submit} disabled={busy || !password || !password2}
                  className="btn-brand w-full justify-center disabled:opacity-50">
                  <i className='bx bx-save'></i> Uložit heslo
                </button>
              </>
            )}
            {ok && (
              <div className="text-sm text-[var(--success)]">
                <i className='bx bxs-check-circle'></i> Heslo bylo změněno. Přesměrovávám…
              </div>
            )}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

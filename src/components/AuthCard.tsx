import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { ROLE_META, type AppRole } from "@/lib/roles";
import { useServerFn } from "@tanstack/react-start";
import { registerAccount, emailForNick } from "@/lib/auth.functions";

function Field({ label, type = "text", value, onChange, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex rounded-md overflow-hidden border border-border bg-white">
      <span className="field-label">{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 bg-muted text-foreground outline-none text-sm min-w-0"
      />
    </div>
  );
}

export function AuthCard() {
  const { session, profile, roles } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const register = useServerFn(registerAccount);
  const lookup = useServerFn(emailForNick);

  async function handleLogin() {
    setErr(null); setBusy(true);
    try {
      const { email } = await lookup({ data: { nick } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: any) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  }
  async function handleRegister() {
    setErr(null);
    if (password !== password2) { setErr("Hesla se neshodují"); return; }
    setBusy(true);
    try {
      const { email } = await register({ data: { nick, password } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: any) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  }

  if (session && profile) {
    return (
      <section className="panel overflow-hidden">
        <header className="panel-header"><i className='bx bxs-user-circle text-xl'></i> Můj účet</header>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
              : <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">{profile.nick[0]}</div>}
            <div>
              <div className="font-display font-bold text-primary">{profile.nick}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.length === 0 && <span className="text-xs text-muted-foreground">Hráč</span>}
                {roles.map((r) => (
                  <span key={r} className={`text-[10px] font-bold uppercase ${ROLE_META[r as AppRole]?.className ?? ""}`}>
                    {ROLE_META[r as AppRole]?.label ?? r}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="btn-brand w-full justify-center">
            <i className='bx bx-log-out'></i> Odhlásit se
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden">
      <header className="panel-header">
        <i className='bx bxs-user-circle text-xl'></i>
        {mode === "login" ? "Přihlaš se!" : "Registrovat se"}
      </header>
      <div className="p-5 space-y-3">
        <h3 className="text-primary font-display font-bold text-lg uppercase">
          {mode === "login" ? "Přihlaš se" : "Registrovat se"}
        </h3>

        <Field label="Login:" value={nick} onChange={setNick} placeholder="Tvůj nick" />
        <Field label="Heslo:" type="password" value={password} onChange={setPassword} placeholder="Heslo" />
        {mode === "register" && (
          <Field label="Potvrdit:" type="password" value={password2} onChange={setPassword2} placeholder="Zopakuj heslo" />
        )}

        {err && <div className="text-xs text-destructive">{err}</div>}

        <p className="text-sm text-muted-foreground pt-1">
          {mode === "login" ? (
            <>Nemáš účet?{" "}<button onClick={() => setMode("register")} className="text-primary font-bold hover:underline">Zaregistruj se!</button></>
          ) : (
            <>Už máš účet?{" "}<button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">Přihlas se!</button></>
          )}
        </p>

        <button
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={busy || !nick || !password}
          className="btn-brand w-full justify-center disabled:opacity-50"
        >
          <i className={`bx ${mode === "login" ? "bxs-key" : "bxs-hammer"}`}></i>
          {mode === "login" ? "Přihlásit se" : "Zaregistrovat se"}
        </button>
      </div>
    </section>
  );
}

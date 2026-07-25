import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { ROLE_META, type AppRole } from "@/lib/roles";
import { useServerFn } from "@tanstack/react-start";
import { registerAccount, emailForNick, requestPasswordReset } from "@/lib/auth.functions";
import { updateMyProfile } from "@/lib/profile.functions";
import { uploadAvatar } from "@/lib/upload";
import { RichEditor } from "@/components/RichEditor";
import { FormattedText } from "@/lib/format-post";

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
  const { session, profile, roles, refresh } = useSession();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const register = useServerFn(registerAccount);
  const lookup = useServerFn(emailForNick);
  const resetReq = useServerFn(requestPasswordReset);

  async function handleLogin() {
    setErr(null); setOk(null); setBusy(true);
    try {
      const { email: e } = await lookup({ data: { nick } });
      const { error } = await supabase.auth.signInWithPassword({ email: e, password });
      if (error) throw error;
    } catch (e: any) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  }
  async function handleRegister() {
    setErr(null); setOk(null);
    if (password !== password2) { setErr("Hesla se neshodují"); return; }
    setBusy(true);
    try {
      await register({ data: { nick, password, email } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setOk("Registrace hotova. Na tvůj email jsme poslali potvrzovací zprávu.");
    } catch (e: any) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  }
  async function handleForgot() {
    setErr(null); setOk(null); setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { email: masked } = await resetReq({ data: { nick, redirectTo } });
      setOk(`Odkaz pro reset hesla jsme poslali na ${masked}.`);
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
              ? <img src={profile.avatar_url} className="w-14 h-14 rounded-full object-cover border-2 border-primary" />
              : <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold">{profile.nick[0]}</div>}
            <div className="min-w-0">
              <div className="font-display font-bold text-primary truncate">{profile.nick}</div>
              {profile.description && (
                <div className="text-xs mt-0.5"><FormattedText text={profile.description} /></div>
              )}
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
          <div className="flex gap-2">
            <button onClick={() => setEditing((v) => !v)} className="btn-brand flex-1 justify-center !py-1.5" style={{background:"linear-gradient(180deg,#6366f1,#3730a3)"}}>
              <i className='bx bx-edit'></i> {editing ? "Zavřít" : "Upravit profil"}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="btn-brand !py-1.5">
              <i className='bx bx-log-out'></i>
            </button>
          </div>
          {editing && <ProfileEditor onDone={() => { setEditing(false); refresh(); }} />}
        </div>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden">
      <header className="panel-header">
        <i className='bx bxs-user-circle text-xl'></i>
        {mode === "login" ? "Přihlaš se!" : mode === "register" ? "Registrovat se" : "Reset hesla"}
      </header>
      <div className="p-5 space-y-3">
        <h3 className="text-primary font-display font-bold text-lg uppercase">
          {mode === "login" ? "Přihlaš se" : mode === "register" ? "Registrovat se" : "Zapomenuté heslo"}
        </h3>

        <Field label="Login:" value={nick} onChange={setNick} placeholder="Tvůj nick" />
        {mode !== "forgot" && (
          <Field label="Heslo:" type="password" value={password} onChange={setPassword} placeholder="Heslo" />
        )}
        {mode === "register" && (
          <>
            <Field label="Email:" type="email" value={email} onChange={setEmail} placeholder="tvuj@email.cz" />
            <Field label="Potvrdit:" type="password" value={password2} onChange={setPassword2} placeholder="Zopakuj heslo" />
            <div className="text-[11px] text-muted-foreground">Email potřebujeme na potvrzení účtu a reset hesla.</div>
          </>
        )}

        {err && <div className="text-xs text-destructive">{err}</div>}
        {ok && <div className="text-xs text-[var(--success)]">{ok}</div>}

        <p className="text-sm text-muted-foreground pt-1">
          {mode === "login" && (
            <>Nemáš účet?{" "}<button onClick={() => { setMode("register"); setErr(null); setOk(null); }} className="text-primary font-bold hover:underline">Zaregistruj se!</button>{" · "}
            <button onClick={() => { setMode("forgot"); setErr(null); setOk(null); }} className="text-primary font-bold hover:underline">Zapomenuté heslo</button></>
          )}
          {mode === "register" && (
            <>Už máš účet?{" "}<button onClick={() => { setMode("login"); setErr(null); setOk(null); }} className="text-primary font-bold hover:underline">Přihlas se!</button></>
          )}
          {mode === "forgot" && (
            <><button onClick={() => { setMode("login"); setErr(null); setOk(null); }} className="text-primary font-bold hover:underline">← Zpět na přihlášení</button></>
          )}
        </p>

        <button
          onClick={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleForgot}
          disabled={busy || !nick || (mode !== "forgot" && !password) || (mode === "register" && !email)}
          className="btn-brand w-full justify-center disabled:opacity-50"
        >
          <i className={`bx ${mode === "login" ? "bxs-key" : mode === "register" ? "bxs-hammer" : "bxs-envelope"}`}></i>
          {mode === "login" ? "Přihlásit se" : mode === "register" ? "Zaregistrovat se" : "Poslat reset odkaz"}
        </button>
      </div>
    </section>
  );
}

function ProfileEditor({ onDone }: { onDone: () => void }) {
  const { profile, session } = useSession();
  const [desc, setDesc] = useState(profile?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const update = useServerFn(updateMyProfile);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !session?.user) return;
    setBusy(true); setErr(null);
    try {
      const url = await uploadAvatar(f, session.user.id);
      await update({ data: { avatarUrl: url } });
      onDone();
    } catch (e: any) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  }

  async function saveDesc() {
    setBusy(true); setErr(null);
    try { await update({ data: { description: desc } }); onDone(); }
    catch (e: any) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="border-t border-border pt-3 space-y-3">
      <div>
        <div className="text-xs font-bold text-primary uppercase mb-1">Profilová fotka (max 2 MB)</div>
        <input type="file" accept="image/*" onChange={handleFile} disabled={busy}
          className="text-xs w-full file:mr-2 file:btn-brand file:!py-1 file:!px-2 file:!text-xs" />
      </div>
      <div>
        <div className="text-xs font-bold text-primary uppercase mb-1">Popisek (max 32 znaků)</div>
        <RichEditor value={desc} onChange={setDesc} rows={2} placeholder="Krátký popisek" maxVisibleChars={32} />
      </div>
      {err && <div className="text-xs text-destructive">{err}</div>}
      <button onClick={saveDesc} disabled={busy} className="btn-brand w-full justify-center !py-1.5">
        <i className='bx bx-save'></i> Uložit popisek
      </button>

      <TwoFactorSection />
    </div>
  );
}

function TwoFactorSection() {
  const [factors, setFactors] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) setErr(error.message);
    else setFactors(data?.totp ?? []);
    setLoading(false);
  }
  useState(() => { load(); return undefined; });

  async function startEnroll() {
    setErr(null); setOk(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` });
    if (error) { setErr(error.message); return; }
    setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }
  async function confirmEnroll() {
    if (!enrolling) return;
    setErr(null);
    const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId });
    if (cErr) { setErr(cErr.message); return; }
    const { error: vErr } = await supabase.auth.mfa.verify({ factorId: enrolling.factorId, challengeId: ch.id, code });
    if (vErr) { setErr(vErr.message); return; }
    setOk("2FA aktivováno."); setEnrolling(null); setCode("");
    await load();
  }
  async function disable(factorId: string) {
    if (!confirm("Vypnout 2FA?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) setErr(error.message); else { setOk("2FA vypnuto."); await load(); }
  }

  const verified = (factors ?? []).filter((f: any) => f.status === "verified");

  return (
    <div className="border-t border-border pt-3 space-y-2">
      <div className="text-xs font-bold text-primary uppercase">Dvoufaktorové ověření (Authenticator)</div>
      {loading && <div className="text-xs text-muted-foreground">Načítám…</div>}
      {err && <div className="text-xs text-destructive">{err}</div>}
      {ok && <div className="text-xs text-[var(--success)]">{ok}</div>}
      {!enrolling && verified.length === 0 && (
        <button onClick={startEnroll} className="btn-brand !py-1.5 w-full justify-center" style={{background:"linear-gradient(180deg,#059669,#065f46)"}}>
          <i className='bx bxs-shield'></i> Zapnout 2FA
        </button>
      )}
      {!enrolling && verified.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--success)]"><i className='bx bxs-check-shield'></i> 2FA je aktivní</span>
          <button onClick={() => disable(verified[0].id)} className="text-xs text-destructive hover:underline">Vypnout</button>
        </div>
      )}
      {enrolling && (
        <div className="space-y-2 border border-border rounded p-3 bg-muted/30">
          <div className="text-xs">1. Naskenuj QR kód v Google Authenticatoru / Authy / 1Password:</div>
          <img src={enrolling.qr} alt="QR" className="mx-auto bg-white p-2 rounded" />
          <div className="text-[10px] text-center text-muted-foreground break-all">nebo ručně: <code>{enrolling.secret}</code></div>
          <div className="text-xs">2. Zadej 6místný kód z aplikace:</div>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456" className="w-full px-2 py-1.5 border border-border rounded text-center font-mono" />
          <div className="flex gap-2">
            <button onClick={confirmEnroll} disabled={code.length !== 6} className="btn-brand !py-1.5 flex-1 justify-center disabled:opacity-50">Potvrdit</button>
            <button onClick={() => setEnrolling(null)} className="btn-brand !py-1.5" style={{background:"linear-gradient(180deg,#6b7280,#374151)"}}>Zrušit</button>
          </div>
        </div>
      )}
    </div>
  );
}

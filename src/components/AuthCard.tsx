import { useState } from "react";

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <div className="flex rounded-md overflow-hidden border border-border bg-white">
      <span className="field-label">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 bg-muted text-foreground outline-none text-sm min-w-0"
      />
    </div>
  );
}

export function AuthCard() {
  const [mode, setMode] = useState<"login" | "register">("login");

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

        {mode === "login" ? (
          <>
            <Field label="Login:" placeholder="Tvůj nick" />
            <Field label="Heslo:" type="password" placeholder="Heslo" />
            <p className="text-sm text-muted-foreground pt-2">
              Nemáš účet?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-primary font-bold hover:underline"
              >
                Zaregistruj se k nám!
              </button>
            </p>
            <button className="btn-brand w-full justify-center">
              <i className='bx bxs-key'></i> Přihlásit se
            </button>
          </>
        ) : (
          <>
            <Field label="Email:" type="email" placeholder="tvuj@email.cz" />
            <Field label="Login:" placeholder="Tvůj nick" />
            <Field label="Heslo:" type="password" placeholder="Heslo" />
            <Field label="Potvrdit heslo:" type="password" placeholder="Zopakuj heslo" />
            <p className="text-sm text-muted-foreground pt-2">
              Už máš účet?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-primary font-bold hover:underline"
              >
                Přihlas se!
              </button>
            </p>
            <button className="btn-brand w-full justify-center">
              <i className='bx bxs-hammer'></i> Zaregistrovat se
            </button>
          </>
        )}
      </div>
    </section>
  );
}

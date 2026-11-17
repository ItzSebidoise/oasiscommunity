import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getFullBackup } from "@/lib/backup.functions";

const README = (date: string) => `# Záloha portálu OasiGame (${date})

Tento ZIP obsahuje VŠE potřebné pro obnovu webu jinde (Cloudflare Pages/Workers, Vercel, VPS).
Celý tento soubor můžeš vložit do Codexu / ChatGPT a říct: "Pomoz mi obnovit tento web podle README_ZALOHA.md".

## Obsah
- \`source/\` – kompletní zdrojový kód (React + TanStack Start + Tailwind, TypeScript).
- \`source/supabase/migrations/\` a \`source/drizzle/migrations/\` – SQL struktura databáze (tabulky, práva, funkce).
- \`data/*.json\` – obsah všech tabulek (profily, role, fórum, novinky, kredity, servery, VIP).
- \`data/users.json\` – seznam účtů (id, email). Hesla NEJSOU součástí (z bezpečnostních důvodů) – uživatelé si po obnově dají "Zapomenuté heslo".
- \`storage/<bucket>/...\` – nahrané obrázky (avatary, fotky novinek, ikony serverů).

## Postup obnovy (pro Codex)
1. Založ zdarma projekt na https://supabase.com (databáze + přihlašování + úložiště).
2. V Supabase → SQL Editor spusť postupně všechny soubory z \`source/supabase/migrations/\` (podle názvu, od nejstaršího), potom \`source/drizzle/migrations/\`.
3. Vytvoř uživatele: pro každý záznam v \`data/users.json\` zavolej Admin API \`auth.admin.createUser({ id?, email, email_confirm: true })\` se STEJNÝM id (Codex napíše malý Node skript se service role klíčem). Stejné id je nutné, protože na něj odkazují profily, role a příspěvky.
4. Nahraj data tabulek v tomto pořadí: profiles, user_roles, forum_categories, forum_topics, forum_posts, news, credits, server_settings, vip_settings (upsert z JSON souborů, service role klíč).
5. Ve Storage vytvoř buckety \`avatars\`, \`news\`, \`server-icons\` a nahraj do nich soubory ze složky \`storage/\` se stejnými cestami. Odkazy na obrázky v datech je pak potřeba přegenerovat (podepsané URL) – Codex to umí skriptem.
6. Ve složce \`source/\` vytvoř soubor \`.env\`:
   \`\`\`
   VITE_SUPABASE_URL=https://<tvuj-projekt>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key>
   VITE_SUPABASE_PROJECT_ID=<tvuj-projekt>
   SUPABASE_URL=https://<tvuj-projekt>.supabase.co
   SUPABASE_PUBLISHABLE_KEY=<anon/publishable key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key – jen na serveru!>
   \`\`\`
7. Spusť: \`npm install\` (nebo \`bun install\`), \`npm run dev\` pro test, \`npm run build\` pro produkci.
8. Nasazení: web je TanStack Start s cílem Cloudflare Workers – \`npx wrangler deploy\` (Codex doplní wrangler config), případně Vercel/Node adaptér. Proměnné z kroku 6 nastav i v hostingu.
9. V Supabase → Authentication → URL Configuration nastav svou doménu (kvůli potvrzovacím emailům a resetu hesla).

## Poznámky
- Soubory \`src/integrations/supabase/*\` jsou připojení k databázi – fungují s novým projektem po nastavení .env.
- Pokud něco nepůjde, pošli Codexu chybovou hlášku spolu s tímto README.
`;

export function BackupDownload() {
  const fetchBackup = useServerFn(getFullBackup);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      setStatus("Načítám kód a data…");
      const b = JSON.parse(await fetchBackup()) as { createdAt: string; source: Record<string, string>; data: Record<string, unknown[]>; users: unknown[]; files: Array<{ bucket: string; path: string; url: string }> };
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const date = b.createdAt.slice(0, 10);
      zip.file("README_ZALOHA.md", README(date));
      for (const [p, c] of Object.entries(b.source)) zip.file(`source/${p}`, c);
      for (const [t, rows] of Object.entries(b.data)) zip.file(`data/${t}.json`, JSON.stringify(rows, null, 2));
      zip.file("data/users.json", JSON.stringify(b.users, null, 2));
      let i = 0;
      for (const f of b.files) {
        i++; setStatus(`Stahuji obrázky ${i}/${b.files.length}…`);
        try { const r = await fetch(f.url); if (r.ok) zip.file(`storage/${f.bucket}/${f.path}`, await r.blob()); } catch { /* skip */ }
      }
      setStatus("Balím ZIP…");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `oasigame-zaloha-${date}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setStatus("Hotovo — záloha stažena.");
    } catch (e: any) {
      setStatus("Chyba: " + (e?.message ?? e));
    } finally { setBusy(false); }
  }

  return (
    <section className="panel overflow-hidden">
      <header className="panel-header"><i className='bx bxs-download'></i> Záloha celého webu (pouze Majitel)</header>
      <div className="p-5 bg-card text-sm space-y-3">
        <p>Jedním klikem stáhneš ZIP s aktuálním <b>zdrojovým kódem</b>, <b>strukturou databáze</b>, <b>všemi daty</b> (účty, role, fórum, novinky, kredity, servery, VIP) a <b>nahranými obrázky</b>. Záloha je vždy aktuální v okamžiku stažení.</p>
        <p className="text-muted-foreground">Uvnitř je soubor <code>README_ZALOHA.md</code> s podrobným postupem obnovy — stačí ho dát Codexu a ten ti s přesunem pomůže. Hesla uživatelů se z bezpečnostních důvodů nezálohují (po obnově si je obnoví přes „Zapomenuté heslo“).</p>
        <button className="btn-brand disabled:opacity-50" disabled={busy} onClick={run}>{busy ? "Připravuji…" : "Stáhnout zálohu (ZIP)"}</button>
        {status && <p className="text-xs">{status}</p>}
      </div>
    </section>
  );
}

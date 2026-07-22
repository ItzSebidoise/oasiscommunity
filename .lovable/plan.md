Velký rozsah — rozdělím to do bloků. Prosím potvrď nebo uprav priority.

## 1. Fórum — otevírání sekcí
- Zkontroluji `src/routes/forum.$slug.tsx` — pravděpodobně chybí handler/route match nebo RLS na `forum_topics` blokuje SELECT. Dohledám a opravím.

## 2. Databáze / migrace (jedna migrace)
- **Nové role:** `portal_owner`, `portal_leadership` v enumu `app_role` + do `LEADERSHIP_ROLES`.
- **Storage bucket `avatars`** (public) pro upload profilovek (limit 2 MB, jen image/*).
- **Storage bucket `news`** (public) pro obrázky novinek.
- **Tabulka `news`**: title, body (rich text s tagy), cover_url, images (text[]), author_id, published_at + RLS (public read, leadership write) + GRANTs.
- **Tabulka `vip_settings`** (single-row): free_vip_ends_at timestamptz + RLS (public read, portal leadership update).
- **Profiles**: přidat `description text` (max 32 znaků check trigger nebo validace v aplikaci).
- **Security fixy:**
  - `is_staff(_user_id)` přepíšu tak, aby kontroloval konkrétní staff role (`cs16_admin`, `ts3_admin` + všechny leadership/owner). Tím se opraví politika "staff or author updates topic".
  - `has_role`, `is_staff`, `is_leadership` — REVOKE EXECUTE FROM PUBLIC, GRANT EXECUTE TO authenticated only (jsou volané jen z RLS/serveru, ale linter je vidí přes exposed API). Alternativně přesunu do neexposed schématu — jednodušší je REVOKE FROM anon.

## 3. Admin panel (`/admin`)
- Přidat sekce **Nová role** (portal_owner/leadership) do selectorů.
- **Nahrávání profilovky:** file input → upload do bucketu `avatars` (path: `{userId}/{timestamp}.ext`), uloží veřejnou URL do profiles. Client-side check: max 2 MB, obrázek. (Crop necháme na později — teď jen resize preview.)
- **Vytvořit novinku:** formulář title + rich body + upload 1–N obrázků (první = cover). Rich-text toolbar (viz níže).
- **Free VIP nastavení** (jen `portal_owner`/`portal_leadership`): date-time picker → uloží do `vip_settings`. Default `2026-08-30`.

## 4. Rich-text toolbar
- Nový komponent `RichTextArea.tsx` — textarea + toolbar (Bold, Italic, Underline, Strike, barvy). Při kliknutí obalí označený text tagy `{bold}...{/bold}` atd. Reuse v: novinky (admin), fórum posty (topic reply + nové téma), user description.
- Přidám tag `{strike}` do `format-post.tsx`.

## 5. Uživatelský panel
- Přihlášený uživatel: v `AuthCard` sekci "Můj účet" tlačítko **Upravit profil** → dialog s: upload avatar (do `avatars/{uid}/...`), description (max 32 znaků, rich toolbar). Uloží se do profiles.
- V navigaci (`SiteLayout`) místo červené ikony hráče: pokud přihlášen a má avatar → `<img>` (24×24 kruh); jinak fallback ikona.
- Ve fóru u příspěvků: vlevo avatar + nick + description (formátovaný), vpravo tělo. Upravím `forum.$slug.$topicId.tsx`.

## 6. Novinky
- `/novinky`: grid karet (cover, title, výřez textu, "Zobrazit více") → route `/novinky/$id` s galerií (slider obrázků), plným tělem.
- Na homepage nechám současný stav (nebo přidám 3 nejnovější — nechám na později).

## 7. Servery — obrázky + Cs1.6 přejmenování + Discord online
- Nahraju `discord.png`, `ts3.jpg`, `cs16.png` jako Lovable assety (přes CLI, bez background removal). Použiji v `Servers.tsx` a `server.$id.tsx`.
- Přejmenuji "Jailbreak" → "Cs1.6 Jailbreak".
- Discord: přidám do server karty počet členů online. Bez Discord API klíče použiji statický placeholder / fake counter (nebo pokud přidáš webhook/widget ID, přečtu `https://discord.com/api/guilds/{id}/widget.json`). **Pro první iteraci použiji statický údaj** — potvrď, jestli máš guild ID s enabled widgetem.

## 8. Countdown VIP
- `vip.tsx` bude číst `vip_settings.free_vip_ends_at` (default 30. 8. 2026 23:59) místo natvrdo napsaného datumu.

## Technical section
- Storage upload z klienta: `supabase.storage.from('avatars').upload(...)` s RLS policy `authenticated can INSERT own folder`.
- Rich-text: čistý tag-obalovač, žádný contenteditable (jednodušší, konzistentní s existujícím parserem).
- Security definer funkce: `REVOKE EXECUTE ON FUNCTION public.has_role/is_staff/is_leadership FROM PUBLIC, anon;` + `GRANT EXECUTE TO authenticated;`. RLS je používá jako SECURITY DEFINER — pořád funguje protože engine je volá interně.

## Otevřené otázky
1. **Discord online count** — máš enabled widget na serveru + guild ID? Jinak dám statický "N/A" nebo random placeholder.
2. **Crop avatarů** — stačí jen limit velikosti (2 MB, doporučené 256×256), nebo chceš skutečný crop UI? (crop = víc práce, doporučuji fázi 2).
3. **Description limit 32** — jen plain text 32 znaků, nebo 32 znaků včetně formátovacích tagů `{bold}...{/bold}`? (doporučuji 32 zobrazovaných znaků, tagy se nepočítají).

Napiš OK / úpravy a jedu na to.

## Co postavím

### 1. Backend (Lovable Cloud)
Zapnu Lovable Cloud (databáze + auth). Bez toho nejde login ani ukládat témata/role.

### 2. Auth + účty
- Email/heslo login + register (napojím stávající `AuthCard`).
- Nick + avatar URL v tabulce `profiles`.
- Předvytvořím dva účty pomocí seed migrace:
  - **Seb1k_Jk** / `IamSebidoiseF120` → role `owner` (Cs1.6 Majitel Jailbreak)
  - **XxNamiyXx** / `Nigger12345XDXD` → role `leadership` (Cs1.6 Vedení Jailbreak)
  - (emaily vyrobím jako `nick@oasigame.local`, přihlašuje se nickem přes lookup)

### 3. Role
Tabulky `user_roles` + enum `app_role`. Role:
- `cs16_owner` (Cs1.6 Majitel Jailbreak) — červeně
- `cs16_leadership` (Cs1.6 Vedení Jailbreak) — fialově
- `cs16_admin` (Cs1.6 Admin Jailbreak) — fialově
- `ts3_owner` (TS3 Majitel) — červeně
- `ts3_leadership` (TS3 Vedení) — fialově
- `ts3_admin` (TS3 Admin) — fialově

`has_role()` security-definer funkce. Uživatel může mít víc rolí najednou (jak jsi psal – Terminator může mít CS1.6 Admin + TS3 Admin).

### 4. Admin-Tým stránka
Načte lidi z DB co mají nějakou roli. Zobrazí avatar + všechny jejich role s barvičkami. Předem naseeduju:
- Seb1k (seb1k.png) — Cs1.6 Majitel
- Namiy (Namiy.png) — Cs1.6 Vedení
- T3RM1N4T0R (terminator.png) — Cs1.6 Admin
- Icyy (icyy.png) — přidám jako Cs1.6 Admin (dej vědět jinak)
Obrázky nahraju přes lovable-assets.

### 5. Admin Panel (`/admin`)
Vidí jen `*_owner` a `*_leadership`. Umí:
- Vyhledat účet (podle nicku).
- Vidět aktuální role.
- **Přidat roli** (dropdown se všemi rolemi).
- **Odebrat roli**.
- **Nastavit profilový obrázek** (URL).

### 6. Fórum (`/forum`)
Hlavní stránka: 3 sekce jako červené panely:
- **Counter-Strike** — 4 tvoje kategorie
- **TeamSpeak** — 5 tvoje kategorie
- **Informace o webu** — read-only sekce se vzory

Klik na kategorii → detail sekce se seznamem témat. U `Informace o webu` nejde tvořit téma (jen vzory).

Nahoře v sekci tlačítko **Nové téma** (přihlášený uživatel). Pro Vedení/Majitele navíc **Vytvořit vzor** — vzory se v sekci zobrazí nad běžnými tématy v samostatném boxu „Vzory".

Detail tématu: příspěvky + odpověď. Admini/Vedení/Majitel: **Locknout / Odemknout** téma. Zamčené = nikdo neodpovídá.

### 7. Formátovací kódy v příspěvcích
Parser na tyto tagy (case-insensitive):
- Barvy: `{red}`, `{darkred}`, `{blue}`, `{darkblue}`, `{green}`, `{darkgreen}`, `{yellow}`, `{orange}`, `{purple}`, `{pink}`, `{gray}`, `{black}`, `{white}` — barví text až do `{/}` nebo konce řádku
- Styl: `{bold}...{/bold}`, `{italic}...{/italic}`, `{underline}...{/underline}`

Seznam vypíšu i v sekci **Informace o webu → Barvy psaní** jako vzor.

### 8. Databázové tabulky
- `profiles(id, nick, avatar_url)`
- `user_roles(user_id, role)`
- `forum_categories(id, section, slug, title, order, allow_topics)` — seed s tvými kategoriemi
- `forum_topics(id, category_id, author_id, title, body, is_template, is_locked, created_at)`
- `forum_posts(id, topic_id, author_id, body, created_at)`

RLS: veřejné čtení fóra; psaní jen přihlášený; template/lock/role management jen podle role přes `has_role()`.

### 9. Ostatní
- Sign-in indikátor v navbaru (jméno + odhlásit).
- Cache-invalidation přes `onAuthStateChange` v `__root.tsx`.

---

**Poznámky:**
- Login přes nick funguje interně tak, že se pošle `${nick}@oasigame.local` do Supabase. Uživatel vidí jen políčko „Login".
- Hesla, která jsi poslal v chatu, uložím do seedu. Doporučuju si je po prvním přihlášení změnit.
- Pokud chceš víc barevných tagů nebo jiné kategorie, řekni před schválením.

Můžu začít?
import { createServerFn } from "@tanstack/react-start";

// Public + idempotent. Creates the initial staff accounts if missing.
export const ensureSeedAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const SEED = [
    {
      nick: "Seb1k_Jk",
      email: "seb1k_jk@oasigame.local",
      password: "IamSebidoiseF120",
      role: "cs16_owner" as const,
      avatar: "https://cdn.lovable.dev/oasi/seb1k.png",
    },
    {
      nick: "XxNamiyXx",
      email: "xxnamiyxx@oasigame.local",
      password: "Nigger12345XDXD",
      role: "cs16_leadership" as const,
      avatar: null,
    },
  ];

  const results: Array<{ nick: string; status: string }> = [];

  for (const s of SEED) {
    // Skip if profile with this nick exists
    const { data: existing } = await supabaseAdmin
      .from("profiles").select("id").eq("nick", s.nick).maybeSingle();
    if (existing) { results.push({ nick: s.nick, status: "exists" }); continue; }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: s.email, password: s.password, email_confirm: true,
      user_metadata: { nick: s.nick },
    });
    if (createErr || !created.user) { results.push({ nick: s.nick, status: `err:${createErr?.message}` }); continue; }

    await supabaseAdmin.from("profiles").insert({ id: created.user.id, nick: s.nick, avatar_url: s.avatar });
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: s.role });
    results.push({ nick: s.nick, status: "created" });
  }
  return { results };
});

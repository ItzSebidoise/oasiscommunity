import { createServerFn } from "@tanstack/react-start";

// Public + idempotent. Creates the initial staff accounts if missing.
export const ensureSeedAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const SEED: Array<{ nick: string; email: string; password: string; roles: string[]; avatar: string }> = [
    {
      nick: "Seb1k_Jk",
      email: "seb1k_jk@oasigame.local",
      password: "IamSebidoiseF120",
      roles: ["portal_owner", "cs16_owner"],
      avatar: "/__l5e/assets-v1/ec155e24-6bd2-4091-9cab-ae4b6ec432d3/seb1k.png",
    },
    {
      nick: "XxNamiyXx",
      email: "xxnamiyxx@oasigame.local",
      password: "Nigger12345XDXD",
      roles: ["portal_leadership", "cs16_leadership"],
      avatar: "/__l5e/assets-v1/21bdef35-4d07-4e70-97d5-98a24338d463/Namiy.png",
    },
    {
      nick: "T3RM1N4T0R.exe",
      email: "t3rm1n4t0r@oasigame.local",
      password: crypto.randomUUID() + "!Aa1",
      roles: ["cs16_admin"],
      avatar: "/__l5e/assets-v1/72a09cf5-f2ba-45da-872a-07dfd789aaf8/terminator.png",
    },
    {
      nick: "Icyy",
      email: "icyy@oasigame.local",
      password: crypto.randomUUID() + "!Aa1",
      roles: ["cs16_admin"],
      avatar: "/__l5e/assets-v1/895fdc06-c097-41b0-80c3-fbad7384dcdd/icyy.png",
    },
  ];

  const results: Array<{ nick: string; status: string }> = [];

  for (const s of SEED) {
    const { data: existing } = await supabaseAdmin
      .from("profiles").select("id").eq("nick", s.nick).maybeSingle();
    let uid = existing?.id;
    if (!uid) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: s.email, password: s.password, email_confirm: true,
        user_metadata: { nick: s.nick },
      });
      if (createErr || !created.user) { results.push({ nick: s.nick, status: `err:${createErr?.message}` }); continue; }
      uid = created.user.id;
      await supabaseAdmin.from("profiles").insert({ id: uid, nick: s.nick, avatar_url: s.avatar });
      results.push({ nick: s.nick, status: "created" });
    } else {
      results.push({ nick: s.nick, status: "exists" });
    }
    for (const role of s.roles) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: uid, role: role as any }, { onConflict: "user_id,role" });
    }
  }
  return { results };
});

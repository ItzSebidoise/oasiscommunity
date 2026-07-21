import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const nickSchema = z.string().trim().min(2).max(30).regex(/^[a-zA-Z0-9_\-.]+$/);

export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((d: { nick: string; password: string }) =>
    z.object({ nick: nickSchema, password: z.string().min(6).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("nick", data.nick).maybeSingle();
    if (existing) throw new Error("Tento nick je již zabraný.");
    const email = `${data.nick.toLowerCase()}@oasigame.local`;
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: data.password, email_confirm: true, user_metadata: { nick: data.nick },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Registrace selhala");
    await supabaseAdmin.from("profiles").insert({ id: created.user.id, nick: data.nick });
    return { email };
  });

// Look up email by nick so client can sign in with password
export const emailForNick = createServerFn({ method: "POST" })
  .inputValidator((d: { nick: string }) => z.object({ nick: nickSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("profiles").select("id, nick").eq("nick", data.nick).maybeSingle();
    if (!p) throw new Error("Účet nenalezen");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(p.id);
    if (!u.user?.email) throw new Error("Účet nenalezen");
    return { email: u.user.email };
  });

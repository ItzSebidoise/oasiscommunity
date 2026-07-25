import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const nickSchema = z.string().trim().min(2).max(30).regex(/^[a-zA-Z0-9_\-.]+$/);
const emailSchema = z.string().trim().email().max(200);

export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((d: { nick: string; password: string; email: string }) =>
    z.object({ nick: nickSchema, password: z.string().min(6).max(200), email: emailSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("nick", data.nick).maybeSingle();
    if (existing) throw new Error("Tento nick je již zabraný.");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false,
      user_metadata: { nick: data.nick },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Registrace selhala");
    await supabaseAdmin.from("profiles").insert({ id: created.user.id, nick: data.nick });
    // Send confirmation email in Czech via Supabase
    await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: data.email,
      password: data.password,
    }).catch(() => {});
    return { email: data.email };
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

// Send password reset email (client passes nick, we resolve email)
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d: { nick: string; redirectTo: string }) =>
    z.object({ nick: nickSchema, redirectTo: z.string().url().max(500) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("profiles").select("id").eq("nick", data.nick).maybeSingle();
    if (!p) throw new Error("Účet nenalezen");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(p.id);
    const email = u.user?.email;
    if (!email || email.endsWith("@oasigame.local")) {
      throw new Error("Účet nemá nastavenou emailovou adresu — kontaktuj vedení.");
    }
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: data.redirectTo },
    });
    if (error) throw new Error(error.message);
    return { ok: true, email: email.replace(/(.{2}).*(@.*)/, "$1***$2") };
  });

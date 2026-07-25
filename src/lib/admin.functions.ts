import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ALL_ROLES, LEADERSHIP_ROLES, type AppRole } from "./roles";

async function assertLeadership(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role as AppRole);
  if (!roles.some((r: AppRole) => LEADERSHIP_ROLES.includes(r))) throw new Error("Nemáš oprávnění.");
}

export const searchUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string }) => z.object({ q: z.string().trim().max(50) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertLeadership(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = data.q;
    let query = supabaseAdmin.from("profiles").select("id, nick, avatar_url").order("nick").limit(20);
    if (q) query = query.ilike("nick", `%${q}%`);
    const { data: profiles, error } = await query;
    if (error) throw new Error(error.message);
    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = ids.length
      ? await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids)
      : { data: [] as any[] };
    // Fetch emails for these users so admin can see who needs a real email
    const emails: Record<string, string> = {};
    for (const id of ids) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
      if (u.user?.email) emails[id] = u.user.email;
    }
    return (profiles ?? []).map((p) => ({
      ...p,
      email: emails[p.id] ?? null,
      roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role as AppRole),
    }));
  });

export const addUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: AppRole }) =>
    z.object({ userId: z.string().uuid(), role: z.enum(ALL_ROLES as [string, ...string[]]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertLeadership(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: data.role as AppRole });
    return { ok: true };
  });

export const removeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: AppRole }) =>
    z.object({ userId: z.string().uuid(), role: z.enum(ALL_ROLES as [string, ...string[]]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertLeadership(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role as AppRole);
    return { ok: true };
  });

export const setUserAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; avatarUrl: string }) =>
    z.object({ userId: z.string().uuid(), avatarUrl: z.string().url().max(500).or(z.literal("")) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertLeadership(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({ avatar_url: data.avatarUrl || null }).eq("id", data.userId);
    return { ok: true };
  });

export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertLeadership(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Nemůžeš smazat sám sebe.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Set / change email for a user (used to give existing admin accounts a real address)
export const setUserEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; email: string; confirm?: boolean }) =>
    z.object({
      userId: z.string().uuid(),
      email: z.string().trim().email().max(200),
      confirm: z.boolean().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    await assertLeadership(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      email: data.email,
      email_confirm: data.confirm ?? true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

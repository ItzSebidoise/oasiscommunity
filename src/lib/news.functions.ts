import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PORTAL_LEADERSHIP_ROLES } from "./roles";

async function assertPortalLeadership(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.some((r: string) => (PORTAL_LEADERSHIP_ROLES as string[]).includes(r))) {
    throw new Error("Nemáš oprávnění vytvářet novinky.");
  }
}

export const createNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; body: string; images: string[] }) =>
    z.object({
      title: z.string().trim().min(3).max(160),
      body: z.string().trim().min(1).max(20000),
      images: z.array(z.string().url().or(z.string().startsWith("/"))).max(20),
    }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPortalLeadership(context.supabase, context.userId);
    const { data: row, error } = await context.supabase.from("news").insert({
      title: data.title, body: data.body,
      cover_url: data.images[0] ?? null,
      images: data.images,
      author_id: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPortalLeadership(context.supabase, context.userId);
    const { error } = await context.supabase.from("news").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

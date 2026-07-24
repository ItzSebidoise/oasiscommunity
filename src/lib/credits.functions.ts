import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const upsertCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; nick: string; role: string; avatarUrl?: string; sortOrder?: number }) =>
    z.object({
      id: z.string().uuid().optional(),
      nick: z.string().trim().min(1).max(50),
      role: z.string().trim().min(1).max(200),
      avatarUrl: z.string().url().max(1000).or(z.literal("")).optional(),
      sortOrder: z.number().int().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const payload: any = {
      nick: data.nick,
      role: data.role,
      avatar_url: data.avatarUrl || null,
      sort_order: data.sortOrder ?? 0,
    };
    if (data.id) payload.id = data.id;
    const { error } = await (context.supabase.from("credits") as any).upsert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("credits").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

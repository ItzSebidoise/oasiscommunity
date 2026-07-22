import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PORTAL_LEADERSHIP_ROLES } from "./roles";

export const setVipEnd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { endsAt: string }) =>
    z.object({ endsAt: z.string().min(10) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rs } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const roles = (rs ?? []).map((r: any) => r.role);
    if (!roles.some((r: string) => (PORTAL_LEADERSHIP_ROLES as string[]).includes(r))) {
      throw new Error("Nemáš oprávnění.");
    }
    const { error } = await context.supabase.from("vip_settings")
      .update({ free_vip_ends_at: data.endsAt }).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

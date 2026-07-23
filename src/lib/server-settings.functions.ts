import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PORTAL_LEADERSHIP_ROLES } from "./roles";

async function assertPortalLeadership(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.some((r: string) => (PORTAL_LEADERSHIP_ROLES as string[]).includes(r))) {
    throw new Error("Nemáš oprávnění měnit nastavení serverů.");
  }
}

export const updateServerSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string; address?: string; iconUrl?: string | null; online?: boolean;
    players?: number; maxPlayers?: number | null; map?: string | null; name?: string;
  }) => z.object({
    id: z.string().min(1).max(50),
    address: z.string().max(200).optional(),
    iconUrl: z.string().url().max(1000).nullable().optional(),
    online: z.boolean().optional(),
    players: z.number().int().min(0).max(9999).optional(),
    maxPlayers: z.number().int().min(0).max(9999).nullable().optional(),
    map: z.string().max(80).nullable().optional(),
    name: z.string().max(80).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPortalLeadership(context.supabase, context.userId);
    const patch: Record<string, unknown> = {};
    if (data.address !== undefined) patch.address = data.address;
    if (data.iconUrl !== undefined) patch.icon_url = data.iconUrl;
    if (data.online !== undefined) patch.online = data.online;
    if (data.players !== undefined) patch.players = data.players;
    if (data.maxPlayers !== undefined) patch.max_players = data.maxPlayers;
    if (data.map !== undefined) patch.map = data.map;
    if (data.name !== undefined) patch.name = data.name;
    const { error } = await context.supabase.from("server_settings").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

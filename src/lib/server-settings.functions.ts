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
    battlemetricsId?: string | null;
  }) => z.object({
    id: z.string().min(1).max(50),
    address: z.string().max(200).optional(),
    iconUrl: z.string().url().max(1000).nullable().optional(),
    online: z.boolean().optional(),
    players: z.number().int().min(0).max(9999).optional(),
    maxPlayers: z.number().int().min(0).max(9999).nullable().optional(),
    map: z.string().max(80).nullable().optional(),
    name: z.string().max(80).optional(),
    battlemetricsId: z.string().max(50).nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPortalLeadership(context.supabase, context.userId);
    const patch: Record<string, any> = {};
    if (data.address !== undefined) patch.address = data.address;
    if (data.iconUrl !== undefined) patch.icon_url = data.iconUrl;
    if (data.online !== undefined) patch.online = data.online;
    if (data.players !== undefined) patch.players = data.players;
    if (data.maxPlayers !== undefined) patch.max_players = data.maxPlayers;
    if (data.map !== undefined) patch.map = data.map;
    if (data.name !== undefined) patch.name = data.name;
    if (data.battlemetricsId !== undefined) patch.battlemetrics_id = data.battlemetricsId;
    const { error } = await (context.supabase.from("server_settings") as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Fetch live stats from BattleMetrics and persist (map, players online, max players, online status)
export const refreshServerFromBattleMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().min(1).max(50) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPortalLeadership(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: rErr } = await supabaseAdmin
      .from("server_settings")
      .select("id, battlemetrics_id")
      .eq("id", data.id)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    const bmId = (row as any)?.battlemetrics_id as string | null;
    if (!bmId) throw new Error("Není nastavené BattleMetrics ID.");
    const res = await fetch(`https://api.battlemetrics.com/servers/${encodeURIComponent(bmId)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`BattleMetrics ${res.status}: ${body.slice(0, 200)}`);
    }
    const j = await res.json() as any;
    const a = j?.data?.attributes ?? {};
    const patch: Record<string, any> = {
      online: a.status === "online",
      players: typeof a.players === "number" ? a.players : 0,
      map: a.details?.map ?? a.map ?? null,
    };
    if (typeof a.maxPlayers === "number") patch.max_players = a.maxPlayers;
    const { error: uErr } = await supabaseAdmin.from("server_settings").update(patch).eq("id", data.id);
    if (uErr) throw new Error(uErr.message);
    return { ok: true, ...patch };
  });

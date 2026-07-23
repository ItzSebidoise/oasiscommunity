import { createServerFn } from "@tanstack/react-start";

// Public read-only staff listing (no raw user_roles exposure).
export const listStaff = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
  const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
  if (!ids.length) return [] as Array<{ id: string; nick: string; avatar_url: string | null; roles: string[] }>;
  const { data: profs } = await supabaseAdmin.from("profiles").select("id, nick, avatar_url").in("id", ids);
  return (profs ?? []).map((p: any) => ({
    id: p.id,
    nick: p.nick,
    avatar_url: p.avatar_url,
    roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
  }));
});

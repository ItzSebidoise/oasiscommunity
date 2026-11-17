import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TABLES = ["profiles", "user_roles", "forum_categories", "forum_topics", "forum_posts", "news", "credits", "server_settings", "vip_settings"] as const;
const BUCKETS = ["avatars", "news", "server-icons"] as const;

// Owner-only full backup: source code, all table data, user list and links to stored files.
export const getFullBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rs } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (!(rs ?? []).some((r: any) => r.role === "portal_owner")) throw new Error("Pouze Majitel Portálu.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getSourceFiles } = await import("./backup-sources.server");

    const data: Record<string, unknown[]> = {};
    for (const t of TABLES) {
      const { data: rows, error } = await (supabaseAdmin.from(t) as any).select("*");
      if (error) throw new Error(`${t}: ${error.message}`);
      data[t] = rows ?? [];
    }
    const users: Array<{ id: string; email: string | null; created_at: string; confirmed: boolean }> = [];
    for (let page = 1; page < 50; page++) {
      const { data: u, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      users.push(...u.users.map((x) => ({ id: x.id, email: x.email ?? null, created_at: x.created_at, confirmed: !!x.email_confirmed_at })));
      if (u.users.length < 1000) break;
    }
    const files: Array<{ bucket: string; path: string; url: string }> = [];
    for (const b of BUCKETS) {
      const { data: top } = await supabaseAdmin.storage.from(b).list("", { limit: 1000 });
      for (const dir of top ?? []) {
        const entries = dir.id ? [{ name: "", full: dir.name }] : ((await supabaseAdmin.storage.from(b).list(dir.name, { limit: 1000 })).data ?? []).map((f) => ({ name: f.name, full: `${dir.name}/${f.name}` }));
        for (const e of entries) {
          const { data: s } = await supabaseAdmin.storage.from(b).createSignedUrl(e.full, 60 * 60);
          if (s?.signedUrl) files.push({ bucket: b, path: e.full, url: s.signedUrl });
        }
      }
    }
    return JSON.stringify({ createdAt: new Date().toISOString(), source: getSourceFiles(), data, users, files });
  });

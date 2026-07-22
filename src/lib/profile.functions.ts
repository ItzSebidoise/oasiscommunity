import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripTags } from "./format-post";

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { avatarUrl?: string | null; description?: string | null }) =>
    z.object({
      avatarUrl: z.string().max(2000).nullable().optional(),
      description: z.string().max(300).nullable().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: Record<string, any> = {};
    if (data.avatarUrl !== undefined) patch.avatar_url = data.avatarUrl || null;
    if (data.description !== undefined) {
      const visible = stripTags(data.description ?? "");
      if (visible.length > 32) throw new Error("Popisek je max 32 znaků (bez formátovacích tagů).");
      patch.description = data.description || null;
    }
    const { error } = await context.supabase.from("profiles").update(patch).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

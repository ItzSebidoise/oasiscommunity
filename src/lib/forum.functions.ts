import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { categoryId: string; title: string; body: string; isTemplate?: boolean }) =>
    z.object({
      categoryId: z.string().uuid(),
      title: z.string().trim().min(3).max(120),
      body: z.string().trim().min(1).max(10000),
      isTemplate: z.boolean().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase.from("forum_topics").insert({
      category_id: data.categoryId, title: data.title, body: data.body,
      is_template: !!data.isTemplate, author_id: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { topicId: string; body: string }) =>
    z.object({ topicId: z.string().uuid(), body: z.string().trim().min(1).max(10000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("forum_posts").insert({
      topic_id: data.topicId, body: data.body, author_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleTopicLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { topicId: string; locked: boolean }) =>
    z.object({ topicId: z.string().uuid(), locked: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    // Only staff (any role) allowed
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (!roles || roles.length === 0) throw new Error("Nemáš oprávnění.");
    const { error } = await context.supabase.from("forum_topics").update({ is_locked: data.locked }).eq("id", data.topicId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

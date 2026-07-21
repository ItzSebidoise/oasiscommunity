import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type Profile = { id: string; nick: string; avatar_url: string | null };
export type Roles = string[];

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Roles>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) { setProfile(null); setRoles([]); return; }
    const uid = session.user.id;
    supabase.from("profiles").select("id, nick, avatar_url").eq("id", uid).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
    supabase.from("user_roles").select("role").eq("user_id", uid)
      .then(({ data }) => setRoles((data ?? []).map((r: any) => r.role)));
  }, [session?.user?.id]);

  return { session, profile, roles, ready };
}

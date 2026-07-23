import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import discordAsset from "@/assets/discord.png.asset.json";
import cs16Asset from "@/assets/cs16.png.asset.json";
import ts3Asset from "@/assets/ts3.jpg.asset.json";

export type ServerType = "ts" | "cs" | "discord";

export interface ServerInfo {
  id: string;
  type: ServerType;
  name: string;
  ip: string;
  players?: string;
  maxPlayers?: string;
  map?: string;
  online: boolean;
  ipColor?: "red" | "blue";
  icon_url?: string | null;
}

const FALLBACK_IMAGES: Record<ServerType, string> = {
  ts: ts3Asset.url,
  cs: cs16Asset.url,
  discord: discordAsset.url,
};

const IMG_BG: Record<ServerType, string> = {
  ts: "bg-[oklch(0.25_0.06_260)]",
  cs: "bg-[oklch(0.2_0.02_260)]",
  discord: "bg-transparent",
};

function iconFor(s: ServerInfo) {
  return s.icon_url || FALLBACK_IMAGES[s.type];
}

export function ServerRow({ server }: { server: ServerInfo }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b last:border-b-0 border-border hover:bg-muted/50 transition-colors">
      <div className={`w-10 h-10 rounded-md overflow-hidden flex items-center justify-center shrink-0 ${IMG_BG[server.type]}`}>
        <img src={iconFor(server)} alt={server.name} className="w-full h-full object-contain p-1" />
      </div>
      <div className="flex-1 min-w-[160px]">
        <div className="font-display font-bold uppercase text-sm">{server.name}</div>
        {server.type === "discord" ? (
          <a href={`https://${server.ip}`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline">
            {server.ip}
          </a>
        ) : (
          <div className={`text-sm font-mono ${server.ipColor === "blue" ? "text-[oklch(0.55_0.18_245)]" : "text-primary"}`}>
            {server.ip}
          </div>
        )}
      </div>
      <div className="text-sm min-w-[90px] text-center">
        {server.online ? (
          <span>
            <span className="text-[var(--success)] font-bold">{server.players}</span>
            {server.maxPlayers && <span className="text-muted-foreground">/{server.maxPlayers}</span>}
            <span className="text-muted-foreground text-xs ml-1">hráčů</span>
          </span>
        ) : (
          <span className="text-primary font-semibold">Offline</span>
        )}
      </div>
      {server.map && (
        <div className="text-sm text-muted-foreground min-w-[90px]">{server.map}</div>
      )}
      <Link
        to="/server/$id"
        params={{ id: server.id }}
        className="btn-brand !py-1.5 !px-3 text-xs"
      >
        Detail serveru
      </Link>
    </div>
  );
}

type DbRow = {
  id: string; type: ServerType; name: string; address: string; icon_url: string | null;
  players: number; max_players: number | null; map: string | null; online: boolean; sort_order: number;
};

function mapRow(r: DbRow): ServerInfo {
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    ip: r.address,
    players: String(r.players),
    maxPlayers: r.max_players != null ? String(r.max_players) : undefined,
    map: r.map ?? undefined,
    online: r.online,
    ipColor: r.type === "cs" ? "red" : r.type === "ts" ? "blue" : undefined,
    icon_url: r.icon_url,
  };
}

export function useServers(): ServerInfo[] {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  useEffect(() => {
    supabase.from("server_settings").select("*").order("sort_order").then(({ data }) => {
      setServers(((data ?? []) as DbRow[]).map(mapRow));
    });
  }, []);
  return servers;
}

export function ServersPanel({ title = "Naše herní servery!" }: { title?: string }) {
  const servers = useServers();
  return (
    <section className="panel overflow-hidden">
      <header className="panel-header-blue">
        <i className='bx bxs-server text-xl'></i>
        {title}
      </header>
      <div className="bg-white">
        {servers.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">Načítám servery…</div>}
        {servers.map((s) => <ServerRow key={s.id} server={s} />)}
      </div>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  link?: string;
}

const IMAGES: Record<ServerType, string> = {
  ts: ts3Asset.url,
  cs: cs16Asset.url,
  discord: discordAsset.url,
};

const IMG_BG: Record<ServerType, string> = {
  ts: "bg-[oklch(0.25_0.06_260)]",
  cs: "bg-[oklch(0.2_0.02_260)]",
  discord: "bg-transparent",
};

export function ServerRow({ server }: { server: ServerInfo }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b last:border-b-0 border-border hover:bg-muted/50 transition-colors">
      <div className={`w-10 h-10 rounded-md overflow-hidden flex items-center justify-center shrink-0 ${IMG_BG[server.type]}`}>
        <img src={IMAGES[server.type]} alt={server.name} className="w-full h-full object-contain p-1" />
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

// Pseudo-random but stable-ish "online" count for Discord (until a real widget is wired up)
function useDiscordOnline() {
  const [n, setN] = useState(42);
  useEffect(() => {
    const tick = () => setN(30 + Math.floor(Math.random() * 40));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);
  return n;
}

export const BASE_SERVERS: ServerInfo[] = [
  {
    id: "ts",
    type: "ts",
    name: "TeamSpeak Server",
    ip: "ts.oasigame.cz",
    players: "8",
    maxPlayers: "64",
    online: true,
    ipColor: "blue",
  },
  {
    id: "jailbreak",
    type: "cs",
    name: "Cs1.6 Jailbreak",
    ip: "89.163.144.10:27015",
    players: "14",
    maxPlayers: "32",
    map: "jail_oasis",
    online: true,
    ipColor: "red",
  },
  {
    id: "discord",
    type: "discord",
    name: "Discord Server",
    ip: "dsc.gg/oasiscom",
    online: true,
    maxPlayers: undefined,
  },
];

export function useServers(): ServerInfo[] {
  const discordOnline = useDiscordOnline();
  return BASE_SERVERS.map((s) =>
    s.type === "discord" ? { ...s, players: String(discordOnline) } : s
  );
}

// Legacy static export for routes that need it in loaders
export const SERVERS = BASE_SERVERS.map((s) =>
  s.type === "discord" ? { ...s, players: "42" } : s
);

export function ServersPanel({ title = "Naše herní servery!" }: { title?: string }) {
  const servers = useServers();
  return (
    <section className="panel overflow-hidden">
      <header className="panel-header-blue">
        <i className='bx bxs-server text-xl'></i>
        {title}
      </header>
      <div className="bg-white">
        {servers.map((s) => <ServerRow key={s.id} server={s} />)}
      </div>
    </section>
  );
}

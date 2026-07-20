import { Link } from "@tanstack/react-router";

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

const ICONS: Record<ServerType, string> = {
  ts: "bxs-headphone",
  cs: "bxs-crosshair",
  discord: "bxl-discord-alt",
};

const ICON_COLORS: Record<ServerType, string> = {
  ts: "text-[oklch(0.55_0.18_245)]",
  cs: "text-[var(--brand)]",
  discord: "text-[oklch(0.55_0.18_285)]",
};

export function ServerRow({ server }: { server: ServerInfo }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b last:border-b-0 border-border hover:bg-muted/50 transition-colors">
      <i className={`bx ${ICONS[server.type]} text-3xl ${ICON_COLORS[server.type]}`}></i>
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
          server.type === "discord" ? (
            <span className="text-[var(--success)] font-semibold">Online</span>
          ) : (
            <span>
              <span className="text-[var(--success)] font-bold">{server.players}</span>
              <span className="text-muted-foreground">/{server.maxPlayers}</span>
            </span>
          )
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

export const SERVERS: ServerInfo[] = [
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
    name: "Jailbreak Server",
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
  },
];

export function ServersPanel({ title = "Naše herní servery!" }: { title?: string }) {
  return (
    <section className="panel overflow-hidden">
      <header className="panel-header-blue">
        <i className='bx bxs-server text-xl'></i>
        {title}
      </header>
      <div className="bg-white">
        {SERVERS.map((s) => <ServerRow key={s.id} server={s} />)}
      </div>
    </section>
  );
}

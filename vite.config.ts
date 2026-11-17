// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";
import path from "node:path";

// Snapshot of project source files for the owner backup download (read at build/dev time).
const BACKUP_DIRS = ["src", "public", "supabase/migrations", "drizzle/migrations"];
const BACKUP_ROOT_FILES = ["package.json", "bun.lock", "vite.config.ts", "tsconfig.json", "components.json", "eslint.config.js", "bunfig.toml", "AGENTS.md", "drizzle.config.ts", "supabase/config.toml", ".gitignore"];
const TEXT_EXT = /\.(ts|tsx|js|mjs|css|json|md|sql|toml|txt|svg|html)$/;
function collectSources(root: string) {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (TEXT_EXT.test(e.name)) out[path.relative(root, full)] = fs.readFileSync(full, "utf8");
    }
  };
  BACKUP_DIRS.forEach((d) => walk(path.join(root, d)));
  for (const f of BACKUP_ROOT_FILES) { const p = path.join(root, f); if (fs.existsSync(p)) out[f] = fs.readFileSync(p, "utf8"); }
  return out;
}
const backupSources = {
  name: "oasigame-backup-sources",
  resolveId(id: string) { return id === "virtual:backup-sources" ? "\0virtual:backup-sources" : null; },
  load(id: string) {
    if (id !== "\0virtual:backup-sources") return null;
    const b64 = Buffer.from(JSON.stringify(collectSources(process.cwd())), "utf8").toString("base64");
    return `export default ${JSON.stringify(b64)};`;
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: { plugins: [backupSources] },
});

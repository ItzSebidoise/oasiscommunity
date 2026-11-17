// Server-only: project source snapshot (base64 JSON) provided by the vite plugin in vite.config.ts.
// @ts-expect-error virtual module
import encoded from "virtual:backup-sources";

export function getSourceFiles(): Record<string, string> {
  const bin = atob(encoded as string);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

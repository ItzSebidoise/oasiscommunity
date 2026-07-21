import type { ReactNode } from "react";

const COLORS: Record<string, string> = {
  red: "#ef4444", darkred: "#7f1d1d",
  blue: "#3b82f6", darkblue: "#1e3a8a",
  green: "#22c55e", darkgreen: "#14532d",
  yellow: "#eab308", orange: "#f97316",
  purple: "#a855f7", pink: "#ec4899",
  gray: "#6b7280", black: "#000000", white: "#ffffff",
};

export const AVAILABLE_TAGS = {
  colors: Object.keys(COLORS),
  styles: ["bold", "italic", "underline"] as const,
};

type Tag = { kind: "color"; value: string } | { kind: "style"; value: "bold" | "italic" | "underline" };

function styleFor(stack: Tag[]): React.CSSProperties {
  const s: React.CSSProperties = {};
  for (const t of stack) {
    if (t.kind === "color") s.color = t.value;
    if (t.kind === "style" && t.value === "bold") s.fontWeight = 700;
    if (t.kind === "style" && t.value === "italic") s.fontStyle = "italic";
    if (t.kind === "style" && t.value === "underline") s.textDecoration = "underline";
  }
  return s;
}

export function formatPost(text: string): ReactNode {
  const re = /\{(\/?)([a-zA-Z]+)\}/g;
  const stack: Tag[] = [];
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  const push = (chunk: string) => {
    if (!chunk) return;
    const st = styleFor(stack);
    out.push(<span key={key++} style={st}>{chunk}</span>);
  };
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    push(text.slice(last, m.index));
    last = re.lastIndex;
    const closing = m[1] === "/";
    const name = m[2].toLowerCase();
    if (closing) {
      const idx = [...stack].reverse().findIndex(
        (t) => (t.kind === "color" && (name === "" || name === t.value || COLORS[name] === t.value)) ||
               (t.kind === "style" && t.value === name)
      );
      if (idx !== -1) stack.splice(stack.length - 1 - idx, 1);
    } else if (COLORS[name]) {
      stack.push({ kind: "color", value: COLORS[name] });
    } else if (name === "bold" || name === "italic" || name === "underline") {
      stack.push({ kind: "style", value: name });
    } else {
      // unknown tag, print literally
      push(m[0]);
    }
  }
  push(text.slice(last));
  return <>{out.map((n, i) => <span key={i}>{n}</span>)}</>;
}

export function FormattedText({ text }: { text: string }) {
  return <div className="whitespace-pre-wrap break-words">{formatPost(text)}</div>;
}

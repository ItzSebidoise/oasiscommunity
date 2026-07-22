import { useRef, useState } from "react";
import { AVAILABLE_TAGS, COLOR_MAP, FormattedText, stripTags } from "@/lib/format-post";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  showPreview?: boolean;
  maxVisibleChars?: number;
  className?: string;
}

export function RichEditor({ value, onChange, placeholder, rows = 5, showPreview = true, maxVisibleChars, className }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function wrap(tag: string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.slice(0, start);
    const sel = value.slice(start, end) || "text";
    const after = value.slice(end);
    const next = `${before}{${tag}}${sel}{/${tag}}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursorStart = start + tag.length + 2;
      ta.setSelectionRange(cursorStart, cursorStart + sel.length);
    });
  }

  const visibleLen = stripTags(value).length;
  const overLimit = maxVisibleChars != null && visibleLen > maxVisibleChars;

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <div className="flex flex-wrap gap-1 items-center border border-border bg-muted rounded-md p-1.5">
        <ToolBtn onClick={() => wrap("bold")} title="Tučně"><b>B</b></ToolBtn>
        <ToolBtn onClick={() => wrap("italic")} title="Kurzíva"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => wrap("underline")} title="Podtržení"><u>U</u></ToolBtn>
        <ToolBtn onClick={() => wrap("strike")} title="Přeškrtnutí"><s>S</s></ToolBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <div className="relative">
          <ToolBtn onClick={() => setPickerOpen((v) => !v)} title="Barva">
            <i className='bx bxs-palette'></i>
          </ToolBtn>
          {pickerOpen && (
            <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-border rounded-md p-2 shadow-lg grid grid-cols-7 gap-1">
              {AVAILABLE_TAGS.colors.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => { wrap(c); setPickerOpen(false); }}
                  title={c}
                  className="w-6 h-6 rounded border border-border"
                  style={{ background: COLOR_MAP[c] }}
                />
              ))}
            </div>
          )}
        </div>
        {maxVisibleChars != null && (
          <span className={`ml-auto text-xs ${overLimit ? "text-destructive font-bold" : "text-muted-foreground"}`}>
            {visibleLen}/{maxVisibleChars}
          </span>
        )}
      </div>
      <textarea
        ref={ref} value={value} onChange={(e) => onChange(e.target.value)}
        rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 border border-border rounded-md bg-white font-mono text-sm"
      />
      {showPreview && value && (
        <div className="border border-border rounded-md p-3 bg-muted">
          <div className="text-xs text-muted-foreground mb-1">Náhled:</div>
          <FormattedText text={value} />
        </div>
      )}
    </div>
  );
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-primary hover:text-white border border-border rounded text-sm transition-colors">
      {children}
    </button>
  );
}

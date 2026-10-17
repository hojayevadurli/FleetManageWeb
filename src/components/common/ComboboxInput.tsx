import { useMemo, useRef, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  id?: string;
}

// A text input that also offers a dropdown of suggestions - like a <datalist>, but without
// its quirk where the dropdown won't reopen once the value already matches a suggestion
// exactly (Chrome suppresses it until you edit the text). Typing any custom value is still
// allowed; this only helps you pick from the list.
const ComboboxInput = ({ value, onChange, suggestions, placeholder, className, id }: Props) => {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // Opening the dropdown (via focus/click) always shows the full list, even if the
  // current value already matches a suggestion exactly - otherwise you can't switch to
  // a different option without clearing the field first. Filtering only kicks in once
  // the user actually types to narrow things down.
  const [filterActive, setFilterActive] = useState(false);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!filterActive || !q) return suggestions;
    return suggestions.filter(s => s.toLowerCase().includes(q));
  }, [value, suggestions, filterActive]);

  return (
    <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          id={id}
          className={cn("h-10 bg-white border-slate-200", className)}
          value={value}
          placeholder={placeholder}
          onChange={e => { onChange(e.target.value); setFilterActive(true); }}
          onFocus={() => { setFilterActive(false); setOpen(true); }}
          autoComplete="off"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="p-1"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        {/* Nested inside a Dialog, the dialog's scroll-lock swallows native wheel-to-scroll
            on anything it doesn't manage, even though dragging the scrollbar thumb (not a
            wheel event) still works - that mismatch is exactly this bug. Manually driving
            scrollTop from the wheel delta sidesteps relying on native wheel scrolling. */}
        <div
          ref={listRef}
          className="max-h-60 overflow-y-auto"
          onWheel={(e) => {
            if (listRef.current) listRef.current.scrollTop += e.deltaY;
          }}
        >
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // keep input focused so click registers before blur
              onClick={() => { onChange(s); setFilterActive(false); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100",
                s === value ? "text-blue-600 font-semibold bg-blue-50" : "text-slate-700"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ComboboxInput;

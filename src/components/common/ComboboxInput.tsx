import { useMemo, useRef, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
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
    // PopoverTrigger already toggles open/closed on click by itself (reading the live
    // controlled `open` value each time, so it's never stale) - we must NOT also force
    // it open from onFocus, since focus fires before click on the same gesture and the
    // two competed: onFocus set it open, then Trigger's own click handler toggled it
    // straight back closed. Typing still opens it via onChange below; this just stops
    // double-driving the open state on a plain click.
    <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
      {/* The wrapping div here is purely for positioning the chevron overlay - PopoverTrigger
          still wraps the Input directly (asChild merges trigger props onto it unchanged). */}
      <div className="relative">
        <PopoverTrigger asChild>
          <Input
            id={id}
            className={cn("h-10 bg-white border-slate-200 pr-8", className)}
            value={value}
            placeholder={placeholder}
            onChange={e => { onChange(e.target.value); setFilterActive(true); setOpen(true); }}
            onFocus={() => setFilterActive(false)}
            autoComplete="off"
          />
        </PopoverTrigger>
        {/* Decorative only (pointer-events-none) - signals this is a pick-from-list field,
            not plain free text, even though typing a custom value still works. */}
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
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

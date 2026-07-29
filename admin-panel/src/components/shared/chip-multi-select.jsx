import { cn } from "@/lib/utils";

export function ChipMultiSelect({ options, value = [], onChange }) {
  const opts = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  const toggle = (v) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((o) => {
        const active = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

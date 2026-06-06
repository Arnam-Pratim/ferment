import { Star } from "lucide-react";

export function StarRating({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const interactive = !!onChange;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const cls = filled ? "fill-accent text-accent" : "text-muted-foreground/40";
        const Wrap = interactive ? "button" : "span";
        return (
          <Wrap
            key={n}
            {...(interactive
              ? { type: "button" as const, onClick: () => onChange?.(n), "aria-label": `Rate ${n}` }
              : {})}
            className={interactive ? "transition-transform hover:scale-110" : ""}
          >
            <Star style={{ width: size, height: size }} className={cls} />
          </Wrap>
        );
      })}
    </div>
  );
}

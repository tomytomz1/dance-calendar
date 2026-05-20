import { cn } from "@/lib/utils";
import { getStyleChipClasses } from "@/lib/dance-style-colors";

interface StyleBadgeProps {
  style: string;
  className?: string;
}

export function StyleBadge({ style, className }: StyleBadgeProps) {
  const { badge } = getStyleChipClasses(style);
  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
        badge,
        className
      )}
    >
      {style}
    </span>
  );
}

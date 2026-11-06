import { cn } from "@/lib/utils";
import { getStyleChipClasses } from "@/lib/dance-style-colors";

interface StyleBadgeProps {
  style: string;
  className?: string;
}

export function StyleBadge({ style, className }: StyleBadgeProps) {
  // Solid chip colours read well on the dark brand surfaces (the pastel
  // `badge` set was designed for the old light theme).
  const { chip } = getStyleChipClasses(style);
  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full font-semibold shrink-0",
        chip,
        className
      )}
    >
      {style}
    </span>
  );
}

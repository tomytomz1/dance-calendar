interface EventCountBannerProps {
  count: number;
  label?: string;
}

export function EventCountBanner({
  count,
  label = "upcoming dance events across Michigan",
}: EventCountBannerProps) {
  if (count <= 0) return null;

  return (
    <p className="text-sm font-medium text-primary bg-primary/10 rounded-lg px-3 py-2 inline-block">
      {count} {label}
    </p>
  );
}

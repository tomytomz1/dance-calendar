export function buildGoogleMapsUrl(options: {
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}): string {
  if (
    options.latitude != null &&
    options.longitude != null &&
    !Number.isNaN(options.latitude) &&
    !Number.isNaN(options.longitude)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${options.latitude},${options.longitude}`;
  }
  const query = encodeURIComponent(
    `${options.address}, ${options.city}, Michigan`
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

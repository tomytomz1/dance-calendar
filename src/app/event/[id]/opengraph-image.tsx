import { ImageResponse } from "next/og";
import { formatEventDateForMeta, normalizeCityName } from "@/lib/seo";
import { getApprovedEventByIdOrSlug, resolveEventOccurrence } from "@/lib/event-detail";
import { formatInSiteTimeZone } from "@/lib/timezone";

export const alt = "Dance event";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventOpenGraphImage({ params }: Props) {
  const { id: idOrSlug } = await params;
  const event = await getApprovedEventByIdOrSlug(idOrSlug);

  if (!event) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0D101B 0%, #27192E 62%, #553045 100%)",
            color: "#FFF1E5",
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: 6,
            fontFamily: "system-ui",
          }}
        >
          MICHIGAN DANCE LIFE
        </div>
      ),
      { ...size }
    );
  }

  const { start } = resolveEventOccurrence(event);
  const dateLabel = `${formatEventDateForMeta(start)} · ${formatInSiteTimeZone(start, "h:mm a")}`;
  const styles = event.danceStyles.slice(0, 4).join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0D101B 0%, #27192E 62%, #553045 100%)",
          color: "#FFF1E5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#F46157", letterSpacing: 5 }}>
          MICHIGAN DANCE LIFE
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              marginBottom: 24,
              maxHeight: 210,
              overflow: "hidden",
            }}
          >
            {event.title}
          </div>
          <div style={{ width: 160, height: 7, borderRadius: 10, background: "#F46157", marginBottom: 24 }} />
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, marginBottom: 10 }}>{dateLabel}</div>
          <div style={{ display: "flex", fontSize: 28, opacity: 0.9 }}>
            {event.venue} · {normalizeCityName(event.city)}, MI
          </div>
          {styles ? (
            <div style={{ display: "flex", fontSize: 24, marginTop: 16, color: "#FFB3AD" }}>{styles}</div>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}

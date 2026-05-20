import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatEventDateForMeta } from "@/lib/seo";

export const alt = "Dance event";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventOpenGraphImage({ params }: Props) {
  const { id: idOrSlug } = await params;

  const rows = await prisma.$queryRaw<
    {
      title: string;
      venue: string;
      city: string;
      startTime: Date;
      danceStyles: string[];
    }[]
  >`SELECT "title", "venue", "city", "startTime", "danceStyles"
    FROM "Event"
    WHERE ("id" = ${idOrSlug} OR "slug" = ${idOrSlug})
      AND "status" = 'APPROVED'
    LIMIT 1`;

  const event = rows[0];

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
            background: "#5b21b6",
            color: "white",
            fontSize: 48,
            fontFamily: "system-ui",
          }}
        >
          MichiganDance.Life
        </div>
      ),
      { ...size }
    );
  }

  const dateLabel = formatEventDateForMeta(new Date(event.startTime));
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
          padding: 56,
          background: "linear-gradient(160deg, #4c1d95 0%, #6d28d9 45%, #8b5cf6 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.9 }}>MichiganDance.Life</div>
        <div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: 20,
              maxHeight: 220,
              overflow: "hidden",
            }}
          >
            {event.title}
          </div>
          <div style={{ fontSize: 30, marginBottom: 12 }}>{dateLabel}</div>
          <div style={{ fontSize: 26, opacity: 0.95 }}>
            {event.venue} · {event.city}, MI
          </div>
          {styles ? (
            <div style={{ fontSize: 22, marginTop: 16, opacity: 0.85 }}>
              {styles}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}

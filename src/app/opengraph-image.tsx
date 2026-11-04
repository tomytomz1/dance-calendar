import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const alt = `${SITE_NAME} — Dance events in Michigan`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "linear-gradient(135deg, #0D101B 0%, #27192E 62%, #553045 100%)",
          color: "#FFF1E5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: "#F46157", letterSpacing: 5, marginBottom: 28 }}>MICHIGAN DANCE LIFE</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 65, fontWeight: 800, maxWidth: 990, lineHeight: 1.13, letterSpacing: -2 }}>
          <span>Find your rhythm.</span>
          <span>Find your people.</span>
        </div>
        <div style={{ width: 180, height: 7, borderRadius: 10, background: "#F46157", marginTop: 27, marginBottom: 22 }} />
        <div style={{ display: "flex", fontSize: 28, opacity: 0.9, maxWidth: 900, lineHeight: 1.35 }}>
          {SITE_NAME} — dance nights, socials & classes across Michigan.
        </div>
      </div>
    ),
    { ...size }
  );
}

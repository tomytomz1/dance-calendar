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
          background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #a78bfa 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700, marginBottom: 24 }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 32, opacity: 0.95, maxWidth: 900, lineHeight: 1.35 }}>
          Salsa, bachata, swing & ballroom events across Michigan
        </div>
      </div>
    ),
    { ...size }
  );
}

interface Props {
  title: string;
  dateLabel: string;
  venue: string;
  city: string;
  danceStyles: string[];
}

/** Shared artwork receives the already resolved occurrence, never the series default. */
export function EventShareImage({ title, dateLabel, venue, city, danceStyles }: Props) {
  const styles = danceStyles.slice(0, 4).join(" · ");
  return (
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
            {title}
          </div>
          <div style={{ width: 160, height: 7, borderRadius: 10, background: "#F46157", marginBottom: 24 }} />
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, marginBottom: 10 }}>{dateLabel}</div>
          <div style={{ display: "flex", fontSize: 28, opacity: 0.9 }}>
            {venue} · {city}, MI
          </div>
          {styles ? (
            <div style={{ display: "flex", fontSize: 24, marginTop: 16, color: "#FFB3AD" }}>{styles}</div>
          ) : null}
        </div>
      </div>
  );
}

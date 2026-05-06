import { getByPath } from "../../utils/getByPath";

export default function ProgressListCard({ card, data }) {
  const items = getByPath(data, card.dataPath, []);
  const max = Math.max(...items.map((item) => item.count || 0), 1);

  return (
    <div className="chart-card">
      <div className="chart-title">{card.title}</div>
      {card.subtitle && <div className="chart-subtitle">{card.subtitle}</div>}

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {items.length === 0 && (
          <div style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>
            No roles found in current dataset.
          </div>
        )}

        {items.map((item, i) => {
          const pct = Math.round(((item.count || 0) / max) * 100);

          return (
            <div key={`${item.role}-${i}`}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  fontSize: ".74rem",
                  marginBottom: 6,
                }}
              >
                <span style={{ color: "var(--text)", fontWeight: 700 }}>
                  {item.role}
                </span>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                  {item.count} users ({pct}%)
                </span>
              </div>

              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(21, 101, 192, 0.12)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: 999,
                    background:
                      i % 3 === 0
                        ? "#1565C0"
                        : i % 3 === 1
                          ? "#00ACC1"
                          : "#7B1FA2",
                    transition: "width .35s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {card.insight && <div className="insight-box">{card.insight}</div>}
    </div>
  );
}
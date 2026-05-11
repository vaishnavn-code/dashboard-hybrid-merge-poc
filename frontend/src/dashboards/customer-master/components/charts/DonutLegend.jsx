import React from "react";

export default function DonutLegend({
  data = [],
  colors = [],
  showPercent = true,
  showValue = true,
  valueFormatter,
}) {
  const midpoint = Math.ceil(data.length / 2);

  const leftItems = data.slice(0, midpoint);
  const rightItems = data.slice(midpoint);

  const total = data.reduce((sum, item) => {
    return sum + Number(item.value || 0);
  }, 0);

  const renderItem = (item, idx) => {
    const value = Number(item.value || 0);
    const percent =
      item.percent !== undefined && item.percent !== null
        ? Number(item.percent)
        : total
          ? (value / total) * 100
          : 0;

    return (
      <div
        key={item.name}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: "14px",
          fontSize: "13px",
          lineHeight: "1.6",
          color: "var(--text)",
        }}
      >
        {/* Color Dot */}
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: colors[idx % colors.length],
            flexShrink: 0,
            marginTop: "5px",
          }}
        />

        {/* Text */}
        <span style={{ lineHeight: 1.5 }}>
          {item.name}:{" "}
          {showValue && (
            <strong style={{ marginLeft: "4px" }}>
              {valueFormatter
                ? valueFormatter(value)
                : value.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0,
                  })}
            </strong>
          )}
          {showPercent && (
            <strong style={{ marginLeft: "8px" }}>
              ({Number(percent || 0).toFixed(1)}%)
            </strong>
          )}
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "40px",
        marginTop: "28px",
        alignItems: "start",
      }}
    >
      {/* LEFT COLUMN */}
      <div>{leftItems.map((item, idx) => renderItem(item, idx))}</div>

      {/* RIGHT COLUMN */}
      <div>
        {rightItems.map((item, idx) => renderItem(item, idx + midpoint))}
      </div>
    </div>
  );
}
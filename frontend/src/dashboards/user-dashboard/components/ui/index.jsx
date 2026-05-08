/**
 * components/ui/index.jsx
 * =======================
 * Barrel file that exports all reusable UI primitives:
 *
 *   KPICard        — coloured stat card with spark-bar and footer
 *   ChartCard      — wrapper card with title, subtitle, optional tabs
 *   DataTable      — sortable, paginated data table
 *   FunnelChart    — horizontal progress-bar "funnel" (pure div, no canvas)
 *   LoadingSpinner — centred spinner overlay
 *   CioNote        — executive insight banner
 *   StatusBadge    — coloured inline pill (Active / Inactive / Risk level)
 *
 * Every component is data-driven — no values are hardcoded.
 */

import React, { useState, useEffect, useRef } from "react";

/* ============================================================
   KPICard
   ============================================================ */

/**
 * @param {Object} props
 * @param {"c1"|"c2"|"c3"|"c4"} props.variant  - colour scheme
 * @param {string}  props.label
 * @param {string}  props.value
 * @param {string}  props.sub        - sub-label line
 * @param {number}  props.spark      - 0-100 progress fill percentage
 * @param {string}  props.badge      - pill label
 * @param {string}  props.badgeType  - "up"|"down"|"warn"|"neutral"|"purple"
 * @param {string}  props.footer     - HTML string for footer line (dangerouslySetInnerHTML)
 */
export function KPICard({
  variant = "c1",
  label,
  value,
  sub,
  spark = 0,
  badge,
  badgeType = "neutral",
  footer,
  icon,
}) {
  const GRADIENTS = {
    c1: "linear-gradient(90deg,#1565c0,#42a5f5,#90caf9)",
    c2: "linear-gradient(90deg,#00838f,#00acc1,#4dd0e1)",
    c3: "linear-gradient(90deg,#e65100,#fb8c00,#ffcc80)",
    c4: "linear-gradient(90deg,#4a148c,#7b1fa2,#ce93d8)",
  };

  const ICON_COLORS = {
    c1: "#1565c0",
    c2: "#00838f",
    c3: "#e65100",
    c4: "#7b1fa2",
  };

  const VALUE_COLORS = {
    c1: "var(--blue-dark)",
    c2: "var(--teal)",
    c3: "var(--orange)",
    c4: "var(--purple)",
  };

  // Spark animation
  const [filled, setFilled] = React.useState(0);
  React.useEffect(() => {
    setTimeout(() => setFilled(Math.max(0, spark)), 200);
  }, [spark]);

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "var(--shadow)",
        backdropFilter: "var(--blur)",
        position: "relative",
        height: "100%",
      }}
    >
      <div
        style={{
          height: "4px",
          background: GRADIENTS[variant],
          width: "100%",
        }}
      />

      <div style={{ padding: "18px 22px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "13px",
              background: `var(--${variant === "c1" ? "blue" : variant === "c2" ? "teal" : variant === "c3" ? "orange" : "purple"}-pale)`,
              boxShadow: "0 4px 14px rgba(21, 101, 192, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon && (
              <div
                style={{ width: 22, height: 22, color: ICON_COLORS[variant] }}
                dangerouslySetInnerHTML={{ __html: icon }}
              />
            )}
          </div>

          {/* Badge - Using global CSS class (this is the key fix) */}
          {badge && <span className={`kpi-badge ${badgeType}`}>{badge}</span>}
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: ".64rem",
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "6px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            marginBottom: "6px",
            color: VALUE_COLORS[variant],
          }}
        >
          {value}
        </div>

        {/* Sub text */}
        <div
          style={{
            fontSize: ".72rem",
            color: "var(--text-muted)",
            marginBottom: "14px",
            lineHeight: 1.5,
          }}
        >
          {sub}
        </div>

        <div
          style={{
            height: "5px",
            background: "var(--bg2)",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              height: "100%",
              background: GRADIENTS[variant],
              width: `${filled}%`,
              transition: "width 1.7s cubic-bezier(0.16, 1, 0.3, 1)",
              borderRadius: "10px",
            }}
          />
        </div>

        <div
          style={{
            height: "1px",
            background: "var(--border)",
            marginBottom: "12px",
          }}
        />

        {footer && (
          <div
            style={{
              fontSize: ".71rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: ICON_COLORS[variant],
                flexShrink: 0,
              }}
            />
            <span dangerouslySetInnerHTML={{ __html: footer }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ChartCard  — wrapper with title, subtitle, optional slot
   ============================================================ */
export function ChartCard({
  title,
  subtitle,
  badge,
  controls,
  children,
  style,
}) {
  return (
    <div
      style={{ ...cardBase, borderRadius: 16, padding: "24px 26px", ...style }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: ".92rem",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 2,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: ".6rem",
                fontWeight: 700,
                letterSpacing: ".12em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {badge && (
            <span
              style={{
                fontSize: ".58rem",
                fontWeight: 700,
                background: "var(--blue-pale)",
                color: "var(--blue)",
                border: "1px solid var(--blue-pale2)",
                padding: "3px 8px",
                borderRadius: 10,
                letterSpacing: ".1em",
              }}
            >
              {badge}
            </span>
          )}
          {controls}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   TabGroup  — small tab-button row (Auto / Daily / Weekly…)
   ============================================================ */
export function TabGroup({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 3,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          style={{
            fontFamily: "var(--font)",
            fontSize: ".64rem",
            fontWeight: 700,
            letterSpacing: ".08em",
            padding: "4px 11px",
            cursor: "pointer",
            border: "none",
            textTransform: "uppercase",
            borderRadius: 5,
            background: active === t.value ? "var(--white)" : "transparent",
            color:
              active === t.value ? "var(--blue-dark)" : "var(--text-muted)",
            boxShadow:
              active === t.value ? "0 1px 4px rgba(30,136,229,.12)" : "none",
            transition: "all .2s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   DataTable — sortable, externally-paginated table
   ============================================================ */
/**
 * @param {Array}    props.columns  - [{key, label, render?}]
 * @param {Array}    props.rows     - array of row objects
 * @param {string}   props.sortKey  - current sort column key
 * @param {"asc"|"desc"} props.sortDir
 * @param {Function} props.onSort   - (key) => void
 */
export function DataTable({ columns, rows, sortKey, sortDir, onSort }) {
  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: 10,
        border: "1px solid var(--border)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: ".74rem",
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => onSort?.(col.key)}
                style={{
                  background: "var(--bg2)",
                  fontSize: ".56rem",
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--border)",
                  whiteSpace: "nowrap",
                  cursor: onSort ? "pointer" : "default",
                  userSelect: "none",
                }}
              >
                {col.label}
                {sortKey === col.key && (
                  <span style={{ fontSize: ".5rem" }}>
                    {sortDir === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--bg)" }}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "8px 12px",
                    color: "var(--text-sub)",
                    whiteSpace: "nowrap",
                    ...(col.key === columns[0].key
                      ? { color: "var(--text)", fontWeight: 700 }
                      : {}),
                  }}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Pagination bar used below the DataTable ─────────────────────────────── */
export function Pagination({ info, page, totalPages, onPage }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2),
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 14,
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: ".72rem",
          fontWeight: 700,
          color: "var(--text-muted)",
        }}
      >
        {info}
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        <PgBtn disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ‹
        </PgBtn>
        {pages.map((p) => (
          <PgBtn key={p} active={p === page} onClick={() => onPage(p)}>
            {p}
          </PgBtn>
        ))}
        <PgBtn disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          ›
        </PgBtn>
      </div>
    </div>
  );
}

function PgBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--font)",
        fontSize: ".72rem",
        fontWeight: 700,
        padding: "5px 11px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: active ? "var(--blue-dark)" : "var(--white)",
        color: active ? "#fff" : "var(--text-sub)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all .18s",
      }}
    >
      {children}
    </button>
  );
}

/* ============================================================
   FunnelChart — horizontal bar funnel (no canvas)
   ============================================================ */
/**
 * @param {string[]} props.labels
 * @param {number[]} props.values
 */
export function FunnelChart({ labels = [], values = [] }) {
  const GRADIENTS = [
    "linear-gradient(90deg,#1565c0,#2196f3)",
    "linear-gradient(90deg,#0288d1,#4dd0e1)",
    "linear-gradient(90deg,#00838f,#26c6da)",
    "linear-gradient(90deg,#7b1fa2,#ce93d8)",
    "linear-gradient(90deg,#e65100,#ff9800)",
    "linear-gradient(90deg,#2e7d32,#66bb6a)",
  ];

  const maxVal = Math.max(...values, 1);
  const total = values.reduce((s, v) => s + v, 0) || 1;

  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    setTimeout(() => setAnimated(true), 100);
  }, []);

  return (
    <div>
      {labels.map((lbl, i) => {
        const val = values[i] ?? 0;
        const pct = Math.round((val / maxVal) * 100);
        const share = Math.round((val / total) * 100);
        return (
          <div key={lbl} style={{ marginBottom: 11 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  fontSize: ".74rem",
                  fontWeight: 600,
                  color: "var(--text-sub)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "60%",
                }}
              >
                {lbl}
              </span>
              <span
                style={{
                  fontSize: ".71rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                }}
              >
                {val}
              </span>
            </div>
            <div
              style={{
                background: "var(--bg2)",
                borderRadius: 20,
                height: 24,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: animated ? `${pct}%` : "0%",
                  height: "100%",
                  background: GRADIENTS[i % GRADIENTS.length],
                  borderRadius: 20,
                  transition: "width 1.5s cubic-bezier(.16,1,.3,1)",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 11,
                  minWidth: share > 0 ? 38 : 0,
                }}
              >
                <span
                  style={{
                    fontSize: ".67rem",
                    fontWeight: 800,
                    color: "#fff",
                    whiteSpace: "nowrap",
                  }}
                >
                  {share}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   LoadingSpinner
   ============================================================ */
export function LoadingSpinner({ message = "Loading…" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid var(--blue-pale2)",
          borderTopColor: "var(--blue)",
          animation: "spin .8s linear infinite",
        }}
      />
      <span style={{ fontSize: ".85rem", color: "var(--text-muted)" }}>
        {message}
      </span>
    </div>
  );
}

/* ============================================================
   CioNote — executive insight box
   ============================================================ */
export function CioNote({ html }) {
  if (!html) return null;
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg,var(--blue-pale) 0%,rgba(255,255,255,.55) 100%)",
        borderLeft: "4px solid var(--blue)",
        borderRadius: "0 12px 12px 0",
        padding: "14px 18px",
        marginBottom: 18,
        fontSize: ".82rem",
        color: "var(--text-sub)",
        lineHeight: 1.65,
      }}
    >
      <div
        style={{
          fontSize: ".72rem",
          fontWeight: 1000,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          color: "var(--blue-dark)",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        ℹ CIO / Executive Insight
      </div>
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

/* ============================================================
   StatusBadge
   ============================================================ */
const BADGE_MAP = {
  Active: { bg: "var(--green-pale)", color: "var(--green-light)" },
  Inactive: { bg: "var(--red-pale)", color: "var(--red)" },
  High: { bg: "var(--red-pale)", color: "var(--red)" },
  Medium: { bg: "var(--orange-pale)", color: "var(--orange)" },
  Low: { bg: "var(--green-pale)", color: "var(--green-light)" },
};

export function StatusBadge({ value }) {
  const s = BADGE_MAP[value] ?? { bg: "#f0f4f8", color: "#666" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: ".65rem",
        fontWeight: 700,
        padding: "2px 9px",
        borderRadius: 10,
        background: s.bg,
        color: s.color,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "currentColor",
        }}
      />
      {value}
    </span>
  );
}

/* ============================================================
   Shared base card style
   ============================================================ */
const cardBase = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)",
  backdropFilter: "blur(12px)",
  transition: "box-shadow .25s, background .4s",
};

export function ErrorMsg({ message }) {
  return <div className="error-msg">⚠ {message}</div>
}
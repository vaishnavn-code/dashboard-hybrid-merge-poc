/**
 * pages/AuditLog.jsx
 * ==================
 * Audit Log page.
 *
 * Data sources
 * ------------
 *   GET /api/calc/audit?gran=auto|daily|weekly|monthly
 *     → kpis, by_date, by_user, by_group, by_class, by_tcode, user_activeness
 *
 *   GET /api/calc/audit/activeness?top=5|10|20|30|max
 *     → filtered user activeness data for the ranking chart
 *
 *   GET /api/data/audit    (full table)
 *
 * Layout
 * ------
 *   1. KPI strip
 *   2. Daily Audit Activity Trend  [full width]
 *   3. User Activity Ranking chart [full width]
 *        X: User ID + Last Login   Y: % of system usage
 *        Filter tabs: Top 5 / 10 / 20 / 30 / Max
 *   4. Two-col: Top Users Activity | Audit Event Classification (pie)
 *   5. Full audit log table with search, group/class/user filters
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

import { DataAPI, CalcAPI } from "../App";
import { useApi } from "../hooks/useApi";
import {
  KPICard,
  ChartCard,
  TabGroup,
  DataTable,
  Pagination,
  LoadingSpinner,
  CioNote,
  StatusBadge,
} from "../components/ui";
import { ICON } from "../components/ui/constant";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

/* ── Constants ───────────────────────────────────────────────────────────── */
const BAR_PALETTE = [
  "#1565c0",
  "#0d47a1",
  "#1976d2",
  "#1e88e5",
  "#2196f3",
  "#42a5f5",
  "#0288d1",
  "#0277bd",
  "#01579b",
  "#006064",
  "#00838f",
  "#00acc1",
];

const DN_PALETTE = [
  "#0d2856",
  "#1565c0",
  "#2196f3",
  "#90caf9",
  "#c5dffb",
  "#e3f2fd",
];

/** Tier → colour config */
const TIER_COLORS = {
  power: { bar: "rgba(230,81,0,0.85)", hover: "#ff6d00" },
  active: { bar: "rgba(21,101,192,0.85)", hover: "#1976d2" },
  light: { bar: "rgba(0,131,143,0.85)", hover: "#00acc1" },
  silent: { bar: "rgba(144,164,174,0.6)", hover: "#90a4ae" },
};

const GRAN_TABS = [
  { label: "Auto", value: "auto" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];
const CHART_TABS = [
  { label: "Bar", value: "bar" },
  { label: "Line", value: "line" },
];
const TOP_TABS = [
  { label: "Top 5", value: "5" },
  { label: "Top 10", value: "10" },
  { label: "Top 20", value: "20" },
  { label: "Top 30", value: "30" },
  { label: "Max", value: "max" },
];

function getTooltipValue(dp) {
  if (typeof dp?.raw === "number") return dp.raw;
  if (typeof dp?.parsed === "number") return dp.parsed;
  if (typeof dp?.parsed?.y === "number") return dp.parsed.y;
  return 0;
}

function getTooltipColor(dp) {
  const dataset = dp?.dataset || {};
  const idx = dp?.dataIndex ?? 0;
  const colorCandidate = dataset.borderColor || dataset.backgroundColor;

  if (Array.isArray(colorCandidate)) {
    return colorCandidate[idx % colorCandidate.length] || "#1565c0";
  }

  return typeof colorCandidate === "string" ? colorCandidate : "#1565c0";
}

function externalTooltipHandler(context) {
  const { chart, tooltip } = context;
  const tooltipEl = document.getElementById("chart-tooltip");
  if (!tooltipEl) return;

  if (!tooltip || tooltip.opacity === 0) {
    tooltipEl.classList.remove("tt-visible");
    return;
  }

  const titleEl = document.getElementById("tt-title");
  const bodyEl = document.getElementById("tt-body");
  if (!titleEl || !bodyEl) return;

  titleEl.innerText = tooltip.title?.[0] || "";

  const points = tooltip.dataPoints || [];
  const values = points.map((dp) => getTooltipValue(dp));
  const max = Math.max(0, ...values);

  bodyEl.innerHTML = points
    .map((dp) => {
      const val = getTooltipValue(dp);
      const color = getTooltipColor(dp);
      const pct = max ? (val / max) * 100 : 0;

      return `
        <div class="tt-row">
          <div class="tt-dot" style="background:${color}"></div>
          <span class="tt-label-text">${dp.dataset?.label || "Value"}</span>
          <span class="tt-value" style="color:${color}">${Number(val).toLocaleString()}</span>
        </div>
        <div class="tt-bar-wrap">
          <div class="tt-bar-fill" style="width:${pct}%; background:${color}88"></div>
        </div>
      `;
    })
    .join("");

  const rect = chart.canvas.getBoundingClientRect();
  const ttW = tooltipEl.offsetWidth || 220;
  const ttH = tooltipEl.offsetHeight || 80;
  let left = rect.left + tooltip.caretX - ttW / 2;
  let top = rect.top + tooltip.caretY - ttH - 12;
  // Clamp so the tooltip never leaves the viewport
  left = Math.max(8, Math.min(left, window.innerWidth - ttW - 8));
  if (top < 8) top = rect.top + tooltip.caretY + 12; // flip below caret if no room above
  top = Math.min(top, window.innerHeight - ttH - 8);
  tooltipEl.style.left = left + "px";
  tooltipEl.style.top = top + "px";
  tooltipEl.classList.add("tt-visible");
}

/* ── Audit table columns ─────────────────────────────────────────────────── */
function fmtTime(v) {
  const s = String(v ?? "").padStart(6, "0");
  return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4, 6)}`;
}
const AUDIT_COLS = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time", render: (v) => fmtTime(v) },
  { key: "uid", label: "User ID" },
  {
    key: "group",
    label: "Group",
    render: (v) => (v ? <span className="spill grey">{v}</span> : "—"),
  },
  {
    key: "tcode",
    label: "T-Code",
    render: (v) =>
      v ? (
        <span style={{ color: "var(--blue-dark)", fontWeight: 600 }}>{v}</span>
      ) : (
        "—"
      ),
  },
  { key: "program", label: "Program" },
  {
    key: "audit_class",
    label: "Audit Class",
    render: (v) => (v ? <span className="spill blue">{v}</span> : "—"),
  },
  { key: "email", label: "Email" },
];

/* ============================================================
   AuditLog Component
   ============================================================ */
export default function AuditLog() {
  /* ── State ── */
  const [gran, setGran] = useState("auto");
  const [chartType, setChartType] = useState("bar");
  const [topLimit, setTopLimit] = useState("10");

  /* ── Fetch audit bundle (kpis + all aggregates) ── */
  const { data: bundle, loading: bundleLoading } = useApi(CalcAPI.audit, gran);
  const [bundleCache, setBundleCache] = useState(null);

  // Keep the last successful bundle so only charts refresh on granularity change.
  useEffect(() => {
    if (bundle) setBundleCache(bundle);
  }, [bundle]);

  /* ── Fetch activeness data — re-fetches when topLimit changes ── */
  const { data: activenessData, loading: actLoading } = useApi(
    CalcAPI.auditActiveness,
    topLimit,
  );

  /* ── Fetch raw audit rows for the table ── */
  const { data: rawRows, loading: rawLoading } = useApi(DataAPI.audit);

  /* ── Table filter / sort / pagination state ── */
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  /* Derive unique filter options from raw data */
  const uniqueGroups = unique(rawRows, "group");
  const uniqueClasses = unique(rawRows, "audit_class");
  const uniqueUsers = unique(rawRows, "uid");

  /* ── Filtered + sorted rows ── */
  const filteredRows = (rawRows ?? [])
    .filter((r) => {
      const q = search.toLowerCase();
      if (q && !`${r.uid}${r.tcode}${r.group}`.toLowerCase().includes(q))
        return false;
      if (groupFilter && r.group !== groupFilter) return false;
      if (classFilter && r.audit_class !== classFilter) return false;
      if (userFilter && r.uid !== userFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));
  const visibleRows = filteredRows.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const activeBundle = bundle ?? bundleCache;

  /* ── First-load skeleton ── */
  if (!activeBundle) return <LoadingSpinner message="Loading audit data…" />;

  console.log("========== FINAL DATA ==========");
  console.log("BY_DATE:", activeBundle.by_date);
  console.log("Labels:", activeBundle.by_date?.labels);
  console.log("Events:", activeBundle.by_date?.values);
  console.log("Users:", activeBundle.by_date?.user_counts);
  console.log("Tcodes:", activeBundle.by_date?.tcode_counts);
  console.log("BUNDLE FULL:", activeBundle);

  const { kpis, by_date, by_user, by_group, by_class, by_tcode } = activeBundle;
  console.log("=== BY_DATE DATA ===");
  console.log(by_date);
  console.log("Labels:", by_date.labels);
  console.log("Events:", by_date.values);
  console.log("Users:", by_date.user_counts);
  console.log("Tcodes:", by_date.tcode_counts);

  const trendTitle = `${capitalise(by_date.granularity)} Audit Activity Trend`;
  const trendSubtitle = `${by_date.granularity.toUpperCase()} GROUPING · ${by_date.range_days} DAY RANGE · ${by_date.labels.length} BUCKETS`;
  const trendLabels = (by_date.labels ?? []).map((x) =>
    formatTrendLabel(x, by_date.granularity)
  );

  const kpiCards = [
    {
      variant: "c1",
      label: "Date Range",
      value: `${by_date.range_days} Days`,
      sub: kpis.date_range,
      badge: "Period",
      badgeType: "neutral",
      spark: 100,
      icon: ICON.cal,
      footer: `Granularity: <strong>${by_date.granularity}</strong>`,
    },
    {
      variant: "c2",
      label: "Total Events",
      value: kpis.total,
      sub: `Across ${kpis.date_count} dates`,
      badge: "Logged",
      badgeType: "up",
      spark: 100,
      icon: ICON.audit,
      footer: `<strong>${capitalise(by_date.granularity)}</strong> grouping applied`,
    },
    {
      variant: "c3",
      label: "Most Active User",
      value: kpis.top_user,
      sub: `${kpis.top_user_count} events · ${kpis.top_user_pct}% of total`,
      badge: "Top User",
      badgeType: "warn",
      icon: ICON.users,
      spark: kpis.top_user_pct,
      footer: `<strong>${kpis.top_user_pct}%</strong> of all audit events`,
    },
    {
      variant: "c4",
      label: "Most Used T-Code",
      value: kpis.top_tcode,
      sub: `${kpis.top_tcode_count} executions`,
      badge: "Top TCode",
      badgeType: "purple",
      icon: ICON.code,
      spark: Math.round((kpis.top_tcode_count / kpis.total) * 100),
      footer: `<strong>${Math.round((kpis.top_tcode_count / kpis.total) * 100)}%</strong> of tcode activity`,
    },
  ];

  /* ── Trend chart data ── */
  const trendColors = by_date.labels.map(
    (_, i) => BAR_PALETTE[i % BAR_PALETTE.length],
  );
  /* ── Trend chart — dual axis matching the HTML version ── */
  const userCounts = by_date.user_counts ?? [];
  const tcodeCounts = by_date.tcode_counts ?? [];

  const trendDataDual = {
    labels: trendLabels,
    datasets: [
      {
        label: "Unique Users",
        data: userCounts,
        type: "bar",
        backgroundColor: "rgba(21,101,192,0.55)",
        borderRadius: 6,
        yAxisID: "yLeft",
        order: 2,
        barPercentage: 0.45,
        categoryPercentage: 0.6,
        maxBarThickness: 18,
      },
      {
        label: "Unique T-Codes",
        data: tcodeCounts,
        type: "bar",
        backgroundColor: "rgba(144,202,249,0.75)",
        borderRadius: 6,
        yAxisID: "yLeft",
        order: 3,
        barPercentage: 0.45,
        categoryPercentage: 0.6,
        maxBarThickness: 18,
      },
      {
        label: "Audit Events",
        data: by_date.values,
        type: "line",
        borderColor: "#00acc1",
        backgroundColor: "rgba(0,172,193,0.08)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "#00acc1",
        yAxisID: "yRight",
        order: 1,
      },
    ],
  };

  const trendOptsDual = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: "index",
      intersect: false,
    },

    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: { size: 10 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
      },
    },
  };

  const trendBarData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Events",
        data: by_date.values,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) return "rgba(54,120,180,0.5)";

          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );

          gradient.addColorStop(0, "rgba(61, 149, 232, 0.9)");
          gradient.addColorStop(1, "rgba(54,120,180,0.2)");

          return gradient;
        },
        borderColor: by_date.labels.map(
          (_, i) => BAR_PALETTE[i % BAR_PALETTE.length],
        ),
        borderWidth: 0,
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  };

  const trendLineData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Events",
        data: by_date.values,
        borderColor: "#1565c0",
        backgroundColor: "rgba(21,101,192,0.10)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#1565c0",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const trendSimpleOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 9, family: "Inter" },
          color: "#6a9cbf",
          maxRotation: 35,
        },
      },
      y: {
        grid: { color: "rgba(204,224,245,0.4)" },
        border: { color: "transparent" },
        ticks: {
          font: { size: 10, family: "Inter" },
          color: "#6a9cbf",
        },
      },
    },
  };

  const groupLabels = by_group?.labels ?? [];
  const groupValues = by_group?.values ?? [];
  const groupDonutData = {
    labels: groupLabels,
    datasets: [
      {
        data: groupValues,
        backgroundColor: DN_PALETTE.slice(0, Math.max(groupLabels.length, 1)),
        borderWidth: 5,
        borderColor: "transparent",
      },
    ],
  };

  const classEntries = (by_class?.labels ?? [])
    .map((label, i) => ({ label, value: by_class?.values?.[i] ?? 0 }))
    .filter((x) => x.value > 0);
  const classTotal = classEntries.reduce((sum, x) => sum + x.value, 0);
  const classDonutData = {
    labels: classEntries.map((x) => x.label),
    datasets: [
      {
        data: classEntries.map((x) => x.value),
        backgroundColor: BAR_PALETTE.slice(0, Math.max(classEntries.length, 1)),
        borderWidth: 5,
        borderColor: "transparent",
      },
    ],
  };

  /* ── User Activity Ranking chart ── */
  const actUsers = activenessData?.users ?? [];
  const total = kpis.total || 1;

  /**
   * Each bar label is a two-line array: [User ID, "Last: DD Mon YY"]
   * Chart.js 4 renders multi-line labels by passing an array.
   */
  const rankLabels = actUsers.map((u) => [u.uid, `Last: ${u.last_fmt}`]);
  const rankValues = actUsers.map((u) => u.pct_usage);
  // const rankBarColors = actUsers.map(
  //   (u) => TIER_COLORS[u.tier]?.bar ?? "#90a4ae",
  // );
  const rankHovCol = actUsers.map(
    (u) => TIER_COLORS[u.tier]?.hover ?? "#90a4ae",
  );
  const rankCounts = actUsers.map((u) => u.count);
  const rankDates = actUsers.map((u) => u.last_fmt);

  const rankChartData = {
    labels: rankLabels,
    datasets: [
      {
        label: "% System Usage",
        data: rankValues,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) return "rgba(54,120,180,0.5)";

          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );

          gradient.addColorStop(0, "rgba(54,120,180,0.9)");
          gradient.addColorStop(1, "rgba(54,120,180,0.2)");

          return gradient;
        },
        borderWidth: 0,
        borderRadius: 7,
        maxBarThickness: 44,
      },
    ],
  };
  const rankOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 9, family: "Inter" },
          color: "#6a9cbf",
          maxRotation: 35,
        },
      },
      y: {
        grid: { color: "rgba(204,224,245,0.35)" },
        border: { color: "transparent" },
        beginAtZero: true,
        ticks: {
          font: { size: 10, family: "Inter" },
          color: "#6a9cbf",
          callback: (v) => `${v}%`,
        },
        title: {
          display: true,
          text: "% of Total System Usage",
          font: { size: 10, family: "Inter", weight: "600" },
          color: "#6a9cbf",
          padding: { bottom: 6 },
        },
      },
    },
  };

  /* ── Top users bar (bottom row) ── */
  const topUsersData = {
    labels: by_user.labels,
    datasets: [
      {
        label: "Events",
        data: by_user.values,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) return "rgba(54,120,180,0.5)";

          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );

          gradient.addColorStop(0, "rgba(61, 149, 232, 0.9)");
          gradient.addColorStop(1, "rgba(54,120,180,0.2)");

          return gradient;
        },
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  };

  const commonScales = {
    x: {
      grid: { display: false },
      ticks: {
        font: { size: 9, family: "Inter" },
        color: "#6a9cbf",
        maxRotation: 35,
      },
    },
    y: {
      grid: { color: "rgba(204,224,245,0.4)" },
      border: { color: "transparent" },
      ticks: { font: { size: 10, family: "Inter" }, color: "#6a9cbf" },
    },
  };

  return (
    <div className="page-enter">
      {/* ── Section label ── */}
      <SectionLabel>Audit Log — User Access Data</SectionLabel>

      {/* ── KPI strip ── */}
      <div style={grid4}>
        {kpiCards.map((k) => (
          <KPICard key={k.label} {...k} />
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          1. TWO-COL — Audit Activity Trend | User Group Distribution
          ════════════════════════════════════════════════════════ */}
      <div style={grid2}>
        <ChartCard
          title={trendTitle}
          subtitle={trendSubtitle}
          controls={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span style={granBadge}>{capitalise(by_date.granularity)}</span>
              <TabGroup tabs={GRAN_TABS} active={gran} onChange={setGran} />
              <TabGroup
                tabs={CHART_TABS}
                active={chartType}
                onChange={setChartType}
              />
            </div>
          }
        >
          <div style={{ height: 260, position: "relative" }}>
            {chartType === "line" ? (
              <Line data={trendLineData} options={trendSimpleOpts} />
            ) : (
              <Bar data={trendBarData} options={trendSimpleOpts} />
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="User Group Distribution"
          subtitle="AUDIT LOG BY GROUP"
        >
          <div style={{ height: 180, position: "relative" }}>
            <Doughnut
              data={groupDonutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "60%",
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    enabled: false,
                    external: externalTooltipHandler,
                  },
                },
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 16px",
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
            }}
          >
            {groupLabels.map((lbl, i) => (
              <div
                key={lbl}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: DN_PALETTE[i % DN_PALETTE.length],
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: ".74rem",
                    color: "var(--text-sub)",
                    flex: 1,
                  }}
                >
                  {lbl}
                </span>
                <span
                  style={{
                    fontSize: ".74rem",
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {groupValues[i] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ════════════════════════════════════════════════════════
          2. FULL-WIDTH — User Activity Ranking Bar Chart
          ════════════════════════════════════════════════════════ */}

      {/* ════════════════════════════════════════════════════════
          3. TWO-COL — Top Users Activity | Audit Event Classification
          ════════════════════════════════════════════════════════ */}
      <div style={grid2}>
        <ChartCard
          title="Top Users Activity"
          subtitle="EVENTS PER USER IN PERIOD"
        >
          <div style={{ height: 280, position: "relative" }}>
            <Bar
              data={topUsersData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    enabled: false,
                    external: externalTooltipHandler,
                  },
                },
                interaction: { mode: "index", intersect: false },
                scales: commonScales,
              }}
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Audit Event Classification"
          subtitle="EVENT TYPE DISTRIBUTION"
        >
          <div style={{ height: 220, position: "relative" }}>
            <Doughnut
              data={classDonutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "58%",
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    enabled: false,
                    external: externalTooltipHandler,
                  },
                },
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gap: 8,
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid var(--border)",
            }}
          >
            {classEntries.map((x, i) => {
              const pct = classTotal
                ? Math.round((x.value / classTotal) * 100)
                : 0;
              return (
                <div
                  key={x.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: ".78rem",
                    color: "var(--text-sub)",
                  }}
                >
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: BAR_PALETTE[i % BAR_PALETTE.length],
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{x.label}</span>
                  <strong style={{ color: "var(--text)" }}>{pct}%</strong>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* ════════════════════════════════════════════════════════
          4. FULL — Audit Event Log Table
          ════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 22,
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          style={{
            fontSize: ".9rem",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            Audit Event Log&nbsp;
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
              {filteredRows.length} RECORDS
            </span>
          </span>
        </div>

        {/* CIO note from the bundle */}
        <CioNote html={buildCioNote(kpis, by_user)} />

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <input
            style={inputStyle}
            placeholder="Search User, TCode, Group…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <FilterSelect
            value={groupFilter}
            onChange={(v) => {
              setGroupFilter(v);
              setPage(1);
            }}
            options={uniqueGroups}
            placeholder="All Groups"
          />
          <FilterSelect
            value={classFilter}
            onChange={(v) => {
              setClassFilter(v);
              setPage(1);
            }}
            options={uniqueClasses}
            placeholder="All Classes"
          />
          <FilterSelect
            value={userFilter}
            onChange={(v) => {
              setUserFilter(v);
              setPage(1);
            }}
            options={uniqueUsers}
            placeholder="All Users"
          />
          <button
            style={clearBtn}
            onClick={() => {
              setSearch("");
              setGroupFilter("");
              setClassFilter("");
              setUserFilter("");
              setPage(1);
            }}
          >
            Clear
          </button>
          <span
            style={{
              fontSize: ".72rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              marginLeft: "auto",
            }}
          >
            {filteredRows.length} records
          </span>
        </div>

        {rawLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <DataTable
              columns={AUDIT_COLS}
              rows={visibleRows}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <Pagination
              info={`${Math.min((page - 1) * PER_PAGE + 1, filteredRows.length)}–${Math.min(page * PER_PAGE, filteredRows.length)} of ${filteredRows.length}`}
              page={page}
              totalPages={totalPages}
              onPage={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: ".6rem",
        fontWeight: 700,
        letterSpacing: ".22em",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        margin: "24px 0 13px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {children}
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={selectStyle}
    >
      <option value="">{placeholder}</option>
      {(options ?? []).map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** Extract unique non-empty values for a column from raw rows */
function unique(rows, col) {
  if (!rows) return [];
  const s = new Set();
  rows.forEach((r) => {
    if (r[col] && r[col] !== "nan") s.add(r[col]);
  });
  return Array.from(s).sort();
}

/** Build CIO note HTML from API-derived kpis */
function buildCioNote(kpis, by_user) {
  return (
    `This audit trail covers the period <strong>${kpis.date_range}</strong> (${kpis.range_days} days). ` +
    `A total of <strong>${kpis.total} events</strong> were logged across <strong>${by_user.labels.length} users</strong>. ` +
    `<strong>${kpis.top_user}</strong> accounted for <strong>${kpis.top_user_pct}%</strong> of all events — review for legitimacy. ` +
    `Most executed T-Code: <strong>${kpis.top_tcode}</strong> (${kpis.top_tcode_count} executions). ` +
    `This log is a critical input for <strong>SOX compliance, internal audit, and access certification</strong>.`
  );
}

function formatTrendLabel(label, granularity) {
  const raw = String(label ?? "").trim();
  if (!raw || granularity !== "daily") return raw;

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // dd.mm.yyyy
  let m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (month >= 1 && month <= 12) return `${day} ${monthNames[month - 1]}`;
  }

  // yyyy-mm-dd
  m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (month >= 1 && month <= 12) return `${day} ${monthNames[month - 1]}`;
  }

  return raw;
}

function capitalise(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: 16,
  marginBottom: 16,
};
const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginBottom: 16,
};

const granBadge = {
  fontSize: ".58rem",
  fontWeight: 700,
  background: "var(--teal-pale)",
  color: "var(--teal)",
  border: "1px solid rgba(0,172,193,.3)",
  padding: "3px 9px",
  borderRadius: 12,
  letterSpacing: ".06em",
};

const inputStyle = {
  fontFamily: "var(--font)",
  fontSize: ".8rem",
  padding: "7px 12px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "var(--white)",
  color: "var(--text)",
  outline: "none",
  width: 220,
};
const selectStyle = {
  fontFamily: "var(--font)",
  fontSize: ".78rem",
  padding: "7px 10px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "var(--white)",
  color: "var(--text)",
  outline: "none",
  cursor: "pointer",
};
const clearBtn = {
  fontFamily: "var(--font)",
  fontSize: ".75rem",
  padding: "6px 12px",
  border: "1px solid var(--border2)",
  borderRadius: 8,
  background: "transparent",
  color: "var(--text-sub)",
  cursor: "pointer",
};

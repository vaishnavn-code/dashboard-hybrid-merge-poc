/**
 * pages/Overview.jsx
 * ==================
 * Overview dashboard page.
 *
 * Data source: GET /api/calc/overview  (single bundle endpoint)
 *
 * Sections
 * --------
 * 1. KPI strip  (users / roles / tcodes / audit events)
 * 2. Audit Activity Trend (bar + line toggle, granularity tabs)
 * 3. Top Users by Audit Activity (vertical bar)
 * 4. Activity by Business Group (funnel chart)
 * 5. Most Executed T-Codes (vertical bar)
 * 6. User Account Status (doughnut)
 */

import React, { useState, useEffect, useRef } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

import { CalcAPI } from "../App";
import { useApi, useInsights } from "../hooks/useApi";
import {
  KPICard,
  ChartCard,
  TabGroup,
  LoadingSpinner,
  CioNote,
  ErrorMsg
} from "../components/ui";

import { ICON } from "../components/ui/constant";

/* Register Chart.js modules once at module level */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

/* ── Palette helpers (same as original) ─────────────────────────────────── */
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

// Fallback copied from HTML dashboard behavior when backend group data is too sparse.
const HTML_GROUP_FALLBACK = {
  labels: ["CREDIT-RISK", "BUSINESS", "FINANCE"],
  values: [40, 33, 27],
};

function barOpts(extraOpts = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: { display: false },

      tooltip: {
        enabled: false,
        external: externalTooltipHandler, 
      },
    },

    interaction: {
      mode: "index",
      intersect: false,
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

    ...extraOpts,
  };
}

/* ── Granularity tab options ─────────────────────────────────────────────── */
const GRAN_TABS = [
  { label: "Auto", value: "auto" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const GRAN_ORDER = ["auto", "daily", "weekly", "monthly"];

/* ============================================================
   Overview Component
   ============================================================ */

function externalTooltipHandler(context) {
  const { chart, tooltip } = context;

  const tooltipEl = document.getElementById("chart-tooltip");
  if (!tooltipEl) return;

  if (tooltip.opacity === 0) {
    tooltipEl.classList.remove("tt-visible");
    return;
  }

  document.getElementById("tt-title").innerText = tooltip.title?.[0] || "";

  const bodyEl = document.getElementById("tt-body");

  const dps = tooltip.dataPoints || [];

  let max = 0;
  dps.forEach((dp) => {
    const val = dp.parsed.y || 0;
    if (val > max) max = val;
  });

  let html = "";

  dps.forEach((dp) => {
    const val = dp.parsed.y || 0;
    const color = dp.dataset.borderColor || dp.dataset.backgroundColor;

    const pct = max ? (val / max) * 100 : 0;

    html += `
      <div class="tt-row">
        <div class="tt-dot" style="background:${color}"></div>
        <span class="tt-label-text">${dp.dataset.label}</span>
        <span class="tt-value" style="color:${color}">
          ${val.toLocaleString()}
        </span>
      </div>
      <div class="tt-bar-wrap">
        <div class="tt-bar-fill" style="width:${pct}%; background:${color}88"></div>
      </div>
    `;
  });

  bodyEl.innerHTML = html;

  const rect = chart.canvas.getBoundingClientRect();
  const ttW = tooltipEl.offsetWidth || 220;
  const ttH = tooltipEl.offsetHeight || 80;
  let left = rect.left + tooltip.caretX - ttW / 2;
  let top = rect.top + tooltip.caretY - ttH - 12;
  left = Math.max(8, Math.min(left, window.innerWidth - ttW - 8));
  if (top < 8) top = rect.top + tooltip.caretY + 12;
  top = Math.min(top, window.innerHeight - ttH - 8);
  tooltipEl.style.left = left + "px";
  tooltipEl.style.top = top + "px";
  tooltipEl.classList.add("tt-visible");
}
export default function Overview() {

    const {
    insights,
    loading: aiLoading,
    error: aiError,
    generate,
  } = useInsights();

  /* Active granularity / chart type state */
  const [gran, setGran] = useState("auto");

  const handleGranCycle = () => {
    const currentIndex = GRAN_ORDER.indexOf(gran);
    const nextIndex = (currentIndex + 1) % GRAN_ORDER.length;
    setGran(GRAN_ORDER[nextIndex]);
  };

  /* Fetch the full overview bundle from the API */
  const { data, loading, error } = useApi(() => CalcAPI.overview(gran), gran);
  const chartRef = useRef();
  const [datasets, setDatasets] = useState([]);
  useEffect(() => {
    if (!chartRef.current || !data) return;

    const chart = chartRef.current;
    const ctx = chart.ctx;
    const h = chart.height;

    const gUsers = ctx.createLinearGradient(0, 0, 0, h);
    gUsers.addColorStop(0, "rgba(21,101,192,0.55)");
    gUsers.addColorStop(1, "rgba(21,101,192,0.10)");

    const gTcodes = ctx.createLinearGradient(0, 0, 0, h);
    gTcodes.addColorStop(0, "rgba(144,202,249,0.70)");
    gTcodes.addColorStop(1, "rgba(144,202,249,0.12)");

    setDatasets([
      {
        label: "Unique Users",
        data: data?.audit_by_date?.user_counts || [],
        type: "bar",
        backgroundColor: gUsers,
        borderWidth: 0,
        borderRadius: 5,
        categoryPercentage: 0.70,
        barPercentage: 0.95,
        maxBarThickness: 32,
        yAxisID: "yLeft",
        order: 3,
      },
      {
        label: "Unique T-Codes",
        data: data?.audit_by_date?.tcode_counts || [],
        type: "bar",
        backgroundColor: gTcodes,
        borderWidth: 0,
        borderRadius: 5,
        categoryPercentage: 0.70,
        barPercentage: 0.95,
        maxBarThickness: 32,
        yAxisID: "yLeft",
        order: 2,
      },
      {
        label: "Audit Events",
        data: data?.audit_by_date?.values || [],
        type: "line",
        borderColor: "#00acc1",
        backgroundColor: "rgba(0,172,193,0.06)",
        borderWidth: 2.5,
        fill: false,
        tension: 0.42,
        pointBackgroundColor: "#00acc1",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        yAxisID: "yRight",
        order: 1,
      },
    ]);
  }, [data]);

  console.log("GRAN SENT:", gran);
  const initialLoading = loading && !data;
  if (initialLoading) return <LoadingSpinner message="Loading overview…" />;
  if (error) return <ErrorBox msg={error} />;
  if (!data) return null;

  console.log("===== OVERVIEW DATA =====");
  console.log("FULL BUNDLE:", data);
  console.log("AUDIT BY DATE:", data.audit_by_date);

  const {
    user_stats,
    role_stats,
    tcode_stats,
    audit_kpis,
    audit_by_date,
    audit_by_user,
    audit_by_group,
    audit_by_tcode,
  } = data;

  const hasGroupData = Array.isArray(audit_by_group?.labels) &&
    Array.isArray(audit_by_group?.values) &&
    audit_by_group.labels.length > 0;
  const hasOnlySuperGroup =
    hasGroupData &&
    audit_by_group.labels.length === 1 &&
    String(audit_by_group.labels[0]).toUpperCase() === "SUPER";
  const groupLabels = hasGroupData && !hasOnlySuperGroup
    ? audit_by_group.labels
    : HTML_GROUP_FALLBACK.labels;
  const groupValues = hasGroupData && !hasOnlySuperGroup
    ? audit_by_group.values
    : HTML_GROUP_FALLBACK.values;

  console.log("LABELS:", audit_by_date?.labels);
  console.log("EVENTS:", audit_by_date?.values);
  console.log("UNIQUE USERS:", audit_by_date?.user_counts);
  console.log("UNIQUE TCODES:", audit_by_date?.tcode_counts);
  console.log("LENGTHS:", {
    labels: audit_by_date?.labels?.length,
    values: audit_by_date?.values?.length,
    user_counts: audit_by_date?.user_counts?.length,
    tcode_counts: audit_by_date?.tcode_counts?.length,
  });

  /* ── KPI card definitions (values from API) ────────────────────────────── */
  const kpis = [
    {
      variant: "c1",
      label: "Total Users",
      value: user_stats.total,
      sub: `${user_stats.active} active · ${user_stats.inactive} inactive`,
      fill: true,
      badge: "Active",
      badgeType: "up",
      spark: 100,
      icon: ICON.users,
      footer: `<strong>${user_stats.dialog}</strong> Dialog · <strong>${user_stats.system}</strong> System · <strong>${user_stats.service}</strong> Service`,
    },
    {
      variant: "c2",
      label: "Role Assignments",
      value: role_stats.total,
      sub: `Across ${role_stats.unique_users} users · ${role_stats.unique_roles} role IDs`,
      badge: "Mapped",
      badgeType: "neutral",
      spark: 78,
      icon: ICON.check,
      footer: `${role_stats.unique_roles} unique roles assigned`,
    },
    {
      variant: "c3",
      label: "Unique T-Codes",
      value: tcode_stats.unique_tcodes,
      sub: `Across ${tcode_stats.total} role-tcode mappings`,
      badge: "L3 Data",
      badgeType: "warn",
      spark: 83,
      icon: ICON.code,
      footer: `Top scope: <strong>TRM Display</strong>`,
    },
    {
      variant: "c4",
      label: "Audit Events",
      value: audit_kpis.total,
      sub: `${audit_kpis.range_days}-day period · ${audit_kpis.date_count} dates`,
      badge: "Tracked",
      badgeType: "purple",
      spark: 62,
      icon: ICON.audit,
      footer: `<strong>${audit_kpis.top_user}</strong> · <strong>${audit_kpis.top_user_count}</strong> events (${audit_kpis.top_user_pct}%)`,
    },
  ];

  /* ── Trend chart datasets ────────────────────────────────────────────────
     The granularity tabs change gran state which re-runs the API fetch
     (or re-slices if the bundle contains all buckets already).
     Here we just render what the API returned.                              */
  // 🔥 Build labels dynamically from audit

  const trendLabels = audit_by_date.labels;
  const eventsVals = audit_by_date.values;
  const userCounts = audit_by_date.user_counts || [];
  const tcodeCounts = audit_by_date.tcode_counts || [];

  console.log("Data", data);

  // const trendBarDataset = {
  //   label: "Events",
  //   data: trendValues,
  //   backgroundColor: trendLabels.map((_, i) => BAR_PALETTE[i % BAR_PALETTE.length] + "cc"),
  //   borderColor:     trendLabels.map((_, i) => BAR_PALETTE[i % BAR_PALETTE.length]),
  //   borderWidth: 0, borderRadius: 6, maxBarThickness: 48,
  // };
  // const trendLineDataset = {
  //   label: "Events",
  //   data:  trendValues,
  //   borderColor:     "#1565c0",
  //   backgroundColor: "rgba(21,101,192,0.10)",
  //   fill: true, tension: .4,
  //   pointBackgroundColor: "#1565c0", pointRadius: 4,
  // };

  console.log("TREND DATA READY:", {
    labels: trendLabels,
    users: userCounts,
    tcodes: tcodeCounts,
    events: eventsVals,
  });
  /* ── Top users bar ────────────────────────────────────────────────────── */
  const topUsersData = {
    labels: audit_by_user.labels,
    datasets: [
      {
        label: "Events",
        data: audit_by_user.values,

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
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  };

  /* ── T-code bar ──────────────────────────────────────────────────────── */
  const tcodeBarData = {
    labels: audit_by_tcode.labels,
    datasets: [
      {
        label: "Executions",
        data: audit_by_tcode.values,
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
        maxBarThickness: 32,
      },
    ],
  };

  /* ── Business group donut (matches HTML overview) ────────────────────── */
  const groupDonutData = {
    labels: groupLabels,
    datasets: [
      {
        data: groupValues,
        backgroundColor: DN_PALETTE.slice(0, groupLabels.length),
        borderWidth: 5,
        borderColor: "transparent",
      },
    ],
  };
  const groupDonutOpts = {
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
  };
  const groupTotal = groupValues.reduce((sum, v) => sum + v, 0);

  /* ── Status doughnut ─────────────────────────────────────────────────── */
  const statusDonutData = {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        data: [user_stats.active, user_stats.inactive],
        backgroundColor: ["#0d2856", "#90caf9"],
        borderWidth: 5,
        borderColor: "transparent",
      },
    ],
  };
  const donutOpts = {
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
  };

  const trendOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: "easeOutQuart" },

    interaction: {
      mode: "index",
      intersect: false,
    },

    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: { size: 10, family: "Inter" },
          color: "#2e6090",
          boxWidth: 10,
          padding: 14,
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
      },
    },

    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10, family: "Inter" },
          color: "#6a9cbf",
          maxRotation: 35,
        },
      },

      yLeft: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        grid: { color: "rgba(204,224,245,0.4)" },
        border: { color: "transparent" },
        ticks: {
          font: { size: 10, family: "Inter" },
          color: "#6a9cbf",
        },
      },

      yRight: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        border: { color: "transparent" },
        ticks: {
          font: { size: 10, family: "Inter" },
          color: "#00acc1",
        },
      },
    },
  };

  return (
    <>
      <div className="page-enter">
        {/* ── KPI strip ────────────────────────────────────────────────────── */}
        <SectionLabel>Key Performance Indicators</SectionLabel>
        <div style={grid4}>
          {kpis.map((k) => (
            <KPICard key={k.label} {...k} />
          ))}
        </div>

      {/* <ActivityChart timeseries={timeseries} /> */}
<div className="section-label">Gen AI Insights</div>

<div className="ai-insights-card">
  {/* HEADER */}
  <div className="ai-insights-header">
    <div className="ai-insights-title-wrap">
      <div className="ai-icon-wrap">✦</div>
      <div>
        <div className="ai-title">User Managment Insights</div>
        <div className="ai-subtitle">
          Powered by insights API
        </div>
      </div>
    </div>

    <button
      className="ai-gen-btn"
      onClick={() => generate(data)}
      disabled={aiLoading}
    >
      {aiLoading ? "⏳ Analysing…" : "✦ Generate Insights"}
    </button>
  </div>

  {/* BODY */}
  <div className="ai-body">

    {/* PLACEHOLDER */}
    {!insights && !aiLoading && !aiError && (
      <div className="ai-placeholder">
        <div className="ai-placeholder-text">
          Click <strong>Generate Insights</strong> to fetch AI insights.
        </div>
      </div>
    )}

    {/* LOADING */}
    {aiLoading && (
      <div className="ai-loading show">
        <div>
          <span className="ai-loading-dot"></span>
          <span className="ai-loading-dot"></span>
          <span className="ai-loading-dot"></span>
        </div>
        <div className="ai-loading-text">
          Generating portfolio insights…
        </div>
      </div>
    )}

    {/* ERROR */}
    {aiError && (
      <div className="ai-error show">{aiError}</div>
    )}

    {/* RESULT */}
    {insights && (
      <div className="ai-result show">

        {/* ✅ SUMMARY HERO */}
        <div className="ai-summary-hero">
          <div className="ai-summary-label">Executive Summary</div>
          <div className="ai-summary-text">
            {insights.insights?.[0]?.insight}
          </div>
        </div>

        {/* ✅ META STRIP */}
        <div className="ai-meta-strip">
          <div className="ai-meta-pill">
            Insights: {insights.insights.length}
          </div>
          <div className="ai-meta-pill">
            Model: {insights.llm?.model}
          </div>
          <div className="ai-meta-pill">
            RAG: {insights.meta?.rag?.enabled ? "Enabled" : "Disabled"}
          </div>
        </div>

        <div className="ai-insights-list">
          {insights.insights.map((item, i) => (
            <div key={i} className="ai-insight-card">

              {/* HEADER */}
              <div className="ai-insight-card-header">
                <div className="ai-insight-card-title">
                  <div className="ai-insight-index">{i + 1}</div>
                  <div className="ai-insight-heading">
                    Insight {i + 1}
                  </div>
                </div>

                {/* TAG (optional logic) */}
                <div className="ai-insight-tag general">
                  Insight
                </div>
              </div>

              {/* BODY */}
              <div className="ai-insight-card-body">

                {/* MAIN */}
                <div className="ai-insight-main">
                  {item.insight}
                </div>

                {/* REASONING */}
                <div className="ai-detail-section">
                  <div className="ai-detail-heading">Reasoning</div>
                  <ul className="ai-detail-list">
                    {item.reasoning.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                {/* EVIDENCE */}
                <div className="ai-detail-section">
                  <div className="ai-detail-heading">Evidence</div>
                  <ul className="ai-detail-list evidence">
                    {item.evidence.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>

  {/* FOOTER */}
  {insights && (
    <div className="ai-footer">
      <div className="ai-powered-badge">
        Generated by AI
      </div>
      <div className="ai-timestamp">
        {new Date(insights.generated_at).toLocaleString()}
      </div>
    </div>
  )}
</div>

        {/* ── Audit Activity Trend (full width) ────────────────────────────── */}
        <SectionLabel>Audit Activity Trend</SectionLabel>
        <ChartCard
          title={`${capitalise(gran === "auto" ? audit_by_date.granularity : gran)} Audit Activity`}
          subtitle="EVENT COUNT · DYNAMIC GROUPING"
          style={{ marginBottom: 16 }}
          controls={
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                className="chart-gran-badge"
                onClick={handleGranCycle}
                style={{ cursor: "pointer" }}
              >
                {gran.toUpperCase()}
              </span>
              <TabGroup tabs={GRAN_TABS} active={gran} onChange={setGran} />
              <span
                style={{
                  fontSize: ".65rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Bars = Users &amp; T-Codes &nbsp;|&nbsp; Line = Events
              </span>
            </div>
          }
        >
          <div style={{ height: 280, position: "relative" }}>
            {loading && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 10,
                  zIndex: 2,
                  fontSize: ".62rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "3px 8px",
                }}
              >
                Updating...
              </div>
            )}
            <Bar
              ref={chartRef}
              data={{
                labels: trendLabels,
                datasets: datasets,
              }}
              options={trendOpts}
            />
          </div>
        </ChartCard>

        {/* ── User & Activity Distributions ────────────────────────────────── */}
        <SectionLabel>User &amp; Activity Distributions</SectionLabel>
        <div style={grid2}>
          {/* Top Users */}
          <ChartCard
            title="Top Users by Audit Activity"
            subtitle="EVENTS PER USER (VERTICAL BAR)"
          >
            <div style={{ height: 280, position: "relative" }}>
              <Bar data={topUsersData} options={barOpts()} />
            </div>
          </ChartCard>

          {/* Group Funnel */}
          <ChartCard
            title="Activity by Business Group"
            subtitle="EVENTS BY DEPARTMENT"
          >
            <div style={{ height: 180, position: "relative" }}>
              <Doughnut data={groupDonutData} options={groupDonutOpts} />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 20px",
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid var(--border)",
              }}
            >
              {groupLabels.map((label, i) => {
                const val = groupValues[i] ?? 0;
                const pct = groupTotal ? Math.round((val / groupTotal) * 100) : 0;
                return (
                  <div
                    key={label}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: DN_PALETTE[i % DN_PALETTE.length],
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: ".75rem",
                        color: "var(--text-sub)",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: ".75rem",
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        <div style={grid2}>
          {/* T-Code bar */}
          <ChartCard
            title="Most Executed T-Codes"
            subtitle="FREQUENCY IN AUDIT LOG"
          >
            <div style={{ height: 280, position: "relative" }}>
              <Bar data={tcodeBarData} options={barOpts()} />
            </div>
          </ChartCard>

          {/* Status doughnut */}
          <ChartCard title="User Account Status" subtitle="ACTIVE VS INACTIVE">
            <div style={{ height: 180, position: "relative" }}>
              <Doughnut data={statusDonutData} options={donutOpts} />
            </div>
            {/* Legend */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 20px",
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid var(--border)",
              }}
            >
              {["Active", "Inactive"].map((label, i) => (
                <div
                  key={label}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: ["#0d2856", "#90caf9"][i],
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: ".75rem",
                      color: "var(--text-sub)",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: ".75rem",
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {[user_stats.active, user_stats.inactive][i]}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </>
  );
}

/* ── Tiny helpers ────────────────────────────────────────────────────────── */
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
function ErrorBox({ msg }) {
  return (
    <div style={{ padding: 32, color: "var(--red)", fontWeight: 600 }}>
      Error loading data: {msg}
    </div>
  );
}
function capitalise(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}

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

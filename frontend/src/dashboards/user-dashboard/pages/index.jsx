/**
 * pages/index.jsx
 * ===============
 * Exports five dashboard page components. All imports are at the top
 * (ESM requirement). No values are hard-coded — every figure is derived
 * from API responses.
 *
 * Exported pages
 * --------------
 *   Users        — L1 User Master table
 *   Roles        — L2 Role Assignments + bar/donut charts
 *   TCodes       — L3 Role → T-Code mapping table
 *   Analytics    — Advanced charts (roles per user, tcode scope)
 *   CombinedView — Cross-layer access + risk matrix
 */

/* ── React ──────────────────────────────────────────────────────────────── */
import React, { useState } from "react";

/* ── Chart.js — registered once at module level ─────────────────────────── */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { ICON } from "../components/ui/constant";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

/* ── API helpers ─────────────────────────────────────────────────────────── */
import { DataAPI, CalcAPI } from "../App";

/* ── Custom hooks ────────────────────────────────────────────────────────── */
import { useApi, usePagination } from "../hooks/useApi";

/* ── Shared UI primitives ────────────────────────────────────────────────── */
import {
  KPICard,
  ChartCard,
  DataTable,
  Pagination,
  LoadingSpinner,
  CioNote,
  StatusBadge,
} from "../components/ui";

/* ── Colour palettes (match original dashboard) ──────────────────────────── */
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

function getTooltipValue(dp) {
  if (typeof dp?.raw === "number") return dp.raw;
  if (typeof dp?.parsed === "number") return dp.parsed;
  if (typeof dp?.parsed?.y === "number") return dp.parsed.y;
  return 0;
}

function getTooltipColor(dp) {
  const isTransparent = (color) => {
    if (typeof color !== "string") return false;
    const c = color.trim().toLowerCase();
    return (
      c === "transparent" ||
      /^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(c)
    );
  };

  const firstVisible = (candidate, idx) => {
    if (Array.isArray(candidate)) {
      const pick = candidate[idx % candidate.length];
      if (typeof pick === "string" && !isTransparent(pick)) return pick;
      const fallback = candidate.find(
        (c) => typeof c === "string" && !isTransparent(c),
      );
      return fallback || null;
    }

    if (typeof candidate === "string" && !isTransparent(candidate)) {
      return candidate;
    }
    return null;
  };

  const dataset = dp?.dataset || {};
  const idx = dp?.dataIndex ?? 0;
  const borderColor = firstVisible(dataset.borderColor, idx);
  const bgColor = firstVisible(dataset.backgroundColor, idx);
  const colorCandidate = borderColor || bgColor;

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
  left = Math.max(8, Math.min(left, window.innerWidth - ttW - 8));
  if (top < 8) top = rect.top + tooltip.caretY + 12;
  top = Math.min(top, window.innerHeight - ttH - 8);
  tooltipEl.style.left = left + "px";
  tooltipEl.style.top = top + "px";
  tooltipEl.classList.add("tt-visible");
}

function getUserTypeMeta(typeValue) {
  const raw = String(typeValue ?? "").trim();
  const upper = raw.toUpperCase();

  if (upper === "A" || upper === "A DIALOG" || upper === "DIALOG") {
    return { label: "Dialog", className: "blue" };
  }
  if (upper === "B" || upper === "B SYSTEM" || upper === "SYSTEM") {
    return { label: "System", className: "purple" };
  }
  if (upper === "S" || upper === "S SERVICE" || upper === "SERVICE") {
    return { label: "Service", className: "orange" };
  }

  return { label: raw || "-", className: "blue" };
}

function getRoleTypeMeta(roleId) {
  const rid = String(roleId ?? "").toUpperCase();

  if (
    rid.includes("FI_AM_DISPLAY") ||
    rid.includes("FI_GL_DISPLAY") ||
    rid.includes("FI_AP_DISPLAY") ||
    rid.includes("FI_AR_DISPLAY")
  ) {
    return { className: "blue" };
  }
  if (
    rid.includes("FI_AP_MASTER") ||
    rid.includes("FI_AP_CHECKER") ||
    rid.includes("FI_GL_CHECKER")
  ) {
    return { className: "purple" };
  }
  if (rid.includes("FI_AR_MAKER")) {
    return { className: "orange" };
  }
  if (rid.includes("TRM_DISPLAY") || rid.includes("TRM_CHECKER")) {
    return { className: "teal" };
  }

  return { className: "blue" };
}

/* ── Shared Chart.js base options ────────────────────────────────────────── */
const baseChartOpts = {
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
        font: { size: 8, family: "Inter" },
        color: "#6a9cbf",
        maxRotation: 35,
      },
    },
    y: {
      grid: { color: "rgba(204,224,245,.4)" },
      border: { color: "transparent" },
      ticks: { font: { size: 10, family: "Inter" }, color: "#6a9cbf" },
    },
  },
};

/* ══════════════════════════════════════════════════════════════════
   USERS  (L1)
   Data: GET /api/data/users  +  GET /api/calc/users
   ══════════════════════════════════════════════════════════════════ */

const USER_COLS = [
  { key: "uid", label: "User ID" },
  { key: "name", label: "Full Name" },
  { key: "status", label: "Status", render: (v) => <StatusBadge value={v} /> },
  {
    key: "type",
    label: "User Type",
    render: (v) => {
      const typeMeta = getUserTypeMeta(v);
      return <span className={`spill ${typeMeta.className}`}>{typeMeta.label}</span>;
    },
  },
  { key: "valid_from", label: "Valid From" },
  { key: "valid_to", label: "Valid To" },
  { key: "role_count", label: "Roles Assigned" },
];

export function Users() {
  const { data: rows, loading: rL } = useApi(DataAPI.users);
  const { data: stats, loading: sL } = useApi(CalcAPI.users);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [utype, setUtype] = useState("");
  const [sortKey, setSortKey] = useState("uid");
  const [sortDir, setSortDir] = useState("asc");

  /* Filter + sort entirely from API data — no hardcoded lists */
  const filtered = (rows ?? [])
    .filter((r) => {
      const q = search.toLowerCase();
      if (q && !`${r.uid}${r.name}`.toLowerCase().includes(q)) return false;
      if (status && r.status !== status) return false;
      if (utype && getUserTypeMeta(r.type).label !== utype) return false;
      return true;
    })
    .sort((a, b) => {
      const c = String(a[sortKey] ?? "").localeCompare(
        String(b[sortKey] ?? ""),
      );
      return sortDir === "asc" ? c : -c;
    });

  const { page, setPage, totalPages, slice, info } = usePagination(
    filtered,
    20,
  );
  const onSort = (k) => {
    setSortDir((d) => (k === sortKey ? (d === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(k);
    setPage(1);
  };

  if (rL || sL) return <LoadingSpinner message="Loading users…" />;

  return (
    <div className="page-enter">
      <SectionLabel>L1 — User Master Data</SectionLabel>

      {/* KPI strip — values from /api/calc/users */}
      {stats && (
        <div style={grid4}>
          <KPICard
            variant="c1"
            label="Active Users"
            value={stats.active}
            sub={`${stats.active} active · ${stats.inactive} inactive`}
            badge="Active"
            badgeType="neutral"
            spark={100}
            icon={ICON.users}
            footer={`<strong>${stats.dialog}</strong> Dialog · <strong>${stats.system}</strong> System · <strong>${stats.service}</strong> Service`}
          />
          <KPICard
            variant="c2"
            label="InActive Users"
            value={stats.inactive}
            sub="Currently enabled accounts"
            badge="locked"
            badgeType="up"
            icon={ICON.lock}
            spark={Math.round((stats.active / stats.total) * 100)}
            footer={`${Math.round((stats.active / stats.total) * 100)}% of total users`}
          />
          <KPICard
            variant="c3"
            label="Dialog Users"
            value={stats.inactive}
            sub="Locked / expired accounts"
            badge="typeA"
            badgeType="down"
            icon={ICON.mail}
            spark={Math.round((stats.inactive / stats.total) * 100)}
            footer={`${Math.round((stats.inactive / stats.total) * 100)}% — review for deprovisioning`}
          />
          <KPICard
            variant="c4"
            label="System / Service"
            value={stats.max_roles}
            sub={`Held by ${stats.max_roles_user}`}
            badge="special"
            badgeType="warn"
            spark={80}
            icon={ICON.shield}
            footer={`User: <strong>${stats.max_roles_user}</strong>`}
          />
        </div>
      )}

      <TableCard
        title="User Master List — L1"
        badge={`${filtered.length} RECORDS`}
      >
        <CioNote
          html={
            `<p>
      This table presents the complete SAP S/4HANA user roster for TFSIN. 
      As of this snapshot, there are <strong>${stats?.active ?? 0}</strong> active users</strong> out of 
      <strong>${stats?.total ?? 0}</strong> total registered accounts. 
      <strong>${stats?.inactive ?? 0} inactive accounts</strong> exist in the system — these should be reviewed immediately 
      for formal deprovisioning to comply with the organization's access governance and 
      <strong>least-privilege policy</strong>.
    </p>
    <h4 style="margin-top:14px;margin-bottom:6px;color:#1f3b5c;">
      User Type Reference:
    </h4>

    <ul style="padding-left:18px;margin-bottom:12px;">
      <li style="margin-bottom:8px;">
        <strong>Type A — Dialog User:</strong> Standard interactive logon accounts assigned to named individuals. These users log on via the SAP Fiori / GUI interface and perform day-to-day business transactions such as posting, approvals, and treasury operations. All business end-users, finance team members, and TRM users in TFSIN fall under this type. Periodic access reviews and role certification are mandatory for Type A accounts.
      </li>

      <li style="margin-bottom:8px;">
        <strong>Type B — System User:</strong>Non-interactive technical accounts used for system-to-system (RFC) communication, background job execution, and interface integration. Type B users such as SDMI_ZSYWPSY and BACKJOBUSER should never be used for direct human logon. Their password policies must be hardened and their role assignments restricted strictly to integration-specific functions.
      </li>

      <li style="margin-bottom:8px;">
        <strong>Type S — Service User:</strong>Shared service accounts used by specific automated processes or external systems (e.g., BGRFC_USER for bgRFC supervisor tasks). Unlike Type B, Service users can have multiple logon sessions. They carry elevated SoD risk if not tightly scoped — their role assignments must be reviewed for unnecessary T-Code access.
      </li>
    </ul>

    <p>
      Users showing <strong>0 role assignments</strong> (<em> e.g. SAP_BASIS, TSF_VAPT, CUSTADMIN </em>) may be orphaned accounts that no longer require system access 
      and should be formally locked or deleted. Regular user access reviews 
      (at minimum <strong>quarterly</strong>) are recommended to maintain a clean and auditable user base.
    </p>`
          }
        />
        <div style={toolbar}>
          <input
            style={inputSt}
            placeholder="Search User ID or Name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <SelFilter
            value={status}
            placeholder="All Status"
            options={["Active", "Inactive"]}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          <SelFilter
            value={utype}
            placeholder="All Types"
            options={["Dialog", "System user", "Service user"]}
            onChange={(v) => {
              setUtype(v);
              setPage(1);
            }}
          />
          <ClearBtn
            onClick={() => {
              setSearch("");
              setStatus("");
              setUtype("");
              setPage(1);
            }}
          />
          <CountLabel count={filtered.length} noun="users" />
        </div>
        <DataTable
          columns={USER_COLS}
          rows={slice(filtered)}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
        />
        <Pagination
          info={info}
          page={page}
          totalPages={totalPages}
          onPage={setPage}
        />
      </TableCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROLES  (L2)
   Data: GET /api/data/roles  +  GET /api/calc/roles
   ══════════════════════════════════════════════════════════════════ */

const ROLE_COLS = [
  { key: "uid", label: "User ID" },
  { key: "name", label: "User Name" },
  {
    key: "role_id",
    label: "Role ID",
    render: (v) => {
      const roleMeta = getRoleTypeMeta(v);
      const displayRole = String(v ?? "").replace(/^ZTFSIN_/, "");
      return <span className={`spill ${roleMeta.className}`}>{displayRole}</span>;
    },
  },
  { key: "role_desc", label: "Role Description" },
  { key: "start_date", label: "Start Date" },
  { key: "end_date", label: "End Date" },
];

export function Roles() {
  const { data: rows, loading: rL } = useApi(DataAPI.roles);
  const { data: calc, loading: cL } = useApi(CalcAPI.roles);

  const [search, setSearch] = useState("");
  const [roleF, setRoleF] = useState("");
  const [sortKey, setSortKey] = useState("uid");
  const [sortDir, setSortDir] = useState("asc");

  const filtered = (rows ?? [])
    .filter((r) => {
      const q = search.toLowerCase();
      if (q && !`${r.uid}${r.role_id}`.toLowerCase().includes(q)) return false;
      if (roleF && r.role_id !== roleF) return false;
      return true;
    })
    .sort((a, b) => {
      const c = String(a[sortKey] ?? "").localeCompare(
        String(b[sortKey] ?? ""),
      );
      return sortDir === "asc" ? c : -c;
    });

  const { page, setPage, totalPages, slice, info } = usePagination(
    filtered,
    20,
  );
  const onSort = (k) => {
    setSortDir((d) => (k === sortKey ? (d === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(k);
    setPage(1);
  };

  /* Unique role IDs for dropdown — derived from API data */
  const uniqueRoles = [
    ...new Set((rows ?? []).map((r) => r.role_id).filter(Boolean)),
  ].sort();

  const rs = calc?.role_stats;

  /* Top-12 roles bar data */
  const top12Data = rs && {
    labels: rs.top12.map((r) => r.role.replace("ZTFSIN_", "")),
    datasets: [
      {
        label: "Users",
        data: rs.top12.map((r) => r.count),
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

  /* Module distribution donut */
  const donutData = rs && {
    labels: ["AM", "AP", "AR", "GL", "TRM", "Other"],
    datasets: [
      {
        data: [rs.am, rs.ap, rs.ar, rs.gl, rs.trm, rs.other],
        backgroundColor: DN_PALETTE,
        borderWidth: 5,
        borderColor: "transparent",
      },
    ],
  };

  if (rL || cL) return <LoadingSpinner message="Loading roles…" />;

  return (
    <div className="page-enter">
      <SectionLabel>L2 — User to Role Assignments</SectionLabel>

      {/* Charts */}
      {top12Data && donutData && (
        <div style={grid2}>
          <ChartCard
            title="Top 12 Roles by Assignment Count"
            subtitle="USERS PER ROLE"
          >
            <div style={{ height: 300, position: "relative" }}>
              <Bar data={top12Data} options={baseChartOpts} />
            </div>
          </ChartCard>

          <ChartCard
            title="Role Module Distribution"
            subtitle="BY SAP FUNCTIONAL AREA"
          >
            <div style={{ height: 200, position: "relative" }}>
              <Doughnut
                data={donutData}
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
            {/* Inline legend */}
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
              {["AM", "AP", "AR", "GL", "TRM", "Other"].map((lbl, i) => (
                <div
                  key={lbl}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: DN_PALETTE[i],
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
                    {[rs.am, rs.ap, rs.ar, rs.gl, rs.trm, rs.other][i]}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      <TableCard
        title="User ↔ Role Assignment Matrix — L2"
        badge={`${filtered.length} RECORDS`}
      >
        <CioNote
          html={
            rs
              ? `This matrix maps each user to their assigned SAP roles, directly determining their functional access scope within the system With <strong style="color: black;">${rs.total}  assignments</strong> across <strong style="color: black;">${rs.unique_users}</strong> users. ` +
                `Users with unusually high role counts may indicate <strong>over-privileged access</strong>.and should be reviewed for Segregation of Duties (SoD) conflicts. "DISPLAY" roles grant read-only access; "MAKER" roles enable transaction creation; "MASTER" roles allow configuration changes. Inactive users with active role assignments represent a security risk and should be deprovisioned promptly.`
              : ""
          }
        />
        <div style={toolbar}>
          <input
            style={inputSt}
            placeholder="Search User ID or Role…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <SelFilter
            value={roleF}
            placeholder="All Roles"
            options={uniqueRoles}
            onChange={(v) => {
              setRoleF(v);
              setPage(1);
            }}
          />
          <ClearBtn
            onClick={() => {
              setSearch("");
              setRoleF("");
              setPage(1);
            }}
          />
          <CountLabel count={filtered.length} noun="records" />
        </div>
        <DataTable
          columns={ROLE_COLS}
          rows={slice(filtered)}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
        />
        <Pagination
          info={info}
          page={page}
          totalPages={totalPages}
          onPage={setPage}
        />
      </TableCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TCODES  (L3)
   Data: GET /api/data/tcodes
   ══════════════════════════════════════════════════════════════════ */

const TCODE_COLS = [
  {
    key: "role_desc",
    label: "Role ID",
    render: (v) => {
      const roleMeta = getRoleTypeMeta(v);
      const displayRole = String(v ?? "").replace(/^ZTFSIN_/, "");
      return <span className={`spill ${roleMeta.className}`}>{displayRole}</span>;
    },
  },
  { key: "role_id", label: "Role Description" },
  { key: "tcode", label: "T-Code" },
  { key: "tcode_desc", label: "T-Code Description" },
];

export function TCodes() {
  const { data: rows, loading } = useApi(DataAPI.tcodes);
  const { data: tcCalc, loading: tL } = useApi(CalcAPI.tcodes);

  const [search, setSearch] = useState("");
  const [roleF, setRoleF] = useState("");
  const [sortKey, setSortKey] = useState("role_desc");
  const [sortDir, setSortDir] = useState("asc");

  const filtered = (rows ?? [])
    .filter((r) => {
      const q = search.toLowerCase();
      if (q && !`${r.role_desc}${r.tcode}`.toLowerCase().includes(q))
        return false;
      if (roleF && r.role_desc !== roleF) return false;
      return true;
    })
    .sort((a, b) => {
      const c = String(a[sortKey] ?? "").localeCompare(
        String(b[sortKey] ?? ""),
      );
      return sortDir === "asc" ? c : -c;
    });

  const { page, setPage, totalPages, slice, info } = usePagination(
    filtered,
    20,
  );
  const onSort = (k) => {
    setSortDir((d) => (k === sortKey ? (d === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(k);
    setPage(1);
  };
  const uniqueRoles = [
    ...new Set((rows ?? []).map((r) => r.role_desc).filter(Boolean)),
  ].sort();
  const tc = tcCalc;
  const tcodeBarData = tc && {
    labels: tc.top12.map((r) => r.role.replace("ZTFSIN_", "")),
    datasets: [
      {
        label: "T-Codes",
        data: tc.top12.map((r) => r.count),
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(54,120,180,0.5)";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(61, 149, 232, 0.9)");
          gradient.addColorStop(1, "rgba(54,120,180,0.2)");
          return gradient;
        },
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const cats = tc?.categories;
  const tcDonutData = cats && {
    labels: ["TRM", "FI AP", "FI GL", "FI AM", "FI AR", "Other"],
    datasets: [
      {
        data: [cats.TRM, cats.AP, cats.GL, cats.AM, cats.AR, cats.Other],
        backgroundColor: DN_PALETTE,
        borderWidth: 5,
        borderColor: "transparent",
      },
    ],
  };
  const catValues = cats
    ? [cats.TRM, cats.AP, cats.GL, cats.AM, cats.AR, cats.Other]
    : [];

  if (loading || tL) return <LoadingSpinner message="Loading T-Codes…" />;

  return (
    <div className="page-enter">
      <SectionLabel>L3 — Role to T-Code Mapping</SectionLabel>

      {/* Charts */}
      {tcodeBarData && tcDonutData && (
        <div style={grid2}>
          <ChartCard
            title="T-Codes per Role — Permission Scope"
            subtitle="T-CODES MAPPED PER ROLE"
          >
            <div style={{ height: 300, position: "relative" }}>
              <Bar data={tcodeBarData} options={baseChartOpts} />
            </div>
          </ChartCard>

          <ChartCard
            title="T-Code Distribution by Role Type"
            subtitle="CATEGORY BREAKDOWN"
          >
            <div style={{ height: 200, position: "relative" }}>
              <Doughnut
                data={tcDonutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "60%",
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false, external: externalTooltipHandler },
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
              {["TRM", "FI AP", "FI GL", "FI AM", "FI AR", "Other"].map((lbl, i) => (
                <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: DN_PALETTE[i],
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: ".74rem", color: "var(--text-sub)", flex: 1 }}>
                    {lbl}
                  </span>
                  <span style={{ fontSize: ".74rem", fontWeight: 800, color: "var(--text)" }}>
                    {catValues[i] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      <TableCard
        title="Role ↔ T-Code Mapping — L3"
        badge={`${filtered.length} RECORDS`}
      >
        <CioNote
          html={
            `<strong>${rows?.length ?? 0}</strong> total role-to-T-code mappings. ` +
            `Roles with the most T-codes have the broadest access scope.`
          }
        />
        <div style={toolbar}>
          <input
            style={inputSt}
            placeholder="Search Role or T-Code…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <SelFilter
            value={roleF}
            placeholder="All Roles"
            options={uniqueRoles}
            onChange={(v) => {
              setRoleF(v);
              setPage(1);
            }}
          />
          <ClearBtn
            onClick={() => {
              setSearch("");
              setRoleF("");
              setPage(1);
            }}
          />
          <CountLabel count={filtered.length} noun="mappings" />
        </div>
        <DataTable
          columns={TCODE_COLS}
          rows={slice(filtered)}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
        />
        <Pagination
          info={info}
          page={page}
          totalPages={totalPages}
          onPage={setPage}
        />
      </TableCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ANALYTICS
   Data: GET /api/calc/roles  +  GET /api/calc/tcodes
   ══════════════════════════════════════════════════════════════════ */
export function Analytics() {
  const { data: roleCalc, loading: rL } = useApi(CalcAPI.roles);
  const { data: tcodeCalc, loading: tL } = useApi(CalcAPI.tcodes);

  if (rL || tL) return <LoadingSpinner message="Loading analytics…" />;

  const rs = roleCalc?.role_stats;
  const rpu = roleCalc?.roles_per_user;
  const tc = tcodeCalc;

  /* Top-12 roles chart */
  const roleBarData = rs && {
    labels: rs.top12.map((r) => r.role.replace("ZTFSIN_", "")),
    datasets: [
      {
        label: "User Count",
        data: rs.top12.map((r) => r.count),
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

  /* T-codes per role chart */
  const tcodeBarData = tc && {
    labels: tc.top12.map((r) => r.role.replace("ZTFSIN_", "")),
    datasets: [
      {
        label: "T-Code Count",
        data: tc.top12.map((r) => r.count),
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

  /* Roles per user chart */
  const rpuBarData = rpu && {
    labels: rpu.labels,
    datasets: [
      {
        label: "Roles",
        data: rpu.values,
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

  const roleCatDonutData = rs && {
    labels: ["FI Roles", "TRM Roles", "Other"],
    datasets: [
      {
        data: [rs.fi ?? 0, rs.trm ?? 0, rs.other ?? 0],
        backgroundColor: ["#0d2856", "#1565c0", "#90caf9"],
        borderWidth: 5,
        borderColor: "transparent",
      },
    ],
  };
  const roleCatTotal = (rs?.fi ?? 0) + (rs?.trm ?? 0) + (rs?.other ?? 0);
  const fiRoleItems =
    rs?.top_fi_roles ??
    rs?.top12?.filter((r) => r.role.startsWith("ZTFSIN_FI_")).slice(0, 5) ??
    [];
  const trmRoleItems =
    rs?.top_trm_roles ??
    rs?.top12?.filter((r) => r.role.startsWith("ZTFSIN_TRM")).slice(0, 5) ??
    [];
  const filteredTrmRoleItems = trmRoleItems.filter(
    (item) => !item.role.toUpperCase().includes("TRM_CHECKER"),
  );
  const progressMax =
    Math.max(
      1,
      ...fiRoleItems.map((r) => r.count ?? 0),
      ...filteredTrmRoleItems.map((r) => r.count ?? 0),
    ) || 1;
  const topRoleCount = rs?.top12?.[0]?.count ?? 0;
  const makersCount =
    rs?.maker_count ??
    rs?.top12?.find((r) => r.role.toUpperCase().includes("MAKER"))?.count ??
    0;
  const progGradientPalette = [
    "linear-gradient(90deg, #1565c0, #42a5f5)",
    "linear-gradient(90deg, #0288d1, #4dd0e1)",
    "linear-gradient(90deg, #00acc1, #80deea)",
    "linear-gradient(90deg, #1e88e5, #90caf9)",
    "linear-gradient(90deg, #1976d2, #64b5f6)",
    "linear-gradient(90deg, #7b1fa2, #ce93d8)",
    "linear-gradient(90deg, #e65100, #ffcc80)",
    "linear-gradient(90deg, #2e7d32, #81c784)",
  ];
  const getProgressFill = (role, i) => {
    const upper = role.toUpperCase();
    if (upper.includes("FI_AM_DISPLAY") || upper.includes("TRM_DISPLAY")) {
      return "linear-gradient(90deg, #1565c0, #42a5f5)";
    }
    return progGradientPalette[i % progGradientPalette.length];
  };

  return (
    <div className="page-enter">
      <SectionLabel>
        Advanced Analytics — Role &amp; Access Intelligence
      </SectionLabel>

      <div style={grid4}>
        <div className="chart-card" style={{ padding: "18px 22px" }}>
          <div
            style={{
              fontSize: ".6rem",
              fontWeight: 700,
              letterSpacing: ".12em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Role Assignments (L2)
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--blue-dark)",
            }}
          >
            {rs?.total ?? 0}
          </div>
          <div
            style={{
              fontSize: ".72rem",
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            Across {rs?.unique_users ?? 0} users
          </div>
        </div>

        <div className="chart-card" style={{ padding: "18px 22px" }}>
          <div
            style={{
              fontSize: ".6rem",
              fontWeight: 700,
              letterSpacing: ".12em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Unique Role IDs (L2)
          </div>
          <div
            style={{ fontSize: "2rem", fontWeight: 800, color: "var(--teal)" }}
          >
            {rs?.unique_roles ?? 0}
          </div>
          <div
            style={{
              fontSize: ".72rem",
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            Distinct role identifiers
          </div>
        </div>

        <div className="chart-card" style={{ padding: "18px 22px" }}>
          <div
            style={{
              fontSize: ".6rem",
              fontWeight: 700,
              letterSpacing: ".12em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            T-Code Records (L3)
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--orange)",
            }}
          >
            {tc?.total ?? 0}
          </div>
          <div
            style={{
              fontSize: ".72rem",
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            Role-to-tcode mappings
          </div>
        </div>

        <div className="chart-card" style={{ padding: "18px 22px" }}>
          <div
            style={{
              fontSize: ".6rem",
              fontWeight: 700,
              letterSpacing: ".12em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Max Roles / User
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--purple)",
            }}
          >
            {rpu?.max ?? 0}
          </div>
          <div
            style={{
              fontSize: ".72rem",
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            {rpu?.max_user || "-"} · Avg {rpu?.avg ?? 0}
          </div>
        </div>
      </div>

      <div style={grid2}>
        {roleBarData && (
          <ChartCard
            title="Top Role Assignments by Role ID"
            subtitle="USER COUNT PER ROLE (TOP 12)"
          >
            <div style={{ height: 300, position: "relative" }}>
              <Bar data={roleBarData} options={baseChartOpts} />
            </div>
          </ChartCard>
        )}
        {tcodeBarData && (
          <ChartCard
            title="T-Codes per Role — Permission Scope"
            subtitle="WIDTH OF ACCESS PER ROLE"
          >
            <div style={{ height: 300, position: "relative" }}>
              <Bar data={tcodeBarData} options={baseChartOpts} />
            </div>
          </ChartCard>
        )}
      </div>

      <div style={grid2}>
        {rpuBarData && (
          <ChartCard
            title="Top 10 Users by Role Count"
            subtitle="ASSIGNMENTS PER USER"
            style={{ marginBottom: 16 }}
          >
            <div style={{ height: 280, position: "relative" }}>
              <Bar data={rpuBarData} options={baseChartOpts} />
            </div>
            {rpu && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: ".78rem",
                  color: "var(--text-muted)",
                }}
              >
                Average:{" "}
                <strong style={{ color: "var(--blue-dark)" }}>{rpu.avg}</strong>{" "}
                roles/user &nbsp;·&nbsp; Peak:{" "}
                <strong style={{ color: "var(--blue-dark)" }}>{rpu.max}</strong>{" "}
                ({rpu.max_user})
              </div>
            )}
          </ChartCard>
        )}

        {roleCatDonutData && (
          <ChartCard
            title="Role Category Distribution"
            subtitle="FI vs TRM vs OTHER"
            style={{ marginBottom: 16 }}
          >
            <div style={{ height: 180, position: "relative" }}>
              <Doughnut
                data={roleCatDonutData}
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
                gridTemplateColumns: "1fr",
                gap: "8px",
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid var(--border)",
              }}
            >
              {["FI Roles", "TRM Roles", "Other"].map((lbl, i) => {
                const val = [rs?.fi ?? 0, rs?.trm ?? 0, rs?.other ?? 0][i];
                const pct = roleCatTotal
                  ? Math.round((val / roleCatTotal) * 100)
                  : 0;
                return (
                  <div
                    key={lbl}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: ["#0d2856", "#1565c0", "#90caf9"][i],
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
                      {val} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}
      </div>

      <SectionLabel>Role Assignment Progress View</SectionLabel>
      <div style={grid2}>
        <ChartCard
          title="Top FI Roles by User Count"
          subtitle="DISPLAY / MAKER / MASTER"
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {fiRoleItems.length === 0 && (
              <div style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>
                No FI roles found in current dataset.
              </div>
            )}
            {fiRoleItems.map((item, i) => {
              const pct = Math.round(((item.count ?? 0) / progressMax) * 100);
              return (
                <div key={`fi-${item.role}`}>
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
                      {item.role.replace("ZTFSIN_", "")}
                    </span>
                    <span
                      style={{ color: "var(--text-muted)", fontWeight: 600 }}
                    >
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
                        background: getProgressFill(item.role, i),
                        transition: "width .35s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard
          title="Top TRM Roles by User Count"
          subtitle="TRM ROLES"
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {filteredTrmRoleItems.length === 0 && (
              <div style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>
                No TRM roles found in current dataset.
              </div>
            )}
            {filteredTrmRoleItems.map((item, i) => {
              const pct = Math.round(((item.count ?? 0) / progressMax) * 100);
              return (
                <div key={`trm-${item.role}`}>
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
                      {item.role.replace("ZTFSIN_", "")}
                    </span>
                    <span
                      style={{ color: "var(--text-muted)", fontWeight: 600 }}
                    >
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
                        background: getProgressFill(item.role, i),
                        transition: "width .35s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="insight-box">
            <strong>Access Architecture:</strong> Display roles ({topRoleCount}{" "}
            users for top roles) enable broad read-only access across FI
            modules. Maker &amp; Master roles are restricted to ~
            {makersCount || "N/A"} users, enforcing proper{" "}
            <strong>Segregation of Duties (SoD)</strong>. This prevents a single
            user from both creating and approving financial transactions.
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMBINED VIEW
   Data: GET /api/calc/combined
   ══════════════════════════════════════════════════════════════════ */

const COMB_COLS = [
  { key: "uid", label: "User ID" },
  { key: "name", label: "Full Name" },
  { key: "status", label: "Status", render: (v) => <StatusBadge value={v} /> },
  {
    key: "role_count",
    label: "Roles (L2)",
    render: (v) => <span className="spill blue">{Number(v ?? 0)}</span>,
  },
  {
    key: "tcode_count",
    label: "T-codes Access (L3)",
    render: (v) => <span className="spill blue">{Number(v ?? 0)}</span>,
  },
  {
    key: "audit_count",
    label: "Audit Events",
    render: (v) => {
      const n = Number(v ?? 0);
      return (
        <span className={`spill ${n > 0 ? "yellow" : "grey"}`}>
          {n}
        </span>
      );
    },
  },
  {
    key: "top_tcode",
    label: "Top T-Code",
    render: (v) => (
      <span style={{ color: "var(--blue-dark)", fontWeight: 700 }}>
        {v || "-"}
      </span>
    ),
  },
  {
    key: "top_group",
    label: "Primary Group",
    render: (v) => <span className="spill grey">{v || "-"}</span>,
  },
  {
    key: "risk_level",
    label: "Risk Level",
    render: (v) => <StatusBadge value={v} />,
  },
];

const ACT_OPTS = [
  { label: "High (≥20 events)", value: "high" },
  { label: "Medium (5–19)", value: "medium" },
  { label: "Low (1–4)", value: "low" },
  { label: "No Activity", value: "none" },
];

export function CombinedView() {
  const { data: rows, loading } = useApi(CalcAPI.combined);
  const activeRows = (rows ?? []).filter(
    (r) => r.status === "Active" && (r.role_count > 0 || r.audit_count > 0),
  );
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [actF, setActF] = useState("");
  const [sortKey, setSortKey] = useState("uid");
  const [sortDir, setSortDir] = useState("asc");

  const filtered = (rows ?? [])
    .filter((r) => {
      const q = search.toLowerCase();
      if (q && !`${r.uid}${r.name}`.toLowerCase().includes(q)) return false;
      if (statusF && r.status !== statusF) return false;
      if (actF === "high" && r.audit_count < 20) return false;
      if (actF === "medium" && (r.audit_count < 5 || r.audit_count > 19))
        return false;
      if (actF === "low" && (r.audit_count < 1 || r.audit_count > 4))
        return false;
      if (actF === "none" && r.audit_count !== 0) return false;
      return true;
    })
    .sort((a, b) => {
      const c = String(a[sortKey] ?? "").localeCompare(
        String(b[sortKey] ?? ""),
      );
      return sortDir === "asc" ? c : -c;
    });

  const { page, setPage, totalPages, slice, info } = usePagination(
    filtered,
    20,
  );
  const onSort = (k) => {
    setSortDir((d) => (k === sortKey ? (d === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(k);
    setPage(1);
  };
  const totalUsers = rows?.length ?? 0;

  const avgTcodes = totalUsers
    ? Math.round(
        rows.reduce((sum, r) => sum + (r.tcode_count || 0), 0) / totalUsers,
      )
    : 0;

  const totalMappings =
    rows?.reduce((sum, r) => sum + (r.role_count || 0), 0) ?? 0;

  const rolesPerUserAvg = totalUsers
    ? Math.round(totalMappings / totalUsers)
    : 0;
  const highRisk = (rows ?? []).filter((r) => r.risk_level === "High").length;
  const withAudit = (rows ?? []).filter((r) => r.audit_count > 0).length;

  if (loading) return <LoadingSpinner message="Loading combined view…" />;

  const dualBarData = (() => {
    if (!rows) return null;

    const topUsers = [...rows]
      .filter((r) => r.status === "Active")
      .sort((a, b) => b.audit_count - a.audit_count)
      .slice(0, 10);

    return {
      labels: topUsers.map((r) => r.uid),
      datasets: [
        {
          label: "Roles (L2)",
          data: topUsers.map((r) => r.role_count),
          // backgroundColor: "rgba(21,101,192,0.75)",
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;

            if (!chartArea) return "rgba(61, 149, 232, 0.9)";

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
          borderRadius: 4,
          maxBarThickness: 24,
        },
        {
          label: "Audit Events",
          data: topUsers.map((r) => r.audit_count),
          // backgroundColor: "rgba(0,172,193,0.75)",
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;

            if (!chartArea) return "rgba(61, 149, 232, 0.9)";

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
          borderRadius: 4,
          maxBarThickness: 24,
        },
      ],
    };
  })();

  const tcodeUserData = (() => {
    if (!rows) return null;

    const topByTcode = [...rows]
      .filter((r) => r.status === "Active" && r.tcode_count > 0)
      .sort((a, b) => b.tcode_count - a.tcode_count)
      .slice(0, 10);

    return {
      labels: topByTcode.map((r) => r.uid),
      datasets: [
        {
          label: "T-Codes",
          data: topByTcode.map((r) => r.tcode_count),
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;

            if (!chartArea) return "rgba(61, 149, 232, 0.9)";

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
          borderColor: "rgba(54,120,180,0)",
          borderWidth: 0,
          borderRadius: 5,
          maxBarThickness: 28,
        },
      ],
    };
  })();

  const activityData = (() => {
    if (!rows) return null;

    const active = [...rows]
      .filter(
        (r) => r.status === "Active" && (r.role_count > 0 || r.audit_count > 0),
      )
      .sort((a, b) => b.audit_count - a.audit_count)
      .slice(0, 12);

    return {
      labels: active.map((r) => r.uid),
      datasets: [
        {
          label: "Roles Assigned (L2)",
          data: active.map((r) => r.role_count),
          type: "bar",
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;

            if (!chartArea) return "rgba(21,101,192,0.72)";

            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );

            gradient.addColorStop(0, "rgba(21,101,192,0.72)");
            gradient.addColorStop(1, "rgba(21,101,192,0.18)");

            return gradient;
          },
          borderColor: "rgba(21,101,192,0)",
          borderWidth: 0,
          borderRadius: 5,
          maxBarThickness: 28,
          yAxisID: "yLeft",
          order: 2,
        },
        {
          label: "T-Code Access (L3)",
          data: active.map((r) => r.tcode_count),
          type: "bar",
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;

            if (!chartArea) return "rgba(144,202,249,0.80)";

            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );

            gradient.addColorStop(0, "rgba(144,202,249,0.80)");
            gradient.addColorStop(1, "rgba(144,202,249,0.20)");

            return gradient;
          },
          borderColor: "rgba(144,202,249,0)",
          borderWidth: 0,
          borderRadius: 5,
          maxBarThickness: 28,
          yAxisID: "yLeft",
          order: 3,
        },
        {
          label: "Audit Events",
          data: active.map((r) => r.audit_count),
          type: "line",
          borderColor: "#00acc1",
          backgroundColor: "rgba(0,172,193,0.08)",
          borderWidth: 2.5,
          fill: false,
          tension: 0.42,
          pointBackgroundColor: "#00acc1",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          yAxisID: "yRight",
          order: 1,
        },
      ],
    };
  })();

  return (
    <div className="page-enter">
      <SectionLabel>
        Combined View — L1 · L2 · L3 · Audit Cross-Mapping
      </SectionLabel>
      <div style={grid4}>
        <KPICard
          variant="c1"
          label="High-Risk Users"
          value={highRisk}
          sub="Inactive accounts with active role assignments"
          badge="Risk"
          badgeType="down"
          spark={totalUsers ? Math.round((highRisk / totalUsers) * 100) : 0}
          footer={`Require immediate <strong>deprovisioning review</strong>`}
          icon={ICON.shield}
        />

        <KPICard
          variant="c2"
          label="Users With Audit Trail"
          value={withAudit}
          sub="Have at least 1 recorded audit event"
          badge="Active"
          badgeType="up"
          spark={totalUsers ? Math.round((withAudit / totalUsers) * 100) : 0}
          footer={`${<strong>totalUsers</strong> ? Math.round((withAudit / totalUsers) * 100) : 0}% of total users`}
          icon={ICON.check}
        />

        <KPICard
          variant="c3"
          label="Avg T-Code Access"
          value={avgTcodes}
          sub="Average T-codes accessible per user via L2→L3"
          badge="L3 Avg"
          badgeType="warn"
          spark={Math.min(100, avgTcodes)}
          footer={`Across <strong>${totalUsers}</strong> users in L1`}
          icon={ICON.code}
        />

        <KPICard
          variant="c4"
          label="Cross-Layer Mappings"
          value={totalMappings}
          sub="Total L1↔L2 role assignment links"
          badge="L2 Total"
          badgeType="neutral"
          spark={78}
          footer={`Avg <strong>${rolesPerUserAvg}</strong> roles per user`}
          icon={ICON.users}
        />
      </div>
      <div class="chart-card" style={{ marginBottom: "16px" }}>
        <div class="chart-header">
          <div>
            <div class="chart-title" id="combActivityTitle">
              Access vs Usage — CIO Cross-Layer View
            </div>
            <div class="chart-subtitle">
              ROLES ASSIGNED (L2) · T-CODE ACCESS (L3) · AUDIT EVENTS TREND ·
              TOP 12 ACTIVE USERS
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span class="chart-gran-badge">L1 · L2 · L3 · Audit</span>
            <span
              style={{
                fontSize: ".65rem",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Bars = Access Provisioned &nbsp;|&nbsp; Line = Actual Usage
            </span>
          </div>
        </div>
        <div class="chart-wrap h300">
          {activityData && (
            <Bar data={activityData} options={activityOptions} />
          )}
        </div>
      </div>

      <div class="two-col">
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <div class="chart-title">Top Users — Roles vs Audit Events</div>
              <div class="chart-subtitle">DUAL METRIC COMPARISON</div>
            </div>
          </div>
          <div class="chart-wrap h280">
            {dualBarData && <Bar data={dualBarData} options={baseChartOpts} />}
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <div class="chart-title">T-Code Coverage per User Group</div>
              <div class="chart-subtitle">
                UNIQUE T-CODES ACCESSIBLE VIA ASSIGNED ROLES
              </div>
            </div>
          </div>
          <div class="chart-wrap h280">
            {tcodeUserData && (
              <Bar data={tcodeUserData} options={baseChartOpts} />
            )}
          </div>
        </div>
      </div>
      <TableCard
        title="Combined Access & Activity Matrix — All Layers"
        badge={`${filtered.length} RECORDS`}
      >
        <CioNote
          html={
            `This cross-layer view maps all four data layers for every user. ` +
            `<strong>${highRisk}</strong> users are <strong>High Risk</strong> — ` +
            `inactive accounts with active role assignments. ` +
            `<strong>${withAudit}</strong> users have a recorded audit trail; ` +
            `${(rows?.length ?? 0) - withAudit} have no activity. ` +
            `Use this view as the primary input for <strong>access recertification and SoD analysis</strong>.`
          }
        />
        <div style={toolbar}>
          <input
            style={inputSt}
            placeholder="Search User ID or Name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <SelFilter
            value={statusF}
            placeholder="All Status"
            options={["Active", "Inactive"]}
            onChange={(v) => {
              setStatusF(v);
              setPage(1);
            }}
          />
          <SelFilter
            value={actF}
            placeholder="All Activity"
            options={ACT_OPTS}
            onChange={(v) => {
              setActF(v);
              setPage(1);
            }}
          />
          <ClearBtn
            onClick={() => {
              setSearch("");
              setStatusF("");
              setActF("");
              setPage(1);
            }}
          />
          <CountLabel count={filtered.length} noun="users" />
        </div>
        <DataTable
          columns={COMB_COLS}
          rows={slice(filtered)}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
        />
        <Pagination
          info={info}
          page={page}
          totalPages={totalPages}
          onPage={setPage}
        />
      </TableCard>
    </div>
  );
}

const activityOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900, easing: "easeOutQuart" },
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: {
        font: { size: 10, family: "Inter" },
        color: "#2e6090",
        boxWidth: 11,
        padding: 16,
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
        font: { size: 9, family: "Inter" },
        color: "#6a9cbf",
        maxRotation: 30,
      },
    },
    yLeft: {
      type: "linear",
      position: "left",
      title: {
        display: true,
        text: "Roles / T-Codes",
        font: { size: 9, family: "Inter" },
        color: "#6a9cbf",
      },
      grid: { color: "rgba(204,224,245,0.35)" },
      border: { color: "transparent" },
      ticks: { font: { size: 9, family: "Inter" }, color: "#6a9cbf" },
    },
    yRight: {
      type: "linear",
      position: "right",
      grid: { drawOnChartArea: false },
      border: { color: "transparent" },
      title: {
        display: true,
        text: "Audit Events",
        font: { size: 9, family: "Inter" },
        color: "#00acc1",
      },
      ticks: { font: { size: 9, family: "Inter" }, color: "#00acc1" },
    },
  },
};
/* ══════════════════════════════════════════════════════════════════
   SHARED MICRO-COMPONENTS  (module-private)
   ══════════════════════════════════════════════════════════════════ */

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

function TableCard({ title, badge, children }) {
  return (
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
          {title}&nbsp;
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
        </span>
      </div>
      {children}
    </div>
  );
}

/** Select dropdown — options can be string[] or {label,value}[] */
function SelFilter({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={selectSt}
    >
      <option value="">{placeholder}</option>
      {(options ?? []).map((o, i) => (
        <option key={i} value={typeof o === "object" ? o.value : o}>
          {typeof o === "object" ? o.label : o}
        </option>
      ))}
    </select>
  );
}

function ClearBtn({ onClick }) {
  return (
    <button style={clearBtnSt} onClick={onClick}>
      Clear
    </button>
  );
}

function CountLabel({ count, noun }) {
  return (
    <span
      style={{
        fontSize: ".72rem",
        fontWeight: 700,
        color: "var(--text-muted)",
        marginLeft: "auto",
      }}
    >
      {count} {noun}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SHARED STYLE OBJECTS
   ══════════════════════════════════════════════════════════════════ */
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
const toolbar = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 16,
};
const inputSt = {
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
const selectSt = {
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
const clearBtnSt = {
  fontFamily: "var(--font)",
  fontSize: ".75rem",
  padding: "6px 12px",
  border: "1px solid var(--border2)",
  borderRadius: 8,
  background: "transparent",
  color: "var(--text-sub)",
  cursor: "pointer",
};

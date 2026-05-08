
import { useState, Suspense, useEffect, useRef } from "react";
import domtoimage from 'dom-to-image';
import axios from "axios";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Sidebar from "./components/layout/Sidebar";
import { LoadingSpinner } from "./components/ui";
import Overview from "./pages/Overview";
import AuditLog from "./pages/AuditLog";
import { useTheme } from './hooks/useApi.js';
import { usePDFExport } from './utils/exportPDF.js';
import {
  Users,
  Roles,
  TCodes,
  Analytics,
  CombinedView,
} from "./pages/index.jsx";
/* ============================================================
   🔹 API CLIENT (MERGED FROM client.js)
   ============================================================ */

// const resolvedApiBase = (
//   import.meta.env.VITE_API_BASE_URL ??
//   import.meta.env.VITE_API_BASE ??
//   ""
// )
//   .trim()
//   .replace(/\/+$/, "");

const resolvedApiBase =
  "https://sap-user-analytics-cefubfe3d7cqa8ea.centralindia-01.azurewebsites.net";
// const resolvedApiBase = "http://127.0.0.1:8001";

export const apiClient = axios.create({
  baseURL: resolvedApiBase,
  timeout: 15000,
});

function getAuthFromUrl() {
  const params = new URLSearchParams(window.location.search);

  return {
    sessionId: params.get("session_id"),
    token: params.get("token"),
  };
}

/* ── Request interceptor ───────────────────────── */
apiClient.interceptors.request.use((config) => {
  console.log("🚀 API REQUEST:", {
    url: config.baseURL + config.url,
    method: config.method,
    params: config.params,
    data: config.data,
  });
  const fromUrl = new URLSearchParams(window.location.search).get("token");
  const token =
    fromUrl || window.AUTH_TOKEN || window.localStorage.getItem("auth_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ── Response interceptor ───────────────────────── */
apiClient.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE:", {
      url: response.config.url,
      status: response.status,
      dataKeys: Object.keys(response.data || {}),
    });

    return response.data;
  },
  (error) => {
    console.error("❌ API ERROR:", {
      url: error.config?.url,
      message: error.message,
      response: error.response?.data,
    });

    const msg =
      error.response?.data?.error || error.message || "Unknown API error";
    return Promise.reject(new Error(msg));
  },
);

/* ── Single-source data access (/api/data only) ───────────────────────── */
const CACHE_TTL_MS = 0;
const EMPTY_BUNDLE_RETRY_DELAYS_MS = [500, 1000, 2000, 3500];
const MONTHS = [
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

const dataCache = {
  value: null,
  fetchedAt: 0,
  inflight: null,
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value ?? "").trim();
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeLabel(value, fallback = "Unknown") {
  const t = asText(value);
  return t || fallback;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasBundleData(bundle) {
  if (!bundle) return false;
  const counts = bundle?.counts ?? {};
  // trust server-side counts if present, else check arrays
  const serverSaysData =
    console.log("Bundle counts:", counts) ||
    (counts.users ?? 0) +
    (counts.roles ?? 0) +
    (counts.tcodes ?? 0) +
    (counts.audit ?? 0);
  if (serverSaysData > 0) return true;
  return (
    asArray(bundle?.users).length > 0 ||
    asArray(bundle?.roles).length > 0 ||
    asArray(bundle?.tcodes).length > 0 ||
    asArray(bundle?.audit).length > 0
  );
}

function parseDmyDate(dateStr) {
  const raw = asText(dateStr);
  const m = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;

  const d = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseAuditDateTime(row) {
  const datePart = parseDmyDate(row?.date);
  if (!datePart) return null;

  const [h = "0", m = "0", s = "0"] = asText(row?.time).split(":");
  datePart.setUTCHours(asNumber(h), asNumber(m), asNumber(s), 0);
  return datePart;
}

function formatDmyDate(date) {
  if (!(date instanceof Date)) return "";
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const y = String(date.getUTCFullYear());
  return `${d}.${m}.${y}`;
}

function formatAuditLastSeen(date) {
  if (!(date instanceof Date)) return "-";
  const d = String(date.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[date.getUTCMonth()] ?? "";
  const yy = String(date.getUTCFullYear()).slice(-2);
  return `${d} ${mon} ${yy}`;
}

function isoWeekInfo(date) {
  const tmp = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  return { year: tmp.getUTCFullYear(), week };
}

function bucketAndSort(rows, keyFn, labelFn, limit = null) {
  const map = new Map();

  rows.forEach((row) => {
    const key = keyFn(row);
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  let entries = [...map.entries()].sort(
    (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])),
  );

  if (typeof limit === "number") {
    entries = entries.slice(0, limit);
  }

  return {
    labels: entries.map(([k]) => labelFn(k)),
    values: entries.map(([, v]) => v),
  };
}

export function loadDataBundle(force = false) {
  console.log(" loadDataBundle() called", { force });
  const now = Date.now();
  const cacheFresh =
    dataCache.value && now - dataCache.fetchedAt < CACHE_TTL_MS;

  if (!force && cacheFresh) {
    return Promise.resolve(dataCache.value);
  }
  if (!force && dataCache.inflight) {
    console.log("⏳ Returning inflight request");
    return dataCache.inflight;
  }

  console.log(" Fetching fresh /api/data from backend");

  dataCache.inflight = (async () => {
    const fetchOnce = async () => {
      console.log("📡 Calling GET /api/data...");

      const bundle = await apiClient.get("/api/data");

      console.log("📦 Raw bundle received:", bundle);

      console.log("📦 FRESH FROM API:", bundle?.counts);

      return {
        ...bundle,
        users: asArray(bundle?.users),
        roles: asArray(bundle?.roles),
        tcodes: asArray(bundle?.tcodes),
        audit: asArray(bundle?.audit),
      };
    };

    try {
      const result = await fetchOnce();

      dataCache.value = result;
      dataCache.fetchedAt = Date.now();

      return result;
    } finally {
      dataCache.inflight = null;
    }
  })();

  return dataCache.inflight;
}

function userStats(users) {
  const total = users.length;
  let active = 0;
  let inactive = 0;
  let dialog = 0;
  let system = 0;
  let service = 0;
  let maxRoles = 0;
  let maxRolesUser = "-";

  users.forEach((u) => {
    const status = asText(u?.status).toLowerCase();
    const type = asText(u?.type).toUpperCase();
    const roleCount = asNumber(u?.role_count);

    if (status === "active") active += 1;
    else inactive += 1;

    if (type.includes("DIALOG")) dialog += 1;
    else if (type.includes("SYSTEM")) system += 1;
    else if (type.includes("SERVICE")) service += 1;

    if (roleCount >= maxRoles) {
      maxRoles = roleCount;
      maxRolesUser = safeLabel(u?.uid, "-");
    }
  });

  return {
    total,
    active,
    inactive,
    dialog,
    system,
    service,
    max_roles: maxRoles,
    max_roles_user: maxRolesUser,
  };
}

function roleStats(roles) {
  const total = roles.length;
  const userSet = new Set();
  const roleSet = new Set();
  const roleCountMap = new Map();

  const moduleCount = {
    am: 0,
    ap: 0,
    ar: 0,
    gl: 0,
    trm: 0,
    other: 0,
  };

  roles.forEach((r) => {
    const uid = safeLabel(r?.uid, "");
    const roleId = safeLabel(r?.role_id, "");
    if (uid) userSet.add(uid);
    if (roleId) {
      roleSet.add(roleId);
      roleCountMap.set(roleId, (roleCountMap.get(roleId) ?? 0) + 1);

      const roleUpper = roleId.toUpperCase();
      if (roleUpper.includes("_FI_AM_")) moduleCount.am += 1;
      else if (roleUpper.includes("_FI_AP_")) moduleCount.ap += 1;
      else if (roleUpper.includes("_FI_AR_")) moduleCount.ar += 1;
      else if (roleUpper.includes("_FI_GL_")) moduleCount.gl += 1;
      else if (roleUpper.includes("_TRM_")) moduleCount.trm += 1;
      else moduleCount.other += 1;
    }
  });

  const sortedRoleEntries = [...roleCountMap.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  const top12 = sortedRoleEntries
    .slice(0, 12)
    .map(([role, count]) => ({ role, count }));

  const topFiRoles = sortedRoleEntries
    .filter(([role]) => role.toUpperCase().startsWith("ZTFSIN_FI_"))
    .slice(0, 5)
    .map(([role, count]) => ({ role, count }));

  const topTrmRoles = sortedRoleEntries
    .filter(([role]) => role.toUpperCase().startsWith("ZTFSIN_TRM"))
    .slice(0, 5)
    .map(([role, count]) => ({ role, count }));

  const makerRole = sortedRoleEntries.find(([role]) =>
    role.toUpperCase().includes("MAKER"),
  );

  const fi = moduleCount.am + moduleCount.ap + moduleCount.ar + moduleCount.gl;

  return {
    total,
    unique_users: userSet.size,
    unique_roles: roleSet.size,
    top12,
    top_fi_roles: topFiRoles,
    top_trm_roles: topTrmRoles,
    maker_count: makerRole?.[1] ?? 0,
    fi,
    ...moduleCount,
  };
}

function rolesPerUser(roles) {
  const byUser = new Map();

  roles.forEach((r) => {
    const uid = safeLabel(r?.uid, "");
    if (!uid) return;
    byUser.set(uid, (byUser.get(uid) ?? 0) + 1);
  });

  const entries = [...byUser.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  const top = entries.slice(0, 10);
  const max = entries[0]?.[1] ?? 0;
  const maxUser = entries[0]?.[0] ?? "-";
  const avg = entries.length
    ? Number(
      (
        entries.reduce((sum, [, cnt]) => sum + cnt, 0) / entries.length
      ).toFixed(1),
    )
    : 0;

  return {
    labels: top.map(([uid]) => uid),
    values: top.map(([, count]) => count),
    avg,
    max,
    max_user: maxUser,
  };
}

function tcodeStats(tcodes) {
  const uniqueTcodes = new Set();
  const byRole = new Map();

  tcodes.forEach((t) => {
    const tcode = safeLabel(t?.tcode, "");
    // role_desc holds the actual role code (e.g. ZTFSIN_FI_AP_DISPLAY);
    // role_id holds description text — fields are swapped in the source data.
    const roleCode = safeLabel(t?.role_desc, "") || safeLabel(t?.role_id, "");

    if (tcode) uniqueTcodes.add(tcode);
    if (roleCode) {
      byRole.set(roleCode, (byRole.get(roleCode) ?? 0) + 1);
    }
  });

  const top12 = [...byRole.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([role, count]) => ({ role, count }));

  const categories = { TRM: 0, AP: 0, GL: 0, AM: 0, AR: 0, Other: 0 };
  [...byRole.entries()].forEach(([role, count]) => {
    const r = role.toUpperCase();
    if (r.includes("TRM")) categories.TRM += count;
    else if (r.includes("_AP_")) categories.AP += count;
    else if (r.includes("_GL_")) categories.GL += count;
    else if (r.includes("_AM_")) categories.AM += count;
    else if (r.includes("_AR_")) categories.AR += count;
    else categories.Other += count;
  });

  return {
    total: tcodes.length,
    unique_tcodes: uniqueTcodes.size,
    top12,
    categories,
  };
}

function auditByDate(auditRows, requestedGran = "auto") {
  const datedRows = auditRows
    .map((row) => {
      const dt = parseDmyDate(row?.date);
      return dt ? { row, dt } : null;
    })
    .filter(Boolean);

  const dateSet = new Set(datedRows.map(({ dt }) => formatDmyDate(dt)));
  const sortedDates = [...dateSet]
    .map((dmy) => parseDmyDate(dmy))
    .filter(Boolean)
    .sort((a, b) => a - b);

  const rangeDays = sortedDates.length
    ? Math.max(
      1,
      Math.round(
        (sortedDates[sortedDates.length - 1] - sortedDates[0]) / 86400000,
      ) + 1,
    )
    : 0;

  let granularity = requestedGran;
  if (granularity === "auto") {
    if (dateSet.size <= 31) granularity = "daily";
    else if (dateSet.size <= 120) granularity = "weekly";
    else granularity = "monthly";
  }

  const buckets = new Map();

  datedRows.forEach(({ dt }) => {
    let key;
    let label;
    let sortTs;

    if (granularity === "weekly") {
      const wk = isoWeekInfo(dt);
      key = `${wk.year}-W${String(wk.week).padStart(2, "0")}`;
      label = key;
      sortTs = Date.UTC(wk.year, 0, 1) + wk.week * 7 * 86400000;
    } else if (granularity === "monthly") {
      const y = dt.getUTCFullYear();
      const m = dt.getUTCMonth();
      key = `${y}-${String(m + 1).padStart(2, "0")}`;
      label = `${MONTHS[m]} ${y}`;
      sortTs = Date.UTC(y, m, 1);
    } else {
      key = formatDmyDate(dt);
      label = key;
      sortTs = dt.getTime();
      granularity = "daily";
    }

    const current = buckets.get(key) ?? { label, count: 0, sortTs };
    current.count += 1;
    buckets.set(key, current);
  });

  const sorted = [...buckets.values()].sort((a, b) => a.sortTs - b.sortTs);
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];

  return {
    granularity,
    labels: sorted.map((b) => b.label),
    values: sorted.map((b) => b.count),
    range_days: rangeDays,
    date_count: dateSet.size,
    date_range:
      minDate && maxDate
        ? `${formatDmyDate(minDate)} - ${formatDmyDate(maxDate)}`
        : "N/A",
  };
}

function auditCoreStats(auditRows, byDateStats) {
  const total = auditRows.length;

  const byUser = bucketAndSort(
    auditRows,
    (r) => safeLabel(r?.uid, ""),
    (v) => v,
  );
  const byTcode = bucketAndSort(
    auditRows,
    (r) => safeLabel(r?.tcode, ""),
    (v) => v,
  );

  const topUser = byUser.labels[0] ?? "-";
  const topUserCount = byUser.values[0] ?? 0;
  const topTcode = byTcode.labels[0] ?? "-";
  const topTcodeCount = byTcode.values[0] ?? 0;
  const topUserPct = total ? Math.round((topUserCount / total) * 100) : 0;

  return {
    total,
    range_days: byDateStats.range_days,
    date_count: byDateStats.date_count,
    date_range: byDateStats.date_range,
    top_user: topUser,
    top_user_count: topUserCount,
    top_user_pct: topUserPct,
    top_tcode: topTcode,
    top_tcode_count: topTcodeCount,
  };
}

function auditUserActiveness(auditRows, users, top = "max") {
  const byUser = new Map();

  users.forEach((u) => {
    const uid = safeLabel(u?.uid, "");
    if (uid && !byUser.has(uid)) {
      byUser.set(uid, { uid, count: 0, lastSeen: null });
    }
  });

  auditRows.forEach((row) => {
    const uid = safeLabel(row?.uid, "");
    if (!uid) return;

    const current = byUser.get(uid) ?? { uid, count: 0, lastSeen: null };
    current.count += 1;

    const dt = parseAuditDateTime(row);
    if (dt && (!current.lastSeen || dt > current.lastSeen)) {
      current.lastSeen = dt;
    }

    byUser.set(uid, current);
  });

  const total = auditRows.length || 1;
  const allUsers = [...byUser.values()].map((u) => {
    let tier = "silent";
    if (u.count >= 20) tier = "power";
    else if (u.count >= 5) tier = "active";
    else if (u.count >= 1) tier = "light";

    return {
      uid: u.uid,
      count: u.count,
      pct_usage: Number(((u.count / total) * 100).toFixed(2)),
      last_fmt: formatAuditLastSeen(u.lastSeen),
      tier,
    };
  });

  const power = allUsers.filter((u) => u.tier === "power").length;
  const active = allUsers.filter((u) => u.tier === "active").length;
  const light = allUsers.filter((u) => u.tier === "light").length;
  const silent = allUsers.filter((u) => u.tier === "silent").length;

  let visibleUsers = allUsers
    .filter((u) => u.count > 0)
    .sort((a, b) => b.count - a.count || a.uid.localeCompare(b.uid));

  if (top !== "max") {
    const n = asNumber(top);
    if (n > 0) visibleUsers = visibleUsers.slice(0, n);
  }

  return { users: visibleUsers, power, active, light, silent };
}

function combinedData(users, roles, tcodes, auditRows) {
  const userMap = new Map();
  users.forEach((u) => {
    const uid = safeLabel(u?.uid, "");
    if (!uid) return;
    userMap.set(uid, u);
  });

  const rolesByUser = new Map();
  roles.forEach((r) => {
    const uid = safeLabel(r?.uid, "");
    const roleId = safeLabel(r?.role_id, "");
    if (!uid || !roleId) return;
    const set = rolesByUser.get(uid) ?? new Set();
    set.add(roleId);
    rolesByUser.set(uid, set);
  });

  const tcodesByRole = new Map();
  tcodes.forEach((t) => {
    const tcode = safeLabel(t?.tcode, "");
    if (!tcode) return;

    // Some source exports swap role_id/role_desc in tcode rows.
    // Index by both so combined view still resolves user-role -> tcodes correctly.
    const roleKeys = [
      safeLabel(t?.role_id, ""),
      safeLabel(t?.role_desc, ""),
    ].filter(Boolean);

    roleKeys.forEach((roleKey) => {
      const set = tcodesByRole.get(roleKey) ?? new Set();
      set.add(tcode);
      tcodesByRole.set(roleKey, set);
    });
  });

  const auditByUser = new Map();
  auditRows.forEach((a) => {
    const uid = safeLabel(a?.uid, "");
    if (!uid) return;

    const current = auditByUser.get(uid) ?? {
      count: 0,
      tcodeCount: new Map(),
      groupCount: new Map(),
    };

    current.count += 1;

    const tcode = safeLabel(a?.tcode, "");
    if (tcode)
      current.tcodeCount.set(tcode, (current.tcodeCount.get(tcode) ?? 0) + 1);

    const group = safeLabel(a?.group, "Unassigned");
    current.groupCount.set(group, (current.groupCount.get(group) ?? 0) + 1);

    auditByUser.set(uid, current);
  });

  const allUids = new Set([
    ...userMap.keys(),
    ...rolesByUser.keys(),
    ...auditByUser.keys(),
  ]);

  return [...allUids]
    .map((uid) => {
      const user = userMap.get(uid) ?? {};
      const roleSet = rolesByUser.get(uid) ?? new Set();
      const auditStat = auditByUser.get(uid) ?? {
        count: 0,
        tcodeCount: new Map(),
        groupCount: new Map(),
      };

      const tcodeSet = new Set();
      roleSet.forEach((roleId) => {
        const roleTcodes = tcodesByRole.get(roleId);
        if (!roleTcodes) return;
        roleTcodes.forEach((t) => tcodeSet.add(t));
      });

      const topTcode =
        [...auditStat.tcodeCount.entries()].sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
        )[0]?.[0] ?? "-";

      const topGroup =
        [...auditStat.groupCount.entries()].sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
        )[0]?.[0] ?? "-";

      const status = safeLabel(user?.status, "Unknown");
      const isInactive = status.toLowerCase() === "inactive";
      const roleCount = roleSet.size || asNumber(user?.role_count);
      const auditCount = auditStat.count;

      let riskLevel = "Low";
      if (isInactive && roleCount > 0) riskLevel = "High";
      else if (auditCount >= 20) riskLevel = "Medium";

      return {
        uid,
        name: safeLabel(user?.name, uid),
        status,
        role_count: roleCount,
        tcode_count: tcodeSet.size,
        audit_count: auditCount,
        top_tcode: topTcode,
        top_group: topGroup,
        risk_level: riskLevel,
      };
    })
    .sort((a, b) => a.uid.localeCompare(b.uid));
}

function overviewBundle(users, roles, tcodes, auditRows) {
  const byDate = auditByDate(auditRows, "auto");

  return {
    user_stats: userStats(users),
    role_stats: roleStats(roles),
    tcode_stats: tcodeStats(tcodes),
    audit_kpis: auditCoreStats(auditRows, byDate),
    audit_by_date: {
      labels: byDate.labels,
      values: byDate.values,
      granularity: byDate.granularity,
    },
    audit_by_user: bucketAndSort(
      auditRows,
      (r) => safeLabel(r?.uid, ""),
      (v) => v,
      10,
    ),
    audit_by_group: bucketAndSort(
      auditRows,
      (r) => safeLabel(r?.group, "Unassigned"),
      (v) => v,
      8,
    ),
    audit_by_tcode: bucketAndSort(
      auditRows,
      (r) => safeLabel(r?.tcode, ""),
      (v) => v,
      10,
    ),
  };
}

function auditBundle(users, auditRows, gran) {
  const byDate = auditByDate(auditRows, gran);
  const kpis = auditCoreStats(auditRows, byDate);

  // ── per-bucket unique users and unique tcodes ──
  // Key by LABEL (same strings that byDate.labels contains) so lookup is correct
  const bucketUsers = {};
  const bucketTcodes = {};
  byDate.labels.forEach(l => {
    bucketUsers[l] = new Set();
    bucketTcodes[l] = new Set();
  });

  auditRows.forEach(row => {
    const dt = parseDmyDate(row?.date);
    if (!dt) return;

    // Reproduce the EXACT same label that auditByDate() produced for this date
    let label;
    if (byDate.granularity === "weekly") {
      const wk = isoWeekInfo(dt);
      label = `${wk.year}-W${String(wk.week).padStart(2, "0")}`;
    } else if (byDate.granularity === "monthly") {
      // auditByDate label for monthly = "Jan 2026", "Apr 2026", etc.
      label = `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
    } else {
      // daily label = "10.04.2026"
      label = formatDmyDate(dt);
    }

    if (!bucketUsers[label]) return;   // date outside known buckets → skip

    const uid = safeLabel(row?.uid, "");
    const tcode = safeLabel(row?.tcode, "");
    if (uid) bucketUsers[label].add(uid);
    if (tcode) bucketTcodes[label].add(tcode);
  });

  return {
    kpis,
    by_date: {
      labels: byDate.labels,
      values: byDate.values,
      user_counts: byDate.labels.map(l => bucketUsers[l]?.size ?? 0),
      tcode_counts: byDate.labels.map(l => bucketTcodes[l]?.size ?? 0),
      granularity: byDate.granularity,
      range_days: byDate.range_days,
    },
    by_user: bucketAndSort(auditRows, r => safeLabel(r?.uid, ""), v => v, 12),
    // Match HTML Calc.auditByGroup: include only non-empty, non-"nan" groups.
    by_group: bucketAndSort(
      auditRows,
      (r) => {
        const g = asText(r?.group);
        return g && g.toLowerCase() !== "nan" ? g : "";
      },
      (v) => v,
    ),
    by_class: bucketAndSort(auditRows, r => safeLabel(r?.audit_class, "Other"), v => v, 8),
    by_tcode: bucketAndSort(auditRows, r => safeLabel(r?.tcode, ""), v => v, 12),
    user_activeness: auditUserActiveness(auditRows, users, "max"),
  };
}

/* ── APIs ───────────────────────── */
export const DataAPI = {
  bundle: () => loadDataBundle(),
  users: async () => (await loadDataBundle()).users,
  roles: async () => (await loadDataBundle()).roles,
  tcodes: async () => (await loadDataBundle()).tcodes,
  audit: async () => (await loadDataBundle()).audit,
};

export const CalcAPI = {
  overview: async (gran = "auto") => {
    return await apiClient.get(`/api/calc/overview?gran=${gran}`);
  },
  audit: async (gran = "auto") => {
    const bundle = await loadDataBundle();
    return auditBundle(bundle.users, bundle.audit, gran);
  },
  auditActiveness: async (top = "max") => {
    const bundle = await loadDataBundle();
    return auditUserActiveness(bundle.audit, bundle.users, top);
  },
  roles: async () => {
    const bundle = await loadDataBundle();
    return {
      role_stats: roleStats(bundle.roles),
      roles_per_user: rolesPerUser(bundle.roles),
    };
  },
  tcodes: async () => {
    const bundle = await loadDataBundle();
    return tcodeStats(bundle.tcodes);
  },
  users: async () => {
    return await apiClient.get("/api/calc/users");
  },
  combined: async () => {
    const bundle = await loadDataBundle();
    return combinedData(
      bundle.users,
      bundle.roles,
      bundle.tcodes,
      bundle.audit,
    );
  },
};

/* ============================================================
   UI CONFIG
   ============================================================ */

const PAGE_TITLES = {
  overview: "Overview",
  analytics: "Analytics",
  users: "Users — L1 Master Data",
  roles: "Roles — L2 Assignments",
  tcodes: "T-Codes — L3 Permissions",
  audit: "Audit Log",
  combined: "Combined View",
};

const PAGE_MAP = {
  overview: <Overview />,
  analytics: <Analytics />,
  users: <Users />,
  roles: <Roles />,
  tcodes: <TCodes />,
  audit: <AuditLog />,
  combined: <CombinedView />,
};

const FullReport = () => (
  <div id="full-report-container">
    {/* Report Title (appears only once at top) */}
    <div style={{
      textAlign: 'center',
      marginBottom: '40px',
      paddingBottom: '20px',
      borderBottom: '4px solid #1565c0'
    }}>
      <h1 style={{ fontSize: '32px', margin: 0, color: '#1565c0' }}></h1>
      <p style={{ fontSize: '22px', margin: '8px 0 0', color: '#222' }}>
        SAP User Analytics — Full Report
      </p>
      <p style={{ fontSize: '13px', color: '#555', marginTop: '12px' }}>
        Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>
    </div>

    {/* Each page gets its own section + forced page break */}
    {Object.entries(PAGE_MAP).map(([key, pageComponent]) => (
      <div
        key={key}
        className="print-page"
        style={{ marginBottom: '60px' }}
      >
        <h2 style={{
          fontSize: '30px',
          fontWeight: 700,
          color: '#1565c0',
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #eee'
        }}>
          {PAGE_TITLES[key]}
        </h2>
        <div style={{ position: 'relative' }}>
          {pageComponent}
        </div>
      </div>
    ))}
  </div>
);

/* ============================================================
   APP
   ============================================================ */

export default function App() {

  const [activePage, setActivePage] = useState("overview");
  const [isBackendUp, setIsBackendUp] = useState(null);
  const [isExportingFull, setIsExportingFull] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  /* ── Token handling ───────────────────────── */
  const tokenFromUrl = new URLSearchParams(window.location.search).get("token");
  const token = tokenFromUrl || window.localStorage.getItem("auth_token");

  if (tokenFromUrl) {
    window.localStorage.setItem("auth_token", tokenFromUrl);
  }

  window.AUTH_TOKEN = token || "";

  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 680,
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 20,
            background: "var(--white)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Session token missing</h2>
          <p style={{ marginBottom: 12 }}>
            Open using backend launch URL or add
            <strong> ?token=&lt;jwt&gt;</strong>
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${resolvedApiBase}/api/health`);
        if (!res.ok) throw new Error("Health failed");

        const data = await res.json();
        setIsBackendUp(data.status === "ok");
      } catch (err) {
        console.error("Health check error:", err);
        setIsBackendUp(false);
      }
    };

    checkHealth();
  }, []);

  const { dark, toggle } = useTheme();

  const { exportPDF, isExporting } = usePDFExport();

  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        `${String(d.getHours()).padStart(2, '0')}:` +
        `${String(d.getMinutes()).padStart(2, '0')}:` +
        `${String(d.getSeconds()).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = printStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const fullReportRef = useRef(null);

  const ExportOverlay = ({ status }) => {
    if (!status) return null;

    return (
      <div
        id="export-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          pointerEvents: 'none',
        }}>
        <div style={{
          background: '#fff',
          color: '#111',
          padding: '40px 50px',
          borderRadius: 16,
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          minWidth: '340px',
        }}>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: 16 }}>
            Exporting Full Report
          </div>
          <div style={{ fontSize: '15px', color: '#1565c0', marginBottom: 20 }}>
            {status}
          </div>
          <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="#1565c0" strokeWidth={3} strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
      </div>
    );
  };

  const handleExport = async () => {
    setIsExportingFull(true);
    setExportStatus('Preparing full report…');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pagesToExport = Object.keys(PAGE_MAP);
    const originalActivePage = activePage;

    try {
      for (let i = 0; i < pagesToExport.length; i++) {
        const pageKey = pagesToExport[i];
        const pageTitle = PAGE_TITLES[pageKey] || pageKey;

        setExportStatus(`Capturing ${pageTitle} (${i + 1}/${pagesToExport.length})…`);
        setActivePage(pageKey);
        await new Promise(r => setTimeout(r, 2200));

        const fullPageEl = document.querySelector('.wrapper');
        if (!fullPageEl) continue;

        let dataUrl;
        try {
          dataUrl = await domtoimage.toPng(fullPageEl, {
            width: fullPageEl.scrollWidth * 2,
            height: fullPageEl.scrollHeight * 2,
            style: {
              transform: 'scale(2)',
              transformOrigin: 'top left',
              width: fullPageEl.scrollWidth + 'px',
              height: fullPageEl.scrollHeight + 'px',
              background: '#ffffff',
            },
            filter: (node) => {
              if (node.id === 'export-overlay' || node.id === 'chart-tooltip' || node.getAttribute?.('data-pdf-exclude') === 'true') {
                return false;
              }
              return true;
            },
          });
        } catch (err) {
          console.error(`Capture failed for ${pageKey}`, err);
          continue;
        }

        if (i > 0) pdf.addPage();

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const img = new Image();
        img.src = dataUrl;

        await new Promise((res) => (img.onload = res));

        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;

        const finalWidth = pageWidth;
        const finalHeight = (img.height * pageWidth) / img.width;


        pdf.addImage(dataUrl, 'PNG', 0, 0, finalWidth, finalHeight);
      }

      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '');
      pdf.save(`tfsin-hana-full-report_${timestamp}.pdf`);

    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Check console (F12).');
    } finally {
      setActivePage(originalActivePage);
      setIsExportingFull(false);
      setExportStatus('');
    }
  };

  const pageTitle = PAGE_TITLES[activePage] ?? "Dashboard";

  return (
    <div className="user-dashboard-wrapper wrapper">
      <div id="chart-tooltip">
        <div id="tt-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div id="tt-header-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#1565c0" }} />
          <div id="tt-title" style={{ fontWeight: 600, fontSize: 12 }} />
        </div>
        <div id="tt-body" style={{ marginTop: 8 }} />
      </div>

      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div style={styles.mainArea}>
        <header style={styles.header}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={styles.pageTitle}></div>
            <div style={styles.pageSub}>
              {pageTitle}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={styles.liveBadge}>Live</span>
              <span style={styles.clock}>{clock}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                style={{ ...styles.pdfBtn, ...(isExportingFull ? styles.pdfBtnLoading : {}) }}
                onClick={handleExport}
                disabled={isExportingFull}
                data-pdf-exclude="true"
              >
                {isExportingFull ? (
                  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                    <path d="M14 2v6h6" />
                  </svg>
                )}
                {isExportingFull ? 'Exporting…' : 'Export Full PDF'}
              </button>
              <button style={styles.iconBtn} onClick={toggle} title="Toggle dark mode">
                <svg viewBox="0 0 24 24" width={16} height={16}
                  fill="none" stroke="currentColor" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div style={styles.contentWrap}>
          <Suspense fallback={<LoadingSpinner message="Loading page…" />}>
            {PAGE_MAP[activePage] ?? <div style={{ padding: 32 }}>Page not found.</div>}
          </Suspense>
          <ExportOverlay status={exportStatus} />
        </div>
      </div>

    </div>
  );
}

const styles = {
  mainArea: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 28px",
    borderBottom: "1px solid var(--border)",
    marginBottom: 4,
    flexWrap: "wrap",
    gap: 12,
    background: "var(--white)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  pageTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    letterSpacing: "0.5px",
    lineHeight: "1.4",
    marginBottom: "4px",
  },
  pageSub: {
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    marginTop: 2,
    lineHeight: "1.4",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg,var(--blue),var(--sky))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: ".65rem",
    fontWeight: 800,
    color: "#fff",
  },
  contentWrap: {
    padding: "0 28px 48px",
  },
  clock: {
    fontFamily: 'var(--font)', fontSize: '.74rem', fontWeight: 500,
    color: 'var(--text-sub)', background: 'var(--white)',
    border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 20,
  },
  iconBtn: {
    width: 32, height: 32, borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--card)',
    color: 'var(--text-muted)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .25s',
  },
  pdfBtn: {
    height: 32, borderRadius: 10,
    border: '1px solid var(--blue)', background: 'var(--blue)',
    color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, fontFamily: 'var(--font)', fontSize: '.72rem', fontWeight: 700,
    padding: '6px 12px', transition: 'all .25s',
  },
  pdfBtnLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  badge: { fontSize: '.6rem', opacity: .7, marginLeft: 'auto' },
  bottom: { padding: '0 10px', marginTop: 'auto' },
  liveBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--teal-pale)', border: '1px solid rgba(0,172,193,.3)',
    color: 'var(--teal)', fontSize: '.68rem', fontWeight: 700,
    padding: '5px 12px', borderRadius: 20, letterSpacing: '.1em',
    textTransform: 'uppercase',
  }
};


const printStyles = `
  @media print {
    /* Hide everything except the full report */
    .wrapper > *:not(#full-report-container),
    header, .sidebar, #chart-tooltip { display: none !important; }

    #full-report-container {
      position: static !important;
      left: 0 !important;
      visibility: visible !important;
      width: 100% !important;
      max-width: none !important;
      background: white !important;
      padding: 30px 40px !important;
      box-shadow: none !important;
      margin: 0 !important;
    }

    /* Each dashboard page = exactly one PDF page */
    .print-page {
      page-break-after: always !important;
      min-height: 100vh !important;
      break-after: page !important;
    }

    /* Clean print styling */
    .print-page h2 { color: #1565c0 !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0 !important; padding: 0 !important; }
  }
`;
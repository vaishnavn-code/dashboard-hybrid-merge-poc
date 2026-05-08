/**
 * hooks/useApi.js
 * ===============
 * Generic data-fetching hook that wraps any API call function.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(CalcAPI.overview);
 *
 * The hook re-fetches automatically when `params` changes (pass undefined
 * if the fetch function takes no arguments).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { loadDataBundle } from "../App";
import axios from "axios";
/**
 * @param {Function} fetchFn  - async function that returns data (from client.js)
 * @param {any}      params   - argument(s) forwarded to fetchFn on every call
 * @param {Object}   options
 * @param {boolean}  options.immediate - run on mount (default: true)
 */
export function useApi(fetchFn, params = undefined, { immediate = true } = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  // Stable reference to the fetch function so ESLint deps are satisfied
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRef.current(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message ?? "Failed to load data");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!immediate) return;
    // Pass params as a spread so single values and arrays both work
    const args = params !== undefined ? (Array.isArray(params) ? params : [params]) : [];
    execute(...args);
  }, [immediate, JSON.stringify(params)]); // eslint-disable-line

  return { data, loading, error, refetch: execute };
}


/**
 * hooks/useTheme.js (exported from the same file for convenience)
 * ===============================================================
 * Reads & toggles the data-theme attribute on <html>.
 * Persists preference to localStorage.
 */

export function useTheme() {
  const [dark, setDark] = useState(() => {
    // Restore previous preference; fall back to system preference
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => setDark((d) => !d);

  return { dark, toggle };
}


/**
 * hooks/usePagination.js  (exported from the same file for convenience)
 * ======================================================================
 * Simple client-side pagination logic for data tables.
 *
 * Usage:
 *   const { page, perPage, totalPages, setPage, slice } = usePagination(rows, 20);
 *   const visibleRows = slice(rows);
 */
export function usePagination(rows = [], perPage = 20) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the source data changes
  useEffect(() => { setPage(1); }, [rows.length]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const safeP      = Math.min(page, totalPages);

  const slice = (arr) =>
    arr.slice((safeP - 1) * perPage, safeP * perPage);

  return {
    page:       safeP,
    perPage,
    totalPages,
    setPage,
    slice,
    info: `${Math.min((safeP - 1) * perPage + 1, rows.length)}–${Math.min(safeP * perPage, rows.length)} of ${rows.length}`,
  };
}

/**
 * useInsights — fetch AI insights on demand.
 */
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

export function useInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

const generate = useCallback(async (data) => {
  setLoading(true);
  setError(null);

  try {
    const bundle = await loadDataBundle(true);

    const user_stats = userStats(bundle.users);
    const role_stats = roleStats(bundle.roles);
    const tcode_stats = tcodeStats(bundle.tcodes);
    const audit_kpis = auditCoreStats(
      bundle.audit,
      auditByDate(bundle.audit, "auto")
    );
    const payload = {
      overview: {
        kpi: {
          Total_Users: data.user_stats.total,
          Role_Assignment: data.role_stats.total,
          Unique_Tcodes: data.tcode_stats.unique_tcodes,
          Audit_Events: data.audit_kpis.total,
        },
        charts: {
          "Daily Audit Activity": {
            "2026-03-21": {
              audit_events: "200",
              unique_tcodes: "197",
              unique_users: "69",
              week_tag: "Week 1",
              month_tag: "Month - year",
            },
          },
          "Top Users by Audit Activity": {
            values: Object.fromEntries(
              data.audit_by_user.labels.map((u, i) => [
                u,
                data.audit_by_user.values[i],
              ])
            ),
          },
          "Business Groups by Audit Activity": {
            values: Object.fromEntries(
              data.audit_by_group.labels.map((g, i) => [
                g,
                data.audit_by_group.values[i],
              ])
            ),
          },
          "User Account Status": {
            values: {
              active: data.user_stats.active,
              inactive: data.user_stats.inactive,
            },
          },
          "Most Executed T-Codes": {
            values: Object.fromEntries(
              data.audit_by_tcode.labels.map((t, i) => [
                t,
                data.audit_by_tcode.values[i],
              ])
            ),
          },
        },
      },
      analytics: {
         kpi: {
          Role_Assignment:  data.role_stats.total,
          Unique_Roles: data.role_stats.unique_roles,
          Tcode_Records: data.tcode_stats.total,
          Max_roles: data.roles_per_user.max,
        },
        charts: {
          "Top Role Assignments by Role ID": Object.fromEntries(
            role_stats.top12.map(r => [
              r.role,
              {
                user_count: r.count,
                tcode_count:
                  bundle.tcodes.filter(t => t.role_desc === r.role).length,
              },
            ])
          ),

          "Users by Role Count": Object.fromEntries(
            rolesPerUser(bundle.roles).labels.map((u, i) => [
              u,
              rolesPerUser(bundle.roles).values[i],
            ])
          ),

          "Role Category Distribution": {
            "FI Roles": role_stats.fi,
            "TRM Roles": role_stats.trm,
            "Other": role_stats.other,
          },
        },
      },
    };

    const res = await axios.post(
      "https://dashboard-insight-hrf3cpafhxgsf7fz.centralindia-01.azurewebsites.net/poc/insights/users",
      payload
    );

    console.log("🔥 API RESPONSE:", res.data);

    setInsights(res.data);
    return res.data;

  } catch (e) {
    console.error("❌ API ERROR:", e);
    setError(e.message);
  } finally {
    setLoading(false);
  }
}, []);
  return { insights, loading, error, generate };
}


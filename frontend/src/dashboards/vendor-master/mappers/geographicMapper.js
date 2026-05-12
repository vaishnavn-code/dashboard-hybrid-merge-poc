function mapKpiItem(item, badge = null) {
  return {
    title: item?.Title ?? "-",
    subtitle: item?.Subtitle ?? "",
    footer: item?.Footer ?? "",
    badge,
  };
}

function toNumber(value) {
  const cleaned = String(value ?? "")
    .replace("%", "")
    .replace(/,/g, "")
    .trim();

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function objectToNameValueArray(obj = {}, valueKey = "value") {
  return Object.entries(obj || {})
    .map(([name, value]) => ({
      name: name || "--",
      [valueKey]: toNumber(value),
      value: toNumber(value),
    }))
    .sort((a, b) => toNumber(b[valueKey]) - toNumber(a[valueKey]));
}

function normalizeGeoRow(row = {}) {
  return {
    state_region: row.state_region || row.region || "--",
    city: row.city || "--",

    // Keep customers because copied Geographic.jsx reads customers.
    customers: toNumber(row.vendors || row.customers),

    // Vendor response already has with_bank.
    with_bank: toNumber(row.with_bank || row.withBank),

    gstin_registered: row.gstin_registered || row.gstinRegistered || "--",
    share_pct: row.share_pct || row.sharePct || "--",

    // Vendor alias also kept for future use.
    vendors: toNumber(row.vendors || row.customers),
  };
}

export function mapGeographicPage(raw) {
  const geographic = raw?.geographic ?? {};
  const kpi = geographic?.kpi ?? {};
  const charts = geographic?.charts ?? {};

  const table = Array.isArray(geographic.table)
    ? geographic.table.map(normalizeGeoRow).sort(
        (a, b) => toNumber(b.customers) - toNumber(a.customers),
      )
    : [];

  return {
    kpis: {
      statesCovered: mapKpiItem(kpi.States_Covered, {
        label: "INDIA",
        bgColor: "#E3F2FD",
        textColor: "#1565C0",
      }),

      topRegion: mapKpiItem(kpi.Top_Region, {
        label: "TOP",
        bgColor: "#E8F5E9",
        textColor: "#2E7D32",
      }),

      totalCities: mapKpiItem(kpi.Total_Cities, {
        label: "CITIES",
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      avgPerState: mapKpiItem(kpi.Avg_per_State, {
        label: "AVG",
        bgColor: "#F3E5F5",
        textColor: "#7B1FA2",
      }),
    },

    vendorCountByState: objectToNameValueArray(
      charts["Vendor Count by State"],
      "customers",
    ),

    regionalShare: objectToNameValueArray(
      charts["Regional Share"],
      "value",
    ),

    topCitiesByCount: objectToNameValueArray(
      charts["Top Cities by Count"],
      "customers",
    ),

    table,
  };
}
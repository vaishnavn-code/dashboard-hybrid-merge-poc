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

function objectToNameValueArray(obj = {}) {
  return Object.entries(obj || {}).map(([name, value]) => ({
    name,
    value: toNumber(value),
  }));
}

function mapVendorsByRegion(chart = {}) {
  return Object.entries(chart || {}).map(([name, item]) => ({
    name,
    opening: toNumber(item?.vendor_count),
    eir: toNumber(item?.share_pct),
  }));
}

function mapBankCoverageByState(chart = {}) {
  return Object.entries(chart || {}).map(([name, item]) => ({
    name,
    withBank: toNumber(item?.with_bank),
    noBank: toNumber(item?.no_bank),
    value: toNumber(item?.with_bank),
  }));
}

function calcPercentBadge(value, total) {
  const current = toNumber(value);
  const base = toNumber(total);

  if (!current || !base) return null;

  return `${Math.round((current / base) * 100)}%`;
}

export function mapVendorMasterOverview(raw) {
  const overview = raw?.overview ?? {};
  const kpi = overview?.kpi ?? {};
  const charts = overview?.charts ?? {};

  const totalVendors = kpi.Total_Vendors;
  const withBankAccount = kpi.With_Bank_Account;
  const gstinRegistered = kpi.GSTIN_Registered;
  const statesCovered = kpi.States_Covered;

  return {
    kpis: {
      totalVendors: mapKpiItem(totalVendors, {
        label: "ACTIVE",
        bgColor: "#E3F2FD",
        textColor: "#1565C0",
      }),

      withBankAccount: mapKpiItem(withBankAccount, {
        label: calcPercentBadge(withBankAccount?.Title, totalVendors?.Title),
        bgColor: "#E8F5E9",
        textColor: "#2E7D32",
      }),

      gstinRegistered: mapKpiItem(gstinRegistered, {
        label: calcPercentBadge(gstinRegistered?.Title, totalVendors?.Title),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      statesCovered: mapKpiItem(statesCovered, {
        label: "INDIA",
        bgColor: "#F3E5F5",
        textColor: "#7B1FA2",
      }),
    },

    vendorsByRegion: mapVendorsByRegion(
      charts["Vendors by State / Region"],
    ),

    tdsBreakdown: objectToNameValueArray(
      charts["TDS Category Breakdown"],
    ),

    bankCoverage: objectToNameValueArray(
      charts["Bank Account Coverage"],
    ),

    topCities: objectToNameValueArray(
      charts["Top Cities by Vendor Count"],
    ),

    bankCoverageByState: mapBankCoverageByState(
      charts["Bank Coverage by State"],
    ),

    reconciliationSplit: objectToNameValueArray(
      charts["Reconciliation Account Split"],
    ),
  };
}
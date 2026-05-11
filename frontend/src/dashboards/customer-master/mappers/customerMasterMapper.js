function toNumber(value) {
  const cleaned = String(value ?? "")
    .replace("%", "")
    .trim();
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function toChartData(obj = {}) {
  return Object.entries(obj).map(([name, value]) => ({
    name,
    value: toNumber(value),
  }));
}

function toBankCoverageByState(obj = {}) {
  return Object.entries(obj).map(([name, item]) => ({
    name,
    value: toNumber(item?.["With Bank"]),
  }));
}

function mapKpiItem(item) {
  return {
    title: item?.Title ?? "-",
    subtitle: item?.Subtitle ?? "",
    footer: item?.Footer ?? "",
  };
}

function toRegionBarWithLineData(regionCounts = {}, bankCoverage = {}) {
  return Object.entries(regionCounts).map(([name, total]) => {
    const coverage = bankCoverage?.[name] || {};

    return {
      name,
      opening: toNumber(total),
      closing: toNumber(coverage?.["With Bank"]),
      eir: toNumber(coverage?.["No Bank"]),
    };
  });
}

export function mapCustomerMasterOverview(raw) {
  const overview = raw?.overview ?? {};
  const kpi = overview?.kpi ?? {};
  const charts = overview?.charts ?? {};

  return {
    kpis: {
      totalCustomers: mapKpiItem(kpi.Total_Customers),
      withBankAccount: mapKpiItem(kpi.With_Bank_Account),
      gstinRegistered: mapKpiItem(kpi.GSTIN_Registered),
      statesCovered: mapKpiItem(kpi.States_Covered),
    },

    customersByRegion: toRegionBarWithLineData(
      charts["Customers by State / Region"],
      charts["Bank Coverage by State"],
    ),
    tdsBreakdown: toChartData(charts["TDS / WHT Category Breakdown"]),
    bankCoverage: toChartData(charts["Bank Account Coverage"]),
    topCities: toChartData(charts["Top Cities by Customer Count"]),
    bankCoverageByState: toBankCoverageByState(
      charts["Bank Coverage by State"],
    ),
    reconciliationSplit: toChartData(charts["Reconciliation Account Split"]),
  };
}

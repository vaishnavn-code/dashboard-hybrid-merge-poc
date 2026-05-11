function toNumber(value) {
  const cleaned = String(value ?? "").replace("%", "").trim();
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function toChartData(obj = {}) {
  return Object.entries(obj).map(([name, value]) => ({
    name,
    value: toNumber(value),
  }));
}

function mapKpiItem(item) {
  return {
    title: item?.Title ?? "-",
    subtitle: item?.Subtitle ?? "",
    footer: item?.Footer ?? "",
  };
}

export function mapBankingPage(raw) {
  const banking = raw?.banking ?? {};
  const kpi = banking?.kpi ?? {};
  const charts = banking?.charts ?? {};

  return {
    kpis: {
      withBankAccount: mapKpiItem(kpi.With_Bank_Account),
      withoutBankAccount: mapKpiItem(kpi.Without_Bank_Account),
      uniqueBanks: mapKpiItem(kpi.Unique_Banks),
      bankCoveragePercent: mapKpiItem(kpi.Bank_Coverage_Percent),
    },

    bankCoverageByRegion: toChartData(charts["Bank Coverage by Region"]),
    topBanksByCustomerCount: toChartData(
      charts["Top Banks by Customer Count"]
    ),

    table: banking?.table ?? [],
  };
}
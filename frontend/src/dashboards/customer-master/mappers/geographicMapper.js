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

export function mapGeographicPage(raw) {
  const geographic = raw?.geographic ?? {};
  const kpi = geographic?.kpi ?? {};
  const charts = geographic?.charts ?? {};

  return {
    kpis: {
      statesCovered: mapKpiItem(kpi.States_Covered),
      topRegion: mapKpiItem(kpi.Top_Region),
      totalCities: mapKpiItem(kpi.Total_Cities),
      avgPerState: mapKpiItem(kpi.Avg_per_State),
    },

    customerCountByState: toChartData(charts["Customer Count by State"]),
    regionalShare: toChartData(charts["Regional Share"]),
    topCitiesByCount: toChartData(charts["Top Cities by Count"]),

    table: geographic?.table ?? [],
  };
}
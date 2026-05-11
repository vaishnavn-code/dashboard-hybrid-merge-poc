function toNumber(value) {
  const cleaned = String(value ?? "")
    .replace("%", "")
    .trim();
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function toChartData(obj = {}) {
  return Object.entries(obj)
    .map(([name, value]) => ({
      name,
      value: toNumber(value),
    }))
    .sort((a, b) => b.value - a.value);
}

function mapKpiItem(item, badge = null) {
  return {
    title: item?.Title ?? "-",
    subtitle: item?.Subtitle ?? "",
    footer: item?.Footer ?? "",
    badge,
  };
}

function extractCustomerCount(text) {
  const match = String(text || "").match(/(\d+)\s+customers/i);
  return match ? `${match[1]} CUSTOMERS` : "";
}

function extractCityCount(text) {
  const match = String(text || "").match(/(\d+)\s+cities/i);
  return match ? `${match[1]} CITIES` : "";
}

export function mapGeographicPage(raw) {
  const geographic = raw?.geographic ?? {};
  const kpi = geographic?.kpi ?? {};
  const charts = geographic?.charts ?? {};
  const customerCountByState = charts["Customer Count by State"] || {};
  const topRegionCount = customerCountByState[kpi.Top_Region?.Title] || "";

  return {
    kpis: {
      statesCovered: mapKpiItem(kpi.States_Covered, {
        label: "PAN INDIA",
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      }),

      topRegion: mapKpiItem(kpi.Top_Region, {
        label: extractCustomerCount(kpi.Top_Region?.Footer),
        bgColor: "#E8F5E9",
        textColor: "#43A047",
      }),

      totalCities: mapKpiItem(kpi.Total_Cities, {
        label: extractCityCount(kpi.Total_Cities?.Subtitle),
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      }),

      avgPerState: mapKpiItem(kpi.Avg_per_State, {
        label: "PER STATE",
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      }),
    },

    customerCountByState: toChartData(charts["Customer Count by State"]),
    regionalShare: toChartData(charts["Regional Share"]),
    topCitiesByCount: toChartData(charts["Top Cities by Count"]),

    table: geographic?.table ?? [],
  };
}

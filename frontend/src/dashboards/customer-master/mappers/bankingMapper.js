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

function extractPercent(text, suffix = "") {
  const match = String(text || "").match(/(\d+)%/);
  if (!match) return suffix || "";
  return suffix ? `${match[1]}% ${suffix}` : `${match[1]}%`;
}

export function mapBankingPage(raw) {
  const banking = raw?.banking ?? {};
  const kpi = banking?.kpi ?? {};
  const charts = banking?.charts ?? {};

  return {
    kpis: {
      withBankAccount: mapKpiItem(kpi.With_Bank_Account, {
        label: extractPercent(kpi.With_Bank_Account?.Subtitle),
        bgColor: "#E8F5E9",
        textColor: "#43A047",
      }),

      withoutBankAccount: mapKpiItem(kpi.Without_Bank_Account, {
        label: extractPercent(kpi.Without_Bank_Account?.Subtitle, "PENDING"),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      uniqueBanks: mapKpiItem(kpi.Unique_Banks, {
        label: "BANKS",
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      }),

      bankCoveragePercent: mapKpiItem(kpi.Bank_Coverage_Percent, {
        label: `${kpi.Bank_Coverage_Percent?.Title || "-"} RATE`,
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),
    },

    bankCoverageByRegion: toChartData(charts["Bank Coverage by Region"]),
    topBanksByCustomerCount: toChartData(charts["Top Banks by Customer Count"]),

    table: banking?.table ?? [],
  };
}

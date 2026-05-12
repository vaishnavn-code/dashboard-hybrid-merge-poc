function toNumber(value) {
  const cleaned = String(value ?? "")
    .replace("%", "")
    .replace(/,/g, "")
    .trim();

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function mapKpiItem(item, badge = null) {
  return {
    title: item?.Title ?? "-",
    subtitle: item?.Subtitle ?? "",
    footer: item?.Footer ?? "",
    badge,
  };
}

function toChartData(obj = {}) {
  return Object.entries(obj || {})
    .map(([name, value]) => ({
      name,
      value: toNumber(value),
    }))
    .sort((a, b) => b.value - a.value);
}

export function mapGlOverview(raw) {
  const overview = raw?.overview ?? {};
  const kpi = overview?.kpi ?? {};
  const charts = overview?.charts ?? {};

  return {
    kpis: {
      totalGlAccounts: mapKpiItem(kpi.Total_GL_Accounts, {
        label: "TOTAL",
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      }),

      balanceSheetAccounts: mapKpiItem(kpi.Balance_Sheet_Accounts, {
        label: "B/S",
        bgColor: "#E8F5E9",
        textColor: "#2E7D32",
      }),

      plAccounts: mapKpiItem(kpi.PL_Accounts, {
        label: "P&L",
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      blockedAccounts: mapKpiItem(kpi.Blocked_Accounts, {
        label: "BLOCKED",
        bgColor: "#FFEBEE",
        textColor: "#C62828",
      }),
    },

    accountTypeSplit: toChartData(charts["Account Type Split"]),
    accountsByRange: toChartData(charts["Accounts by Range"]),
    table: overview?.table ?? [],
  };
}
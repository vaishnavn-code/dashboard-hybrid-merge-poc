function toNumber(value) {
  const cleaned = String(value ?? "")
    .replace("%", "")
    .replace(/,/g, "")
    .trim();

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function mapKpiItem(item) {
  return {
    title: item?.Title ?? "-",
    subtitle: item?.Subtitle ?? "",
    footer: item?.Footer ?? "",
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

function toProgressList(obj = {}) {
  return Object.entries(obj || {})
    .map(([role, count]) => ({
      role,
      count: toNumber(count),
    }))
    .sort((a, b) => b.count - a.count);
}

export function mapGlAccountType(raw) {
  const accountType = raw?.account_type ?? {};
  const kpi = accountType?.kpi ?? {};
  const charts = accountType?.charts ?? {};

  return {
    kpis: {
      totalAccounts: mapKpiItem(kpi.Total_Accounts),
      bsAccounts: mapKpiItem(kpi.BS_Accounts),
      plAccounts: mapKpiItem(kpi.PL_Accounts),
      bsRatio: mapKpiItem(kpi.BS_Ratio),
    },

    balanceSheetAccountsByRange: toChartData(
      charts["Balance Sheet Accounts by Range"],
    ),

    plAccountsByRange: toChartData(
      charts["P&L Accounts by Range"],
    ),

    bsAccountCoverage: toProgressList(
      charts["B/S Account Coverage"],
    ),

    plAccountCoverage: toProgressList(
      charts["P&L Account Coverage"],
    ),
  };
}
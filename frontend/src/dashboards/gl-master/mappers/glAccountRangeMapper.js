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

const DEFAULT_RANGES = [
  { value: "1xxxxxxx", label: "1xxxxxxx - Capital & Liabilities" },
  { value: "2xxxxxxx", label: "2xxxxxxx - Assets" },
  { value: "3xxxxxxx", label: "3xxxxxxx - Income" },
  { value: "4xxxxxxx", label: "4xxxxxxx - Expenses" },
  { value: "5xxxxxxx", label: "5xxxxxxx - Control / Other" },
];

export function getGlRangeOptions(raw) {
  const accountRange = raw?.account_range ?? {};
  return accountRange?.ranges?.length ? accountRange.ranges : DEFAULT_RANGES;
}

export function getDefaultGlRange(raw) {
  const accountRange = raw?.account_range ?? {};
  return (
    accountRange?.selected_range ||
    getGlRangeOptions(raw)[0]?.value ||
    "1xxxxxxx"
  );
}

export function mapGlAccountRange(raw, selectedRange) {
  const accountRange = raw?.account_range ?? {};

  const selectedBlock =
    accountRange?.by_range?.[selectedRange] || accountRange;

  const kpi = selectedBlock?.kpi ?? {};
  const charts = selectedBlock?.charts ?? {};

  const accountsInRangeKey =
    Object.keys(charts).find((key) =>
      key.toLowerCase().startsWith("accounts in range"),
    ) || "Accounts in Range 1xxxxxxx";

  return {
    selectedRange,
    ranges: getGlRangeOptions(raw),

    kpis: {
      total: mapKpiItem(kpi.Total),
      bsAccounts: mapKpiItem(kpi.BS_Accounts),
      plAccounts: mapKpiItem(kpi.PL_Accounts),
      blocked: mapKpiItem(kpi.Blocked),
    },

    accountsInRange: toChartData(charts[accountsInRangeKey]),
    accountStatus: toChartData(charts["Account Status"]),
    table: selectedBlock?.table ?? [],
  };
}
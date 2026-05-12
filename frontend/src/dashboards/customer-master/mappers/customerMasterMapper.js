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

function toBankCoverageByState(obj = {}) {
  return Object.entries(obj)
    .map(([name, item]) => {
      const withBank = toNumber(
        item?.with_bank ??
          item?.withBank ??
          item?.["With Bank"] ??
          item?.["with bank"],
      );

      const noBank = toNumber(
        item?.no_bank ??
          item?.noBank ??
          item?.["No Bank"] ??
          item?.["no bank"],
      );

      return {
        name,
        withBank,
        noBank,

        // keep value also, so old chart types don't break if reused
        value: withBank,
      };
    })
    .sort((a, b) => {
      const totalA = a.withBank + a.noBank;
      const totalB = b.withBank + b.noBank;

      return totalB - totalA;
    });
}

function mapKpiItem(item, badge = null) {
  return {
    title: item?.Title ?? "-",
    subtitle: item?.Subtitle ?? "",
    footer: item?.Footer ?? "",
    badge,
  };
}

function extractPercent(text, suffix) {
  const match = String(text || "").match(/(\d+)%/);
  return match ? `${match[1]}% ${suffix}` : suffix;
}

function toRegionBarWithLineData(regionCounts = {}) {
  const totalCustomers = Object.values(regionCounts).reduce(
    (sum, value) => sum + toNumber(value),
    0,
  );

  return Object.entries(regionCounts)
    .map(([name, total]) => {
      const customerCount = toNumber(total);

      return {
        name,
        opening: customerCount,
        eir: totalCustomers
          ? Number(((customerCount / totalCustomers) * 100).toFixed(2))
          : 0,
      };
    })
    .sort((a, b) => b.opening - a.opening);
}

export function mapCustomerMasterOverview(raw) {
  const overview = raw?.overview ?? {};
  const kpi = overview?.kpi ?? {};
  const charts = overview?.charts ?? {};

  return {
    kpis: {
      totalCustomers: mapKpiItem(kpi.Total_Customers, {
        label: "FI CUSTOMERS",
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      }),

      withBankAccount: mapKpiItem(kpi.With_Bank_Account, {
        label: extractPercent(kpi.With_Bank_Account?.Subtitle, "COVERAGE"),
        bgColor: "#E8F5E9",
        textColor: "#43A047",
      }),

      gstinRegistered: mapKpiItem(kpi.GSTIN_Registered, {
        label: extractPercent(kpi.GSTIN_Registered?.Subtitle, "COMPLIANT"),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      statesCovered: mapKpiItem(kpi.States_Covered, {
        label: `${kpi.States_Covered?.Title || "-"} REGIONS`,
        bgColor: "#F3E5F5",
        textColor: "#8E24AA",
      }),
    },

    customersByRegion: toRegionBarWithLineData(
      charts["Customers by State / Region"],
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

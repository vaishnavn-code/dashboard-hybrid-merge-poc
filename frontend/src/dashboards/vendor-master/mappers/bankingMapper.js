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

function normalizeBankingRow(row = {}) {
  return {
    bp_no: row.bp_no || row.bp || "--",
    vendor_name: row.vendor_name || row.name || row.accountName || "--",
    bank_country: row.bank_country || row.bankCountry || "--",
    bank_id: row.bank_id || row.bankId || "--",
    bank_key: row.bank_key || row.bankKey || "--",
    bank_account: row.bank_account || row.bankAccount || "--",
    account_name: row.account_name || row.accountName || "--",
    account_holder: row.account_holder || row.accountHolder || "--",
    bank_name: row.bank_name || row.bankName || "--",
    bank_branch: row.bank_branch || row.bankBranch || "--",
    status: row.status || "Active",
  };
}

export function mapBanking(raw) {
  const banking = raw?.banking ?? {};
  const kpi = banking?.kpi ?? {};
  const charts = banking?.charts ?? {};

  return {
    kpis: {
      withBankAccount: mapKpiItem(kpi.With_Bank_Account, {
        label: "BANK AVAILABLE",
        bgColor: "#E8F5E9",
        textColor: "#2E7D32",
      }),

      withoutBankAccount: mapKpiItem(kpi.Without_Bank_Account, {
        label: "PENDING",
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      uniqueBanks: mapKpiItem(kpi.Unique_Banks, {
        label: "IFSC CODES",
        bgColor: "#E3F2FD",
        textColor: "#1565C0",
      }),

      bankCoveragePct: mapKpiItem(kpi.Bank_Coverage_Pct, {
        label: kpi.Bank_Coverage_Pct?.Title || "-",
        bgColor: "#F3E5F5",
        textColor: "#7B1FA2",
      }),
    },

    bankCoverageByRegion: objectToNameValueArray(
      charts["Bank Coverage by Region"],
    ),

    topBanksByVendorCount: objectToNameValueArray(
      charts["Top Banks by Vendor Count"],
    ),

    table: Array.isArray(banking.table)
      ? banking.table.map(normalizeBankingRow)
      : [],
  };
}
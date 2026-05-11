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

function clean(value) {
  return String(value ?? "").trim();
}

function isValidDuplicateKey(value) {
  const cleaned = clean(value);
  return cleaned && cleaned !== "--" && cleaned !== "-";
}

function groupDuplicates(rows, keyGetter, rowMapper) {
  const groups = {};

  rows.forEach((row) => {
    const key = clean(keyGetter(row));

    if (!isValidDuplicateKey(key)) return;

    if (!groups[key]) groups[key] = [];
    groups[key].push(rowMapper(row));
  });

  return Object.entries(groups)
    .filter(([, items]) => items.length > 1)
    .map(([groupKey, items]) => ({
      groupKey,
      count: items.length,
      rows: items,
    }))
    .sort((a, b) => b.count - a.count);
}

export function mapTaxCompliancePage(raw) {
  const taxCompliance = raw?.tax_compliance ?? {};
  const kpi = taxCompliance?.kpi ?? {};
  const charts = taxCompliance?.charts ?? {};
  const tableRows = taxCompliance?.table ?? [];

  return {
    kpis: {
      gstinRegistered: mapKpiItem(kpi.GSTIN_Registered),
      panOnFile: mapKpiItem(kpi.PAN_on_File),
      whtAssigned: mapKpiItem(kpi.WHT_Assigned),
      whtTypes: mapKpiItem(kpi.WHT_Types),
      duplicatePanNumbers: mapKpiItem(kpi.Duplicate_PAN_Numbers),
      duplicateGstinNumbers: mapKpiItem(kpi.Duplicate_GSTIN_Numbers),
    },

    whtTdsDistribution: toChartData(
      charts["WHT / TDS Code Distribution"]
    ),

    gstRegistrationStatus: toChartData(
      charts["GST Registration Status"]
    ),

    duplicates: {
      pan: groupDuplicates(
        tableRows,
        (row) => row.pan_no,
        (row) => ({
          bp_no: row.bp_no || "--",
          customer_name: row.customer_name || "--",
          gstin: row.gstin || "--",
          wht_description: row.wht_description || "--",
        })
      ),

      gstin: groupDuplicates(
        tableRows,
        (row) => row.gstin,
        (row) => ({
          bp_no: row.bp_no || "--",
          customer_name: row.customer_name || "--",
          pan_no: row.pan_no || "--",
          wht_description: row.wht_description || "--",
        })
      ),
    },

    table: tableRows,
  };
}
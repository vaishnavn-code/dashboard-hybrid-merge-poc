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

function extractPercent(text) {
  const match = String(text || "").match(/(\d+)%/);
  return match ? `${match[1]}%` : "";
}

function normalizeBackendGroups(groups) {
  if (!Array.isArray(groups)) return [];

  return groups.map((group) => {
    const rows = Array.isArray(group.rows) ? group.rows : [];

    return {
      groupKey:
        group.groupKey ||
        group.group_key ||
        group.key ||
        group.name ||
        group.value ||
        "--",
      count: Number(group.count || rows.length || 0),
      rows,
    };
  });
}

export function mapTaxCompliancePage(raw) {
  const taxCompliance = raw?.tax_compliance ?? {};
  const kpi = taxCompliance?.kpi ?? {};
  const charts = taxCompliance?.charts ?? {};
  const tableRows = taxCompliance?.table ?? [];

  const duplicateGroups = raw?.customer_master?.duplicate_groups ?? {};

  return {
    kpis: {
      gstinRegistered: mapKpiItem(kpi.GSTIN_Registered, {
        label: extractPercent(kpi.GSTIN_Registered?.Subtitle),
        bgColor: "#E8F5E9",
        textColor: "#43A047",
      }),

      panOnFile: mapKpiItem(kpi.PAN_on_File, {
        label: extractPercent(kpi.PAN_on_File?.Subtitle),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      whtAssigned: mapKpiItem(kpi.WHT_Assigned, {
        label: extractPercent(kpi.WHT_Assigned?.Subtitle),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      whtTypes: mapKpiItem(kpi.WHT_Types, {
        label: `${kpi.WHT_Types?.Title || "-"} CODES`,
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      }),

      duplicatePanNumbers: mapKpiItem(kpi.Duplicate_PAN_Numbers),
      duplicateGstinNumbers: mapKpiItem(kpi.Duplicate_GSTIN_Numbers),
    },

    whtTdsDistribution: toChartData(charts["WHT / TDS Code Distribution"]),

    gstRegistrationStatus: toChartData(charts["GST Registration Status"]),

    duplicates: {
      pan: normalizeBackendGroups(
        duplicateGroups.pan ||
          duplicateGroups.pan_numbers ||
          duplicateGroups.duplicate_pan_numbers,
      ),

      gstin: normalizeBackendGroups(
        duplicateGroups.gstin ||
          duplicateGroups.gstin_numbers ||
          duplicateGroups.duplicate_gstin_numbers,
      ),
    },

    table: tableRows,
  };
}

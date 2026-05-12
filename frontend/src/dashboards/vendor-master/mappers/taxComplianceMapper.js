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

function normalizeTaxRow(row = {}) {
  const vendorName =
    row.vendor_name || row.customer_name || row.name || row.bpFullName || "--";

  const pan = row.pan || row.pan_no || row.panNo || "--";

  const tdsCode = row.tds_code || row.tdsCode || row.wht_code || "--";

  const tdsDescription =
    row.tds_description ||
    row.tdsDesc ||
    row.tdsCodeDesc ||
    row.tds_desc ||
    row.wht_description ||
    "Not Assigned";

  return {
    bp_no: row.bp_no || row.bp || "--",

    // Keep customer_name alias because copied TaxCompliance.jsx reads customer_name.
    customer_name: vendorName,
    vendor_name: vendorName,

    // Keep pan_no alias because copied TaxCompliance.jsx reads pan_no.
    pan_no: pan,
    pan,

    gstin: row.gstin || row.gstIn || "--",
    tax_type: row.tax_type || row.taxType || "--",

    // Keep WHT aliases because copied TaxCompliance.jsx reads wht_code/wht_description.
    wht_code: tdsCode,
    wht_description: tdsDescription,

    // Vendor-specific aliases also available.
    tds_code: tdsCode,
    tds_description: tdsDescription,

    recon_account: row.recon_account || row.reconAct || "--",
  };
}

function isInvalidDuplicateValue(value) {
  const normalized = String(value ?? "").trim().toUpperCase();

  return (
    !normalized ||
    normalized === "-" ||
    normalized === "--" ||
    normalized === "NOTAVAILABLE" ||
    normalized === "PANNUMBER" ||
    normalized === "NOT REG." ||
    normalized === "NOT REGISTERED"
  );
}

function buildDuplicateGroupsFromTable(table = [], key) {
  const grouped = table.reduce((acc, row) => {
    const value = String(row[key] ?? "").trim();

    if (isInvalidDuplicateValue(value)) return acc;

    if (!acc[value]) acc[value] = [];
    acc[value].push(row);

    return acc;
  }, {});

  return Object.entries(grouped)
    .filter(([, rows]) => rows.length > 1)
    .map(([groupKey, rows]) => ({
      groupKey,
      count: rows.length,
      rows,
    }));
}

function normalizeResponseDuplicateGroup(value = {}) {
  if (Array.isArray(value)) {
    return value.map((group, index) => {
      if (group?.rows) {
        return {
          groupKey: group.groupKey || group.key || group.value || `Group ${index + 1}`,
          count: group.count || group.rows.length,
          rows: group.rows.map(normalizeTaxRow),
        };
      }

      const normalizedRow = normalizeTaxRow(group);

      return {
        groupKey:
          group.groupKey ||
          group.key ||
          group.pan ||
          group.pan_no ||
          group.gstin ||
          `Group ${index + 1}`,
        count: 1,
        rows: [normalizedRow],
      };
    });
  }

  return Object.entries(value || {}).map(([groupKey, rows]) => ({
    groupKey,
    count: Array.isArray(rows) ? rows.length : 0,
    rows: Array.isArray(rows) ? rows.map(normalizeTaxRow) : [],
  }));
}

function normalizeDuplicateGroups(rawGroups = {}, table = []) {
  const panFromResponse = normalizeResponseDuplicateGroup(
    rawGroups.pan || rawGroups.pans || {},
  );

  const gstinFromResponse = normalizeResponseDuplicateGroup(
    rawGroups.gstin || rawGroups.gstins || {},
  );

  const panFromTable = buildDuplicateGroupsFromTable(table, "pan_no");
  const gstinFromTable = buildDuplicateGroupsFromTable(table, "gstin");

  return {
    pan: panFromResponse.length > 0 ? panFromResponse : panFromTable,
    gstin: gstinFromResponse.length > 0 ? gstinFromResponse : gstinFromTable,
  };
}

export function mapTaxCompliancePage(raw) {
  const taxCompliance = raw?.tax_compliance ?? {};
  const kpi = taxCompliance?.kpi ?? {};
  const charts = taxCompliance?.charts ?? {};

  const table = Array.isArray(taxCompliance.table)
    ? taxCompliance.table.map(normalizeTaxRow)
    : [];

  const duplicates = normalizeDuplicateGroups(
    taxCompliance.duplicate_groups || taxCompliance.duplicates || {},
    table,
  );

  const duplicatePanRecordCount = duplicates.pan.reduce(
    (sum, group) => sum + Number(group.count || group.rows?.length || 0),
    0,
  );

  const duplicateGstinRecordCount = duplicates.gstin.reduce(
    (sum, group) => sum + Number(group.count || group.rows?.length || 0),
    0,
  );

  return {
    kpis: {
      gstinRegistered: mapKpiItem(kpi.GSTIN_Registered, {
        label: "GST",
        bgColor: "#E8F5E9",
        textColor: "#2E7D32",
      }),

      panOnFile: mapKpiItem(kpi.PAN_on_File, {
        label: "PAN",
        bgColor: "#E3F2FD",
        textColor: "#1565C0",
      }),

      tdsAssigned: mapKpiItem(kpi.TDS_Assigned, {
        label: "TDS",
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      tdsCategories: mapKpiItem(kpi.TDS_Categories, {
        label: "CATEGORIES",
        bgColor: "#F3E5F5",
        textColor: "#7B1FA2",
      }),

      duplicatePanNumbers: {
        title: String(duplicates.pan.length),
        subtitle: `groups | ${duplicatePanRecordCount} vendors`,
        footer:
          duplicates.pan.length > 0
            ? "Shared PAN numbers found across vendor records"
            : "No duplicate PAN groups found",
      },

      duplicateGstinNumbers: {
        title: String(duplicates.gstin.length),
        subtitle: `groups | ${duplicateGstinRecordCount} vendors`,
        footer:
          duplicates.gstin.length > 0
            ? "Shared GSTIN numbers found across vendor records"
            : "No duplicate GSTIN groups found",
      },
    },

    tdsCodeDistribution: objectToNameValueArray(
      charts["TDS Code Distribution"],
    ),

    gstRegistrationStatus: objectToNameValueArray(
      charts["GST Registration Status"],
    ),

    duplicates,

    table,
  };
}
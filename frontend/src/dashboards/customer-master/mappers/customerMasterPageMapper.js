function mapKpiItem(item, badge = null) {
  return {
    title: item?.Title ?? "-",
    subtitle: item?.Subtitle ?? "",
    footer: item?.Footer ?? "",
    badge,
  };
}

function extractCustomerBadge(text) {
  const match = String(text || "").match(/(\d+)\s+customers/i);

  if (!match) return null;

  return `${match[1]} CUSTOMERS`;
}

function calcPercentBadge(value, total) {
  const current = Number(String(value || "").replace("%", ""));
  const base = Number(String(total || "").replace("%", ""));

  if (!current || !base) return null;

  return `${Math.round((current / base) * 100)}% OF BASE`;
}

function getTitle(item, fallback = "-") {
  return item?.Title ?? fallback;
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

function normalizeBackendGroups(groups) {
  if (!Array.isArray(groups)) return [];

  return groups.map((group) => {
    const rows = Array.isArray(group.rows)
      ? group.rows
      : Array.isArray(group.items)
        ? group.items
        : Array.isArray(group.customers)
          ? group.customers
          : [];

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

function pickBackendOrDerived(backendGroups, derivedGroups) {
  const normalized = normalizeBackendGroups(backendGroups);
  return normalized.length > 0 ? normalized : derivedGroups;
}

export function mapCustomerMasterPage(raw) {
  const customerMaster = raw?.customer_master ?? {};
  const customerKpi = customerMaster?.kpi ?? {};
  const customerRows = customerMaster?.table ?? [];
  const bankingRows = raw?.banking?.table ?? [];

  const overviewKpi = raw?.overview?.kpi ?? {};
  const taxKpi = raw?.tax_compliance?.kpi ?? {};

  const totalBps = getTitle(overviewKpi.Total_Customers);
  const statesCovered = getTitle(overviewKpi.States_Covered);
  const withBank = getTitle(overviewKpi.With_Bank_Account);
  const gstinCompliant = getTitle(overviewKpi.GSTIN_Registered);
  const withPan = getTitle(taxKpi.PAN_on_File);

  const backendDuplicateGroups =
    customerMaster?.duplicate_groups || customerMaster?.duplicates || {};

  const derivedDuplicates = {
    names: groupDuplicates(
      customerRows,
      (row) => row.name,
      (row) => ({
        bp_no: row.bp_no || "--",
        customer_name: row.name || row.customer_name || "--",
        city: row.city || "--",
        pan_no: row.pan_no || "--",
      }),
    ),

    pan: groupDuplicates(
      customerRows,
      (row) => row.pan_no,
      (row) => ({
        bp_no: row.bp_no || "--",
        customer_name: row.name || row.customer_name || "--",
        city: row.city || "--",
      }),
    ),

    gstin: groupDuplicates(
      customerRows,
      (row) => row.gstin,
      (row) => ({
        bp_no: row.bp_no || "--",
        customer_name: row.name || row.customer_name || "--",
        city: row.city || "--",
      }),
    ),

    bankAccounts: groupDuplicates(
      bankingRows,
      (row) => row.bank_account,
      (row) => ({
        bp_no: row.bp_no || "--",
        customer_name: row.customer_name || row.name || "--",
        city: row.city || "--",
        bank: row.bank_key_ifsc || row.bank_name || "--",
      }),
    ),
  };

  return {
    summary: {
      totalBps,
      statesCovered,
      withBank,
      gstinCompliant,
      withPan,

      chips: [
        { label: "Total BPs", value: totalBps },
        { label: "States", value: statesCovered },
        { label: "With Bank", value: withBank },
        { label: "GSTIN Compliant", value: gstinCompliant },
        { label: "With PAN", value: withPan },
      ],
    },

    kpis: {
      totalDuplicateBps: mapKpiItem(customerKpi.Total_Duplicate_BPs, {
        label: calcPercentBadge(
          customerKpi.Total_Duplicate_BPs?.Title,
          overviewKpi.Total_Customers?.Title,
        ),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      duplicatePanGroups: mapKpiItem(customerKpi.Duplicate_PAN_Groups, {
        label: extractCustomerBadge(customerKpi.Duplicate_PAN_Groups?.Subtitle),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      duplicateGstinGroups: mapKpiItem(customerKpi.Duplicate_GSTIN_Groups, {
        label: extractCustomerBadge(
          customerKpi.Duplicate_GSTIN_Groups?.Subtitle,
        ),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      duplicateBankAccounts: mapKpiItem(customerKpi.Duplicate_Bank_Accts, {
        label: extractCustomerBadge(customerKpi.Duplicate_Bank_Accts?.Subtitle),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),
    },

    duplicates: {
      names: pickBackendOrDerived(
        backendDuplicateGroups.names ||
          backendDuplicateGroups.bp_names ||
          backendDuplicateGroups.duplicate_bp_names,
        derivedDuplicates.names,
      ),

      pan: pickBackendOrDerived(
        backendDuplicateGroups.pan ||
          backendDuplicateGroups.pan_numbers ||
          backendDuplicateGroups.duplicate_pan_numbers,
        derivedDuplicates.pan,
      ),

      gstin: pickBackendOrDerived(
        backendDuplicateGroups.gstin ||
          backendDuplicateGroups.gstin_numbers ||
          backendDuplicateGroups.duplicate_gstin_numbers,
        derivedDuplicates.gstin,
      ),

      bankAccounts: pickBackendOrDerived(
        backendDuplicateGroups.bankAccounts ||
          backendDuplicateGroups.bank_accounts ||
          backendDuplicateGroups.duplicate_bank_accounts,
        derivedDuplicates.bankAccounts,
      ),
    },

    table: customerRows,
  };
}

function mapKpiItem(item, badge = null) {
  return {
    title: item?.Title ?? "-",
    subtitle: item?.Subtitle ?? "",
    footer: item?.Footer ?? "",
    badge,
  };
}

function extractVendorBadge(text) {
  const match = String(text || "").match(/(\d+)\s+vendors/i);

  if (!match) return null;

  return `${match[1]} VENDORS`;
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

function normalizeVendorRow(row = {}) {
  return {
    bp_no: row.bp_no || row.bp || "--",
    bp_full_name: row.bp_full_name || row.bpFullName || "--",
    bp_type: row.bp_type || row.bpType || "--",
    vendor_acct: row.vendor_acct || row.vendorAcct || "--",
    name: row.name || row.vendor_name || row.accountName || "--",
    city: row.city || "--",
    region: row.region || "--",
    email: row.email || "--",
    mobile: row.mobile || "--",

    bank_country: row.bank_country || row.bankCountry || "--",
    bank_key: row.bank_key || row.bankKey || "--",
    bank_account: row.bank_account || row.bankAccount || "--",
    account_name: row.account_name || row.accountName || "--",
    account_holder: row.account_holder || row.accountHolder || "--",
    bank_name: row.bank_name || row.bankName || "--",
    bank_branch: row.bank_branch || row.bankBranch || "--",

    role_type: row.role_type || row.roleType || "--",
    role_code: row.role_code || row.roleCode || "--",

    tax_number: row.tax_number || row.taxNumber || "--",
    tax_type: row.tax_type || row.taxType || "--",

    tds_code: row.tds_code || row.tdsCode || "--",
    tds_desc: row.tds_desc || row.tdsDesc || row.tdsCodeDesc || "--",
    tds_code_ext: row.tds_code_ext || row.tdsCodeExt || "--",
    tds_code_desc: row.tds_code_desc || row.tdsCodeDesc || "--",

    withholding_subj:
      row.withholding_subj || row.withholdingSubject || "--",
    recipient: row.recipient || row.recipientDesc || "--",

    pan_no: row.pan_no || row.panNo || row.pan || "--",
    gstin: row.gstin || row.gstIn || row.gst || "--",

    bank:
      row.bank ||
      row.bank_key_ifsc ||
      row.bankKey ||
      row.bank_name ||
      row.bankName ||
      (row.bankAccount ? "Yes" : "No"),

    recon_acct: row.recon_acct || row.reconAct || "--",
    msme: row.msme || "--",
    msme_no: row.msme_no || row.msmeNo || "--",
  };
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

function normalizeBackendGroups(groups, groupKeyCandidates = []) {
  if (!Array.isArray(groups)) return [];

  return groups.map((group) => {
    const rows = Array.isArray(group.rows)
      ? group.rows
      : Array.isArray(group.items)
        ? group.items
        : Array.isArray(group.vendors)
          ? group.vendors
          : [];

    const groupKey =
      group.groupKey ||
      group.group_key ||
      group.key ||
      group.value ||
      group.name ||
      group.pan ||
      group.gstin ||
      group.bank_account ||
      group.bankAccount ||
      groupKeyCandidates.map((key) => group[key]).find(Boolean) ||
      "--";

    return {
      groupKey,
      count: Number(group.count || rows.length || 0),
      rows: rows.map(normalizeDuplicateVendorRow),
    };
  });
}

function normalizeDuplicateVendorRow(row = {}) {
  return {
    bp_no: row.bp_no || row.bp || "--",
    vendor_name: row.vendor_name || row.name || row.accountName || "--",
    city: row.city || "--",
    pan_no: row.pan_no || row.panNo || row.pan || "--",
    gstin: row.gstin || row.gstIn || row.gst || "--",
    bank: row.bank || row.bank_key_ifsc || row.bankKey || row.bankName || "--",
  };
}

function pickBackendOrDerived(backendGroups, derivedGroups, groupKeyCandidates) {
  const normalized = normalizeBackendGroups(backendGroups, groupKeyCandidates);
  return normalized.length > 0 ? normalized : derivedGroups;
}

export function mapVendorMasterPage(raw) {
  const vendorMaster = raw?.vendor_master ?? {};
  const vendorKpi = vendorMaster?.kpi ?? {};
  const vendorRows = Array.isArray(vendorMaster?.table)
    ? vendorMaster.table.map(normalizeVendorRow)
    : Array.isArray(raw?.vendors)
      ? raw.vendors.map(normalizeVendorRow)
      : [];

  const bankingRows = Array.isArray(raw?.banking?.table)
    ? raw.banking.table.map(normalizeVendorRow)
    : vendorRows;

  const overviewKpi = raw?.overview?.kpi ?? {};
  const taxKpi = raw?.tax_compliance?.kpi ?? {};

  const totalBps = getTitle(overviewKpi.Total_Vendors);
  const statesCovered = getTitle(overviewKpi.States_Covered);
  const withBank = getTitle(overviewKpi.With_Bank_Account);
  const gstinCompliant = getTitle(overviewKpi.GSTIN_Registered);
  const withPan = getTitle(taxKpi.PAN_on_File);

  const backendDuplicateGroups =
    vendorMaster?.duplicate_groups || vendorMaster?.duplicates || {};

  const derivedDuplicates = {
    names: groupDuplicates(
      vendorRows,
      (row) => row.name,
      (row) => ({
        bp_no: row.bp_no || "--",
        vendor_name: row.name || "--",
        city: row.city || "--",
        pan_no: row.pan_no || "--",
      }),
    ),

    pan: groupDuplicates(
      vendorRows,
      (row) => row.pan_no,
      (row) => ({
        bp_no: row.bp_no || "--",
        vendor_name: row.name || "--",
        city: row.city || "--",
      }),
    ),

    gstin: groupDuplicates(
      vendorRows,
      (row) => row.gstin,
      (row) => ({
        bp_no: row.bp_no || "--",
        vendor_name: row.name || "--",
        city: row.city || "--",
      }),
    ),

    bankAccounts: groupDuplicates(
      bankingRows,
      (row) => row.bank_account,
      (row) => ({
        bp_no: row.bp_no || "--",
        vendor_name: row.name || "--",
        city: row.city || "--",
        bank: row.bank_key || row.bank_name || row.bank || "--",
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
      totalDuplicateBps: mapKpiItem(vendorKpi.Total_Duplicate_BPs, {
        label: calcPercentBadge(
          vendorKpi.Total_Duplicate_BPs?.Title,
          overviewKpi.Total_Vendors?.Title,
        ),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      duplicatePanGroups: mapKpiItem(vendorKpi.Duplicate_PAN_Groups, {
        label: extractVendorBadge(vendorKpi.Duplicate_PAN_Groups?.Subtitle),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      duplicateGstinGroups: mapKpiItem(vendorKpi.Duplicate_GSTIN_Groups, {
        label: extractVendorBadge(
          vendorKpi.Duplicate_GSTIN_Groups?.Subtitle,
        ),
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      }),

      duplicateBankAccounts: mapKpiItem(vendorKpi.Duplicate_Bank_Accts, {
        label: extractVendorBadge(vendorKpi.Duplicate_Bank_Accts?.Subtitle),
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
        ["name"],
      ),

      pan: pickBackendOrDerived(
        backendDuplicateGroups.pan ||
          backendDuplicateGroups.pan_numbers ||
          backendDuplicateGroups.duplicate_pan_numbers,
        derivedDuplicates.pan,
        ["pan"],
      ),

      gstin: pickBackendOrDerived(
        backendDuplicateGroups.gstin ||
          backendDuplicateGroups.gstin_numbers ||
          backendDuplicateGroups.duplicate_gstin_numbers,
        derivedDuplicates.gstin,
        ["gstin"],
      ),

      bankAccounts: pickBackendOrDerived(
        backendDuplicateGroups.bankAccounts ||
          backendDuplicateGroups.bank_accounts ||
          backendDuplicateGroups.duplicate_bank_accounts,
        derivedDuplicates.bankAccounts,
        ["bank_account", "bankAccount"],
      ),
    },

    table: vendorRows,
  };
}
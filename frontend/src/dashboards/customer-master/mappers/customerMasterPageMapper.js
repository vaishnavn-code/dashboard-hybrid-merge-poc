function mapKpiItem(item) {
  return {
    title: item?.Title ?? "-",
    subtitle: item?.Subtitle ?? "",
    footer: item?.Footer ?? "",
  };
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

  return {
    summary: {
      totalBps,
      statesCovered,
      withBank,
      gstinCompliant,
      withPan,

      chips: [
        {
          label: "Total BPs",
          value: totalBps,
        },
        {
          label: "States",
          value: statesCovered,
        },
        {
          label: "With Bank",
          value: withBank,
        },
        {
          label: "GSTIN Compliant",
          value: gstinCompliant,
        },
        {
          label: "With PAN",
          value: withPan,
        },
      ],
    },

    kpis: {
      totalDuplicateBps: mapKpiItem(customerKpi.Total_Duplicate_BPs),
      duplicatePanGroups: mapKpiItem(customerKpi.Duplicate_PAN_Groups),
      duplicateGstinGroups: mapKpiItem(customerKpi.Duplicate_GSTIN_Groups),
      duplicateBankAccounts: mapKpiItem(customerKpi.Duplicate_Bank_Accts),
    },

    duplicates: {
      names: groupDuplicates(
        customerRows,
        (row) => row.name,
        (row) => ({
          bp_no: row.bp_no || "--",
          customer_name: row.name || "--",
          city: row.city || "--",
          pan_no: row.pan_no || "--",
        })
      ),

      pan: groupDuplicates(
        customerRows,
        (row) => row.pan_no,
        (row) => ({
          bp_no: row.bp_no || "--",
          customer_name: row.name || "--",
          city: row.city || "--",
        })
      ),

      gstin: groupDuplicates(
        customerRows,
        (row) => row.gstin,
        (row) => ({
          bp_no: row.bp_no || "--",
          customer_name: row.name || "--",
          city: row.city || "--",
        })
      ),

      bankAccounts: groupDuplicates(
        bankingRows,
        (row) => row.bank_account,
        (row) => ({
          bp_no: row.bp_no || "--",
          customer_name: row.customer_name || "--",
          city: row.city || "--",
          bank: row.bank_key_ifsc || row.bank_name || "--",
        })
      ),
    },

    table: customerRows,
  };
}
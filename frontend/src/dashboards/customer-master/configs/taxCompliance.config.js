export const taxComplianceConfig = {
  sectionLabel: "Tax & Compliance",

  kpis: [
    {
      label: "GSTIN Registered",
      valuePath: "kpis.gstinRegistered.title",
      subPath: "kpis.gstinRegistered.subtitle",
      footerPath: "kpis.gstinRegistered.footer",
      iconName: "document",
      accent: "c1",
      sparkPct: 77,
      badgePath: "kpis.gstinRegistered.badge",
    },
    {
      label: "PAN On File",
      valuePath: "kpis.panOnFile.title",
      subPath: "kpis.panOnFile.subtitle",
      footerPath: "kpis.panOnFile.footer",
      iconName: "storage",
      accent: "c2",
      sparkPct: 12,
      badgePath: "kpis.panOnFile.badge",
    },
    {
      label: "WHT Assigned",
      valuePath: "kpis.whtAssigned.title",
      subPath: "kpis.whtAssigned.subtitle",
      footerPath: "kpis.whtAssigned.footer",
      iconName: "alert",
      accent: "c3",
      sparkPct: 15,
      badgePath: "kpis.whtAssigned.badge",
    },
    {
      label: "WHT Types",
      valuePath: "kpis.whtTypes.title",
      subPath: "kpis.whtTypes.subtitle",
      footerPath: "kpis.whtTypes.footer",
      iconName: "graph",
      accent: "c4",
      sparkPct: 100,
      badgePath: "kpis.whtTypes.badge",
    },
  ],

  charts: [
    {
      section: "twoCol",
      type: "verticalBar",
      title: "WHT / TDS Code Distribution",
      subtitle: "WITHHOLDING TAX CODE DISTRIBUTION",
      dataPath: "whtTdsDistribution",
      slantLabels: true,
      limitOptions: [5, 10, 15, 20],
      defaultLimit: 10,
    },
    {
      section: "twoCol",
      type: "donut",
      title: "GST Registration Status",
      subtitle: "GSTIN REGISTERED VS NOT REGISTERED",
      dataPath: "gstRegistrationStatus",
    },
  ],

  duplicateSections: [
    {
      title: "Duplicate PAN Numbers",
      badgeVariant: "warn",
      dataPath: "duplicates.pan",
      columns: [
        { key: "bp_no", label: "BP No." },
        { key: "customer_name", label: "Customer Name" },
        { key: "gstin", label: "GSTIN" },
        { key: "wht_description", label: "WHT Description" },
      ],
    },
    {
      title: "Duplicate GSTIN Numbers",
      badgeVariant: "risk",
      dataPath: "duplicates.gstin",
      columns: [
        { key: "bp_no", label: "BP No." },
        { key: "customer_name", label: "Customer Name" },
        { key: "pan_no", label: "PAN" },
        { key: "wht_description", label: "WHT Description" },
      ],
    },
  ],

  table: {
    title: "Tax & Compliance Register",
    subtitle: "CUSTOMER TAX MASTER RECORDS",
    dataPath: "table",
    columns: [
      { key: "bp_no", label: "BP No." },
      { key: "customer_name", label: "Customer Name" },
      { key: "pan_no", label: "PAN No." },
      { key: "gstin", label: "GSTIN" },
      { key: "tax_type", label: "Tax Type" },
      { key: "wht_code", label: "WHT Code" },
      { key: "wht_description", label: "WHT Description" },
      { key: "recon_account", label: "Recon Account" },
    ],
  },
};

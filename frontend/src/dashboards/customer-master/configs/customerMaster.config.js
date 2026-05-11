export const customerMasterConfig = {
  sectionLabel: "Customer Master Overview",

  kpis: [
    {
      label: "Total Customers",
      valuePath: "kpis.totalCustomers.title",
      subPath: "kpis.totalCustomers.subtitle",
      footerPath: "kpis.totalCustomers.footer",
      iconName: "personFolder",
      accent: "c1",
      sparkPct: 100,
      badge: {
        label: "Customers",
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      },
    },
    {
      label: "With Bank Account",
      valuePath: "kpis.withBankAccount.title",
      subPath: "kpis.withBankAccount.subtitle",
      footerPath: "kpis.withBankAccount.footer",
      iconName: "storage",
      accent: "c2",
      sparkPct: 65,
      badge: {
        label: "Banking",
        bgColor: "#E0F7FA",
        textColor: "#00ACC1",
      },
    },
    {
      label: "GSTIN Registered",
      valuePath: "kpis.gstinRegistered.title",
      subPath: "kpis.gstinRegistered.subtitle",
      footerPath: "kpis.gstinRegistered.footer",
      iconName: "document",
      accent: "c3",
      sparkPct: 77,
      badge: {
        label: "GST",
        bgColor: "#E8F5E9",
        textColor: "#43A047",
      },
    },
    {
      label: "States Covered",
      valuePath: "kpis.statesCovered.title",
      subPath: "kpis.statesCovered.subtitle",
      footerPath: "kpis.statesCovered.footer",
      iconName: "graph",
      accent: "c4",
      sparkPct: 39,
      badge: {
        label: "Geo",
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      },
    },
  ],

  charts: [
    {
      section: "twoCol",
      type: "verticalBarWithLine",
      title: "Customers by State / Region",
      subtitle: "GEOGRAPHIC DISTRIBUTION",
      dataPath: "customersByRegion",

      controls: {
        badge: "Region",
        options: ["AUTO"],
        defaultValue: "AUTO",
        helperText: "Bars = Total / With Bank | Line = No Bank",
      },

      axis: {
        xLabel: "State / Region",
        yLeftLabel: "Customers",
        yRightLabel: "No Bank",
      },
    },
    {
      section: "twoCol",
      type: "donut",
      title: "TDS / WHT Category Breakdown",
      subtitle: "WITHHOLDING TAX TYPES",
      dataPath: "tdsBreakdown",
    },
    {
      section: "twoCol",
      type: "donut",
      title: "Bank Account Coverage",
      subtitle: "BANKING REGISTRATION STATUS",
      dataPath: "bankCoverage",
    },
    {
      section: "twoCol",
      type: "verticalBar",
      title: "Top Cities by Customer Count",
      subtitle: "CITY DISTRIBUTION",
      dataPath: "topCities",
      slantLabels: true,

    },
    {
      section: "twoCol",
      type: "verticalBar",
      title: "Bank Coverage by State",
      subtitle: "WITH BANK CUSTOMERS BY STATE",
      dataPath: "bankCoverageByState",
    },
    {
      section: "twoCol",
      type: "donut",
      title: "Reconciliation Account Split",
      subtitle: "RECON ACCOUNT TYPE DISTRIBUTION",
      dataPath: "reconciliationSplit",  
    },
  ],
};

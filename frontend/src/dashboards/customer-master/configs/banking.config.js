export const bankingConfig = {
  sectionLabel: "Banking",

  kpis: [
    {
      label: "With Bank Account",
      valuePath: "kpis.withBankAccount.title",
      subPath: "kpis.withBankAccount.subtitle",
      footerPath: "kpis.withBankAccount.footer",
      iconName: "storage",
      accent: "c1",
      sparkPct: 65,
      badge: {
        label: "With Bank",
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      },
    },
    {
      label: "Without Bank Account",
      valuePath: "kpis.withoutBankAccount.title",
      subPath: "kpis.withoutBankAccount.subtitle",
      footerPath: "kpis.withoutBankAccount.footer",
      iconName: "document",
      accent: "c2",
      sparkPct: 35,
      badge: {
        label: "Pending",
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      },
    },
    {
      label: "Unique Banks",
      valuePath: "kpis.uniqueBanks.title",
      subPath: "kpis.uniqueBanks.subtitle",
      footerPath: "kpis.uniqueBanks.footer",
      iconName: "personFolder",
      accent: "c3",
      sparkPct: 70,
      badge: {
        label: "Banks",
        bgColor: "#E0F7FA",
        textColor: "#00ACC1",
      },
    },
    {
      label: "Bank Coverage Percent",
      valuePath: "kpis.bankCoveragePercent.title",
      subPath: "kpis.bankCoveragePercent.subtitle",
      footerPath: "kpis.bankCoveragePercent.footer",
      iconName: "graph",
      accent: "c4",
      sparkPct: 65,
      badge: {
        label: "Coverage",
        bgColor: "#E8F5E9",
        textColor: "#43A047",
      },
    },
  ],

  charts: [
    {
      section: "twoCol",
      type: "verticalBar",
      title: "Bank Coverage by Region",
      subtitle: "CUSTOMERS WITH BANK DETAILS BY REGION",
      dataPath: "bankCoverageByRegion",
    },
    {
      section: "twoCol",
      type: "verticalBar",
      title: "Top Banks by Customer Count",
      subtitle: "BANK-WISE CUSTOMER DISTRIBUTION",
      dataPath: "topBanksByCustomerCount",
    },
  ],

  table: {
    title: "Banking Details Register",
    subtitle: "CUSTOMER BANKING MASTER RECORDS",
    dataPath: "table",
    columns: [
      { key: "bp_no", label: "BP No." },
      { key: "customer_name", label: "Customer Name" },
      { key: "bank_country", label: "Bank Country" },
      { key: "bank_key_ifsc", label: "Bank Key / IFSC" },
      { key: "bank_account", label: "Bank Account" },
      { key: "account_name", label: "Account Name" },
      { key: "account_holder", label: "Account Holder" },
      { key: "bank_name", label: "Bank Name" },
      { key: "branch", label: "Branch" },
      { key: "status", label: "Status" },
    ],
  },
};
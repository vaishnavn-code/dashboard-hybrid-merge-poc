export const glAccountTypeConfig = {
  sectionLabel: "Account Type Analysis",

  kpis: [
    {
      label: "Total Accounts",
      valuePath: "kpis.totalAccounts.title",
      accent: "c1",
    },
    {
      label: "B/S Accounts",
      valuePath: "kpis.bsAccounts.title",
      accent: "c2",
    },
    {
      label: "P&L Accounts",
      valuePath: "kpis.plAccounts.title",
      accent: "c3",
    },
    {
      label: "B/S Ratio",
      valuePath: "kpis.bsRatio.title",
      accent: "c4",
    },
  ],

  charts: [
    {
      title: "Balance Sheet Accounts by Range",
      subtitle: "B/S GL ACCOUNTS DISTRIBUTED BY RANGE",
      type: "verticalBar",
      dataPath: "balanceSheetAccountsByRange",
      xKey: "name",
      barKey: "value",
      slantLabels: false,
      height: 330,
      barSize: 42,
    },
    {
      title: "P&L Accounts by Range",
      subtitle: "P&L GL ACCOUNTS DISTRIBUTED BY RANGE",
      type: "verticalBar",
      dataPath: "plAccountsByRange",
      xKey: "name",
      barKey: "value",
      slantLabels: false,
      height: 330,
      barSize: 42,
    },
  ],

  progressCards: [
    {
      title: "B/S Account Coverage",
      subtitle: "BALANCE SHEET COVERAGE ACROSS ALL RANGES",
      dataPath: "bsAccountCoverage",
      insight: "Shows where balance sheet accounts are concentrated by GL range.",
    },
    {
      title: "P&L Account Coverage",
      subtitle: "PROFIT & LOSS COVERAGE ACROSS ALL RANGES",
      dataPath: "plAccountCoverage",
      insight: "Shows where P&L accounts are concentrated by GL range.",
    },
  ],
};
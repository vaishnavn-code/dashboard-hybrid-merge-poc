export const glAccountRangeConfig = {
  sectionLabel: "Account Range Analysis",

  kpis: [
    {
      label: "Total",
      valuePath: "kpis.total.title",
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
      label: "Blocked",
      valuePath: "kpis.blocked.title",
      accent: "c4",
    },
  ],

  charts: [
    {
      title: "Accounts in Selected Range",
      subtitle: "BALANCE SHEET VS P&L ACCOUNTS",
      type: "verticalBar",
      dataPath: "accountsInRange",
      xKey: "name",
      barKey: "value",
      slantLabels: false,
      height: 330,
      barSize: 42,
    },
    {
      title: "Account Status",
      subtitle: "ACTIVE VS BLOCKED ACCOUNTS",
      type: "donut",
      dataPath: "accountStatus",
      nameKey: "name",
      valueKey: "value",
      height: 320,
      colors: ["#1565C0", "#EF5350"],
    },
  ],

  table: {
    title: "Accounts in Selected Range",
    subtitle: "GL ACCOUNT DETAILS FOR SELECTED RANGE",
    dataPath: "table",
    columns: [
      { key: "gl_account", label: "GL Account" },
      { key: "short_text", label: "Short Text" },
      { key: "long_text", label: "Long Text" },
      { key: "type", label: "Type" },
      { key: "blk_post", label: "Posting Block" },
      { key: "blk_cocode", label: "CoCode Block" },
      { key: "mrk_del", label: "Deletion Mark" },
    ],
  },
};
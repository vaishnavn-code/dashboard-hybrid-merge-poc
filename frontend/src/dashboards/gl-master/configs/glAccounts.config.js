export const glAccountsConfig = {
  sectionLabel: "Complete GL Account List",

  table: {
    title: "All GL Accounts",
    dataPath: "table",
    columns: [
      { key: "co_code", label: "Co Code" },
      { key: "coa", label: "CoA" },
      { key: "gl_account", label: "G/L Acct" },
      { key: "short_text", label: "Short Text" },
      { key: "long_text", label: "Long Text" },
      { key: "bs", label: "B/S" },
      { key: "blk_post", label: "Blk Post" },
      { key: "blk_cocode", label: "Blk CoCode" },
      { key: "mrk_del", label: "Mrk Del" },
    ],
  },
};
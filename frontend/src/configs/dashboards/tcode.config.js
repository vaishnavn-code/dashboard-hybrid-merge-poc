export const tcodeConfig = {
  sectionLabel: "T-Codes",

  charts: [
    {
      section: "twoCol",
      type: "verticalBar",
      title: "T-Codes per Role — Permission Scope",
      slantLabels: true,
      subtitle: "TCODES PER ROLE",
      dataPath: "tcodesPerRole",
      axis: {
        yAxisLabel: "T-Code Count",
      },
    },
    {
      section: "twoCol",
      type: "donut",
      title: "T-Code Distribution by Role Type",
      subtitle: "ROLE TYPE SPLIT",
      dataPath: "tcodeRoleTypeDistribution",
      colors: ["#0B2E6B", "#1976D2", "#2EA3F2", "#90CAF9", "#00ACC1", "#7B1FA2"],
    },
  ],

  table: {
    title: "Role ↔ T-Code Mapping — L3",
    dataPath: "tableData",
    columns: [
      { key: "roleId", label: "Role ID" },
      { key: "roleDesc", label: "Role Description" },
      { key: "tCode", label: "T-Code" },
      { key: "tcodeDesc", label: "T-Code Description" },
    ],
  },
};
export const usersConfig = {
  sectionLabel: "Users",

  kpis: [
    {
      label: "Active Users",
      valuePath: "kpis.activeUsers.title",
      subPath: "kpis.activeUsers.subtitle",
      footerPath: "kpis.activeUsers.footer",
      iconName: "personFolder",
      accent: "c1",
      sparkPct: 100,
      badge: {
        label: "Active",
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      },
    },
    {
      label: "Inactive Users",
      valuePath: "kpis.inactiveUsers.title",
      subPath: "kpis.inactiveUsers.subtitle",
      footerPath: "kpis.inactiveUsers.footer",
      iconName: "document",
      accent: "c2",
      sparkPct: 70,
      badge: {
        label: "Inactive",
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      },
    },
    {
      label: "Dialog Users",
      valuePath: "kpis.dialogUsers.title",
      subPath: "kpis.dialogUsers.subtitle",
      footerPath: "kpis.dialogUsers.footer",
      iconName: "storage",
      accent: "c3",
      sparkPct: 55,
      badge: {
        label: "Dialog",
        bgColor: "#E0F7FA",
        textColor: "#00ACC1",
      },
    },
    {
      label: "System / Service",
      valuePath: "kpis.systemService.title",
      subPath: "kpis.systemService.subtitle",
      footerPath: "kpis.systemService.footer",
      iconName: "graph",
      accent: "c4",
      sparkPct: 40,
      badge: {
        label: "System",
        bgColor: "#E8F5E9",
        textColor: "#43A047",
      },
    },
  ],

  table: {
    title: "User Register",
    dataPath: "tableData",
    columns: [
      { key: "uid", label: "User ID" },
      { key: "name", label: "Name" },
      {
        key: "status",
        label: "Status",
        type: "badge",
        badgeMap: {
          Active: {
            label: "Active",
            bgColor: "#E8F5E9",
            textColor: "#43A047",
            dotColor: "#43A047",
          },
          Inactive: {
            label: "Inactive",
            bgColor: "#FFF3E0",
            textColor: "#FB8C00",
            dotColor: "#FB8C00",
          },
          Locked: {
            label: "Locked",
            bgColor: "#FFEBEE",
            textColor: "#E53935",
            dotColor: "#E53935",
          },
        },
      },
      { key: "type", label: "Type" },
      { key: "validFrom", label: "Valid From" },
      { key: "validTo", label: "Valid To" },
      { key: "roleCount", label: "Role Count" },
    ],
  },
};

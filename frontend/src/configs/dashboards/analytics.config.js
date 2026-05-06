export const analyticsConfig = {
  sectionLabel: "Analytics",

  kpis: [
    {
      label: "Role Assignment",
      valuePath: "kpis.roleAssignment.title",
      subPath: "kpis.roleAssignment.subtitle",
      // iconName: "storage",
      accent: "c1",
      // sparkPct: 100,
      // badge: {
      //   label: "Roles",
      //   bgColor: "#E8F1FF",
      //   textColor: "#1D4ED8",
      // },
    },
    {
      label: "Unique Roles",
      valuePath: "kpis.uniqueRoles.title",
      subPath: "kpis.uniqueRoles.subtitle",
      // footerPath: "kpis.uniqueRoles.footer",
      // iconName: "document",
      accent: "c2",
      // sparkPct: 80,
      // badge: {
      //   label: "Unique",
      //   bgColor: "#E0F7FA",
      //   textColor: "#00ACC1",
      // },
    },
    {
      label: "T-Code Records",
      valuePath: "kpis.tcodeRecords.title",
      subPath: "kpis.tcodeRecords.subtitle",
      // footerPath: "kpis.tcodeRecords.footer",
      // iconName: "graph",
      accent: "c3",
      // sparkPct: 60,
      // badge: {
      //   label: "T-Codes",
      //   bgColor: "#E8F5E9",
      //   textColor: "#43A047",
      // },
    },
    {
      label: "Max Roles",
      valuePath: "kpis.maxRoles.title",
      subPath: "kpis.maxRoles.subtitle",
      // footerPath: "kpis.maxRoles.footer",
      // iconName: "personFolder",
      accent: "c4",
      // sparkPct: 40,
      // badge: {
      //   label: "Max",
      //   bgColor: "#FFF3E0",
      //   textColor: "#FB8C00",
      // },
    },
  ],

  charts: [
    {
      section: "twoCol",
      type: "verticalBar",
      title: "Top Role Assignments by Role ID",
      subtitle: "USERS PER ROLE",
      dataPath: "topRoleAssignments",
      slantLabels: true,
      axis: {
        yLeftLabel: "Users",
      },
    },
    {
      section: "twoCol",
      type: "verticalBar",
      title: "T-Codes per Role — Permission Scope",
      subtitle: "TCODES PER ROLE",
      dataPath: "tcodesPerRole",
      axis: {
        yLeftLabel: "T-Codes",
      },
    },
    {
      section: "twoCol",
      type: "verticalBar",
      title: "Top 10 Users by Role Count",
      subtitle: "ROLES PER USER",
      dataPath: "usersByRoleCount",
      axis: {
        yLeftLabel: "Roles",
      },
    },
    {
      section: "twoCol",
      type: "donut",
      title: "Role Category Distribution",
      subtitle: "ROLE CATEGORY SPLIT",
      dataPath: "roleCategoryDistribution",
      colors: ["#0B2E6B", "#1976D2", "#2EA3F2"],
    },
  ],

  progressCards: [
    {
      section: "twoCol",
      title: "Top FI Roles by User Count",
      subtitle: "DISPLAY / MAKER / MASTER",
      dataPath: "topFiRoles",
    },
    {
      section: "twoCol",
      title: "Top TRM Roles by User Count",
      subtitle: "TRM ROLES",
      dataPath: "topTrmRoles",
      insight:
        "Access Architecture: Display roles enable broad read-only access across FI modules. Maker & Master roles are restricted, enforcing proper Segregation of Duties (SoD).",
    },
  ],
};
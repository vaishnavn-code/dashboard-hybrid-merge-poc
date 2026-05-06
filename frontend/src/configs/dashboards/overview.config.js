export const overviewConfig = {
  sectionLabel: "Overview",

  kpis: [
    {
      label: "Total Users",
      valuePath: "kpis.totalUsers.title",
      subPath: "kpis.totalUsers.subtitle",
      footerPath: "kpis.totalUsers.footer",
      iconName: "personFolder",
      accent: "c1",
      sparkPct: 100,
      badge: {
        label: "Users",
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      },
    },
    {
      label: "Role Assignment",
      valuePath: "kpis.roleAssignment.title",
      subPath: "kpis.roleAssignment.subtitle",
      footerPath: "kpis.roleAssignment.footer",
      iconName: "storage",
      accent: "c2",
      sparkPct: 80,
      badge: {
        label: "Roles",
        bgColor: "#E0F7FA",
        textColor: "#00ACC1",
      },
    },
    {
      label: "Unique T-Codes",
      valuePath: "kpis.uniqueTcodes.title",
      subPath: "kpis.uniqueTcodes.subtitle",
      footerPath: "kpis.uniqueTcodes.footer",
      iconName: "document",
      accent: "c3",
      sparkPct: 60,
      badge: {
        label: "T-Codes",
        bgColor: "#E8F5E9",
        textColor: "#43A047",
      },
    },
    {
      label: "Audit Events",
      valuePath: "kpis.auditEvents.title",
      subPath: "kpis.auditEvents.subtitle",
      footerPath: "kpis.auditEvents.footer",
      iconName: "graph",
      accent: "c4",
      sparkPct: 40,
      badge: {
        label: "Audit",
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      },
    },
  ],

  charts: [
    {
      section: "full",
      type: "verticalBarWithLine",
      title: "Daily Audit Activity",
      subtitle: "DAILY GROUPING · 11 DAY RANGE · 12 BUCKETS",
      dataPath: "dailyAuditActivity",

      controls: {
        badge: "Daily",
        toggleKey: "viewMode",
        options: ["AUTO", "DAILY", "WEEKLY", "MONTHLY"],
        defaultValue: "AUTO",
        helperText: "Bars = Users & T-Codes | Line = Events",
      },

      axis: {
        xLabel: "Date",
        yLeftLabel: "Audit / T-Codes",
        yRightLabel: "Users Count",
      },
    },
    {
      section: "twoCol",
      subtitle: "EVENTS PER USER (VERTICAL BAR)",
      type: "verticalBar",
      title: "Top Users by Audit Activity",
      dataPath: "topUsers",
    },

    {
      section: "twoCol",
      type: "donut",
      title: "Activity by Business Group",
      subtitle: "EVENTS BY DEPARTMENT",
      dataPath: "activityByBusinessGroup",
    },
    {
      section: "twoCol",
      type: "donut",
      subtitle: "ACTIVE VS INACTIVE",
      title: "User Status",
      dataPath: "userStatus",
    },
    {
      section: "twoCol",
      type: "verticalBar",
      title: "Most Executed T-Codes",
      subtitle: "FREQUENCY IN AUDIT LOG",
      dataPath: "topTcodes",
    },
  ],
};

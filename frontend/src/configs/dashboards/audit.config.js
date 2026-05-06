export const auditConfig = {
  sectionLabel: "Audit Log",

  kpis: [
    {
      label: "Date Range",
      valuePath: "kpis.dateRange.title",
      subPath: "kpis.dateRange.subtitle",
      footerPath: "kpis.dateRange.footer",
      iconName: "document",
      accent: "c1",
      sparkPct: 100,
    },
    {
      label: "Total Events",
      valuePath: "kpis.totalEvents.title",
      subPath: "kpis.totalEvents.subtitle",
      footerPath: "kpis.totalEvents.footer",
      iconName: "graph",
      accent: "c2",
      sparkPct: 80,
    },
    {
      label: "Most Active User",
      valuePath: "kpis.mostActiveUser.title",
      subPath: "kpis.mostActiveUser.subtitle",
      footerPath: "kpis.mostActiveUser.footer",
      iconName: "personFolder",
      accent: "c3",
      sparkPct: 60,
    },
    {
      label: "Most Used T-Code",
      valuePath: "kpis.mostUsedTcode.title",
      subPath: "kpis.mostUsedTcode.subtitle",
      footerPath: "kpis.mostUsedTcode.footer",
      iconName: "storage",
      accent: "c4",
      sparkPct: 40,
    },
  ],

  charts: [
    {
      section: "full",
      type: "verticalBar",
      title: "Daily Audit Activity Trend",
      subtitle: "DAILY EVENTS TREND",
      dataPath: "dailyAuditTrend",
      axis: {
        xAxisLabel: "Date",
        yAxisLabel: "Audit Events",
      },
      controls: {
        badge: "Daily",
        options: ["AUTO", "DAILY", "WEEKLY", "MONTHLY", "BAR", "LINE"],
        defaultValue: "BAR",
        helperText: "Bar / Line view of audit activity",
      },
    },
    {
      section: "full",
      type: "verticalBar",
      title: "User Activity Ranking",
      subtitle: "AUDIT EVENTS PER USER",
      dataPath: "userActivityRanking",
      axis: {
        xAxisLabel: "User",
        yAxisLabel: "Events",
      },
      controls: {
        badge: "Show:",
        options: [
          "TOP 5",
          "TOP 10",
          "TOP 20",
          "TOP 30",
          "MAX",
          "POWER ≥20",
          "ACTIVE 5–19",
          "LIGHT 1–4",
        ],
        defaultValue: "TOP 10",
        helperText: "Filter users by activity level",
      },
    },
    {
      section: "twoCol",
      type: "verticalBar",
      title: "Top User Activity",
      subtitle: "TOP USERS",
      dataPath: "topUserActivity",
      axis: {
        xAxisLabel: "User",
        yAxisLabel: "Events",
      },
    },
  ],

  progressCards: [
    {
      title: "Audit Event Classification",
      subtitle: "EVENT TYPE SPLIT",
      dataPath: "auditEventClassification",
    },
  ],

  table: {
    title: "Audit Event Log",
    dataPath: "tableData",
    columns: [
      { key: "date", label: "Date" },
      { key: "time", label: "Time" },
      {
        key: "uid",
        label: "User ID",
        type: "badge",
        defaultBadge: {
          bgColor: "#E8F1FF",
          textColor: "#1565C0",
          dotColor: "#1565C0",
        },
      },
      { key: "group", label: "Group" },
      { key: "tcode", label: "T-Code" },
      {
        key: "program",
        label: "Program",
        type: "badge",
        defaultBadge: {
          bgColor: "#F3E5F5",
          textColor: "#6A1B9A",
          dotColor: "#6A1B9A",
        },
      },
      { key: "auditClass", label: "Audit Class" },
      { key: "email", label: "Email" },
    ],
  },
};

export const rolesConfig = {
  sectionLabel: "Roles",

  charts: [
    {
      section: "twoCol",
      type: "verticalBar",
      title: "Top 12 Roles by Assignment Count",
      subtitle: "USERS PER ROLE",
      slantLabels: true,
      dataPath: "rolesByAssignment",
      axis: {
        yAxisLabel: "Users",
      },
    },
    {
      section: "twoCol",
      type: "donut",
      title: "Role Module Distribution",
      subtitle: "ROLE MODULE SPLIT",
      dataPath: "roleDistribution",
    },
  ],

  table: {
  title: "User ↔ Role Assignment Matrix — L2",
  dataPath: "tableData",
  columns: [
    { key: "uid", label: "User ID" },

    {
      key: "name",
      label: "Name",
      type: "badge",
      defaultBadge: {
        bgColor: "#E8F1FF",
        textColor: "#1565C0",
        dotColor: "#1565C0",
      },
    },

    { key: "roleId", label: "Role ID" },

    {
      key: "roleDesc",
      label: "Role Description",
      type: "badge",
      badgeRules: [
        {
          includes: "Display",
          bgColor: "#E8F1FF",
          textColor: "#1565C0",
          dotColor: "#1565C0",
        },
        {
          includes: "Maker",
          bgColor: "#E8F5E9",
          textColor: "#43A047",
          dotColor: "#43A047",
        },
        {
          includes: "Master",
          bgColor: "#F3E8FF",
          textColor: "#7B1FA2",
          dotColor: "#7B1FA2",
        },
        {
          includes: "Checker",
          bgColor: "#FFF3E0",
          textColor: "#FB8C00",
          dotColor: "#FB8C00",
        },
        {
          includes: "Payment",
          bgColor: "#E0F7FA",
          textColor: "#00ACC1",
          dotColor: "#00ACC1",
        },
        {
          includes: "TRM",
          bgColor: "#FFF3E0",
          textColor: "#FB8C00",
          dotColor: "#FB8C00",
        },
      ],
      defaultBadge: {
        bgColor: "#F3F4F6",
        textColor: "#374151",
        dotColor: "#6B7280",
      },
    },

    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" },
  ],
}
};

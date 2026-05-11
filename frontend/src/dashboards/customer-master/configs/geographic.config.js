export const geographicConfig = {
  sectionLabel: "Geographic",

  kpis: [
    {
      label: "States Covered",
      valuePath: "kpis.statesCovered.title",
      subPath: "kpis.statesCovered.subtitle",
      footerPath: "kpis.statesCovered.footer",
      iconName: "graph",
      accent: "c1",
      sparkPct: 39,
      badge: {
        label: "States",
        bgColor: "#E8F1FF",
        textColor: "#1D4ED8",
      },
    },
    {
      label: "Top Region",
      valuePath: "kpis.topRegion.title",
      subPath: "kpis.topRegion.subtitle",
      footerPath: "kpis.topRegion.footer",
      iconName: "storage",
      accent: "c2",
      sparkPct: 48,
      badge: {
        label: "Region",
        bgColor: "#E0F7FA",
        textColor: "#00ACC1",
      },
    },
    {
      label: "Total Cities",
      valuePath: "kpis.totalCities.title",
      subPath: "kpis.totalCities.subtitle",
      footerPath: "kpis.totalCities.footer",
      iconName: "personFolder",
      accent: "c3",
      sparkPct: 70,
      badge: {
        label: "Cities",
        bgColor: "#E8F5E9",
        textColor: "#43A047",
      },
    },
    {
      label: "Avg per State",
      valuePath: "kpis.avgPerState.title",
      subPath: "kpis.avgPerState.subtitle",
      footerPath: "kpis.avgPerState.footer",
      iconName: "document",
      accent: "c4",
      sparkPct: 42,
      badge: {
        label: "Average",
        bgColor: "#FFF3E0",
        textColor: "#FB8C00",
      },
    },
  ],

  charts: [
    {
      section: "full",
      type: "verticalBar",
      title: "Customer Count by State",
      subtitle: "STATE-WISE CUSTOMER DISTRIBUTION",
      dataPath: "customerCountByState",
    },
    {
      section: "twoCol",
      type: "donut",
      title: "Regional Share",
      subtitle: "CUSTOMER SHARE BY REGION",
      dataPath: "regionalShare",
    },
    {
      section: "twoCol",
      type: "verticalBar",
      title: "Top Cities by Count",
      subtitle: "CITY-WISE CUSTOMER DISTRIBUTION",
      dataPath: "topCitiesByCount",
      slantLabels: true,
    },
  ],

  table: {
    title: "Geographic Summary",
    subtitle: "STATE AND CITY LEVEL CUSTOMER DISTRIBUTION",
    dataPath: "table",
    columns: [
      { key: "state_region", label: "State / Region" },
      { key: "city", label: "City" },
      { key: "customers", label: "Customers" },
      { key: "with_bank", label: "With Bank" },
      { key: "gstin_registered", label: "GSTIN Registered" },
      { key: "share_pct", label: "Share %" },
    ],
  },
};
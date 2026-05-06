import React from "react";
import { overviewConfig } from "../configs/dashboards/overview.config";
import { mapOverview } from "../mappers/overviewMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";

export default function Overview({ data }) {
  const mappedData = mapOverview(data);

  return (
    <div>
      <div className="section-label">{overviewConfig.sectionLabel}</div>

      {/* KPI */}
      <div className="four-col">
        {overviewConfig.kpis.map((item) => (
          <KpiCard
            key={item.label}
            label={item.label}
            value={getByPath(mappedData, item.valuePath)}
            sub={getByPath(mappedData, item.subPath)}
            footer={getByPath(mappedData, item.footerPath)}
            iconName={item.iconName}
            accent={item.accent}
            sparkPct={item.sparkPct}
            badge={item.badge}
          />
        ))}
      </div>

      {/* Charts */}
      {overviewConfig.charts
        .filter((chart) => chart.section === "full")
        .map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}

      {/* Two-column charts */}
      <div className="two-col" style={{marginTop : "20px"}}>
        {overviewConfig.charts
          .filter((chart) => chart.section === "twoCol")
          .map((chart) => (
            <DashboardChartRenderer
              key={chart.title}
              chart={chart}
              data={mappedData}
            />
          ))}
      </div>
    </div>
  );
}

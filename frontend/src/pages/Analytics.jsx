import React from "react";
import { analyticsConfig } from "../configs/dashboards/analytics.config";
import { mapAnalytics } from "../mappers/analyticsMapper";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import ProgressListCard from "../components/charts/ProgressListCard";
import DashboardKpiGrid from "../components/ui/DashboardKpiGrid";

export default function Analytics({ data }) {
  const mappedData = mapAnalytics(data);

  return (
    <div>
      <div className="section-label">{analyticsConfig.sectionLabel}</div>

      <DashboardKpiGrid
        config={analyticsConfig.kpis}
        data={mappedData}
      />

      <div className="two-col">
        {analyticsConfig.charts.map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}
      </div>

      <div className="two-col">
        {analyticsConfig.progressCards.map((card) => (
          <ProgressListCard
            key={card.title}
            card={card}
            data={mappedData}
          />
        ))}
      </div>
    </div>
  );
}
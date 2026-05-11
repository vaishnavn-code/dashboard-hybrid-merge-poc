import React from "react";
import { customerMasterConfig } from "../configs/customerMaster.config";
import { mapCustomerMasterOverview } from "../mappers/customerMasterMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../../../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";

export default function Overview({ data }) {
  const mappedData = mapCustomerMasterOverview(data);

  return (
    <div>
      <div className="section-label">{customerMasterConfig.sectionLabel}</div>

      <div className="four-col">
        {customerMasterConfig.kpis.map((item) => (
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

      <div className="two-col" style={{ marginTop: "20px" }}>
        {customerMasterConfig.charts
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
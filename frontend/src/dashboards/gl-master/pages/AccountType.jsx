import React, { useMemo } from "react";
import { glAccountTypeConfig } from "../configs/glAccountType.config";
import { mapGlAccountType } from "../mappers/glAccountTypeMapper";
import DashboardKpiGrid from "../../../components/ui/DashboardKpiGrid";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import ProgressListCard from "../../../components/charts/ProgressListCard";

export default function AccountType({ data }) {
  const mappedData = useMemo(() => mapGlAccountType(data), [data]);

  return (
    <div>
      <div className="section-label">{glAccountTypeConfig.sectionLabel}</div>

      <DashboardKpiGrid
        config={glAccountTypeConfig.kpis}
        data={mappedData}
      />

      <div className="two-col" style={{ marginTop: "20px" }}>
        {glAccountTypeConfig.charts.map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}
      </div>

      <div className="two-col" style={{ marginTop: "20px" }}>
        {glAccountTypeConfig.progressCards.map((card) => (
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
import React, { useMemo, useState } from "react";
import { auditConfig } from "../configs/dashboards/audit.config";
import { mapAudit } from "../mappers/auditMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import ProgressListCard from "../components/charts/ProgressListCard";
import DataTable from "../components/ui/DataTable";
import { getByPath } from "../utils/getByPath";

export default function Audit({ data }) {
  const mappedData = mapAudit(data);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const tableRows = getByPath(mappedData, auditConfig.table.dataPath, []);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return tableRows.slice(start, start + PAGE_SIZE);
  }, [tableRows, page]);

  const totalPages = Math.ceil(tableRows.length / PAGE_SIZE);

  return (
    <div>
      <div className="section-label">{auditConfig.sectionLabel}</div>

      <div className="four-col">
        {auditConfig.kpis.map((item) => (
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

      {auditConfig.charts
        .filter((chart) => chart.section === "full")
        .map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}

      {/* Two-column charts except Top User Activity */}
      <div className="two-col">
        {auditConfig.charts
          .filter(
            (chart) =>
              chart.section === "twoCol" && chart.title !== "Top User Activity",
          )
          .map((chart) => (
            <DashboardChartRenderer
              key={chart.title}
              chart={chart}
              data={mappedData}
            />
          ))}
      </div>

      {/* Top User Activity + Audit Event Classification side by side */}
      <div className="two-col">
        {auditConfig.charts
          .filter((chart) => chart.title === "Top User Activity")
          .map((chart) => (
            <DashboardChartRenderer
              key={chart.title}
              chart={chart}
              data={mappedData}
            />
          ))}

        {auditConfig.progressCards.map((card) => (
          <ProgressListCard key={card.title} card={card} data={mappedData} />
        ))}
      </div>

      <div className="chart-card" style={{ marginTop: 20 }}>
        <div className="card-title">{auditConfig.table.title}</div>

        <DataTable
          columns={auditConfig.table.columns}
          rows={paginatedRows}
          total={tableRows.length}
          page={page}
          totalPages={totalPages}
          onPage={(p) => setPage(Number(p))}
          sortBy={null}
          sortDir={null}
          onSort={() => {}}
          loading={false}
        />
      </div>
    </div>
  );
}

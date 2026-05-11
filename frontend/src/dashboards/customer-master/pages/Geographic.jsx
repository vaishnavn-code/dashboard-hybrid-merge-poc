import React from "react";
import { geographicConfig } from "../configs/geographic.config";
import { mapGeographicPage } from "../mappers/geographicMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";

export default function Geographic({ data }) {
  const mappedData = mapGeographicPage(data);

  const tableRows =
    getByPath(mappedData, geographicConfig.table.dataPath, []) || [];

  const columns = geographicConfig.table.columns;

  return (
    <div>
      <div className="section-label">{geographicConfig.sectionLabel}</div>

      <div className="four-col">
        {geographicConfig.kpis.map((item) => (
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

      {/* Full-width charts */}
      {geographicConfig.charts
        .filter((chart) => chart.section === "full")
        .map((chart) => (
          <div style={{ marginTop: "20px" }} key={chart.title}>
            <DashboardChartRenderer chart={chart} data={mappedData} />
          </div>
        ))}

      {/* Two-column charts */}
      <div className="two-col" style={{ marginTop: "20px" }}>
        {geographicConfig.charts
          .filter((chart) => chart.section === "twoCol")
          .map((chart) => (
            <DashboardChartRenderer
              key={chart.title}
              chart={chart}
              data={mappedData}
            />
          ))}
      </div>

      <div className="chart-card" style={{ marginTop: "20px" }}>
        <div className="chart-header">
          <div>
            <div className="chart-title">{geographicConfig.table.title}</div>
            <div className="chart-subtitle">
              {geographicConfig.table.subtitle}
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tableRows.map((row, index) => (
                <tr key={`${row.state_region || "row"}-${row.city || index}`}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {row[column.key] === "" || row[column.key] == null
                        ? "--"
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tableRows.length === 0 && (
          <div style={{ padding: "20px", color: "#6a7280" }}>
            No geographic records available.
          </div>
        )}
      </div>
    </div>
  );
}

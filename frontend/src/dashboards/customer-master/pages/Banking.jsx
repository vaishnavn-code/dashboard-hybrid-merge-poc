import React from "react";
import { bankingConfig } from "../configs/banking.config";
import { mapBankingPage } from "../mappers/bankingMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";

export default function Banking({ data }) {
  const mappedData = mapBankingPage(data);

  const tableRows = getByPath(mappedData, bankingConfig.table.dataPath, []) || [];
  const columns = bankingConfig.table.columns;

  return (
    <div>
      <div className="section-label">{bankingConfig.sectionLabel}</div>

      <div className="four-col">
        {bankingConfig.kpis.map((item) => (
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
        {bankingConfig.charts
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
            <div className="chart-title">{bankingConfig.table.title}</div>
            <div className="chart-subtitle">{bankingConfig.table.subtitle}</div>
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
                <tr key={`${row.bp_no || "row"}-${index}`}>
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
            No banking records available.
          </div>
        )}
      </div>
    </div>
  );
}
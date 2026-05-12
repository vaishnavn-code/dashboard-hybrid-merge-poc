import React, { useMemo } from "react";
import { glOverviewConfig } from "../configs/glOverview.config";
import { mapGlOverview } from "../mappers/glOverviewMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";

export default function Overview({ data }) {
  const mappedData = useMemo(() => mapGlOverview(data), [data]);

  const tableRows = getByPath(
    mappedData,
    glOverviewConfig.table.dataPath,
    [],
  );

  return (
    <div>
      <div className="section-label">{glOverviewConfig.sectionLabel}</div>

      <div className="four-col">
        {glOverviewConfig.kpis.map((item) => (
          <KpiCard
            key={item.label}
            label={item.label}
            value={getByPath(mappedData, item.valuePath)}
            sub={getByPath(mappedData, item.subPath)}
            footer={getByPath(mappedData, item.footerPath)}
            iconName={item.iconName}
            accent={item.accent}
            sparkPct={item.sparkPct}
            badge={getByPath(mappedData, item.badgePath, item.badge)}
          />
        ))}
      </div>

      <div className="two-col" style={{ marginTop: "20px" }}>
        {glOverviewConfig.charts.map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}
      </div>

      <div className="section-label" style={{ marginTop: "20px" }}>
        Range Summary
      </div>

      <div className="card">
        <div className="summary-table-header">
          <div>
            <div className="table-title">{glOverviewConfig.table.title}</div>
          </div>

          <span className="summary-count-badge">
            {tableRows.filter((row) => row.range !== "TOTAL").length} RANGES
          </span>
        </div>

        <div className="table-wrap">
          <table className="data-table summary-table">
            <thead>
              <tr>
                {glOverviewConfig.table.columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tableRows.map((row, index) => {
                const isTotal = row.range === "TOTAL";

                return (
                  <tr
                    key={`${row.range}-${index}`}
                    className={isTotal ? "summary-total-row" : ""}
                  >
                    {glOverviewConfig.table.columns.map((column) => (
                      <td key={column.key}>
                        {renderCell(row[column.key], column.key, row)}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {tableRows.length === 0 && (
                <tr>
                  <td
                    colSpan={glOverviewConfig.table.columns.length}
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      padding: 20,
                    }}
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function renderCell(value, key, row) {
  const isTotal = row?.range === "TOTAL";

  if (key === "range" && !isTotal) {
    return (
      <span className="gl-blue-badge">
        <span className="gl-blue-dot" />
        {value || "-"}
      </span>
    );
  }

  if (key === "range" && isTotal) {
    return <strong>TOTAL</strong>;
  }

  if (key === "category" && !isTotal) {
    return <span className="gl-dark-badge">{value || "-"}</span>;
  }

  if (key === "blocked" && !isTotal) {
    return (
      <span className="gl-red-badge">
        <span className="gl-red-dot" />
        {value || "0"}
      </span>
    );
  }

  if (isTotal) {
    return <strong>{value || "-"}</strong>;
  }

  return value || "-";
}
import React, { useMemo, useState } from "react";
import { glAccountRangeConfig } from "../configs/glAccountRange.config";
import {
  getDefaultGlRange,
  getGlRangeOptions,
  mapGlAccountRange,
} from "../mappers/glAccountRangeMapper";
import DashboardKpiGrid from "../../../components/ui/DashboardKpiGrid";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";

export default function AccountRange({ data }) {
  const rangeOptions = useMemo(() => getGlRangeOptions(data), [data]);

  const [selectedRange, setSelectedRange] = useState(() =>
    getDefaultGlRange(data),
  );

  const mappedData = useMemo(
    () => mapGlAccountRange(data, selectedRange),
    [data, selectedRange],
  );

  const tableRows = mappedData.table || [];

  const handleRangeChange = (event) => {
    setSelectedRange(event.target.value);
  };

  return (
    <div>
      <div className="range-page-header-left">
        <div className="section-label">{glAccountRangeConfig.sectionLabel}</div>

        <div className="range-selector">
          <label>Select Range:</label>

          <select value={selectedRange} onChange={handleRangeChange}>
            {rangeOptions.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DashboardKpiGrid config={glAccountRangeConfig.kpis} data={mappedData} />

      <div className="two-col" style={{ marginTop: "20px" }}>
        {glAccountRangeConfig.charts.map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}
      </div>

      <div className="section-label" style={{ marginTop: "20px" }}>
        {glAccountRangeConfig.table.title}
      </div>

      <div className="card">
        <div className="summary-table-header">
          <div>
            <div className="table-title">
              {glAccountRangeConfig.table.title}
            </div>
          </div>

          <span className="summary-count-badge">
            {tableRows.length.toLocaleString("en-IN")} ACCOUNTS
          </span>
        </div>

        <div className="table-wrap">
          <table className="data-table summary-table">
            <thead>
              <tr>
                {glAccountRangeConfig.table.columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tableRows.map((row, index) => (
                <tr key={`${row.gl_account}-${index}`}>
                  {glAccountRangeConfig.table.columns.map((column) => (
                    <td key={column.key}>
                      {renderCell(row[column.key], column.key)}
                    </td>
                  ))}
                </tr>
              ))}

              {tableRows.length === 0 && (
                <tr>
                  <td
                    colSpan={glAccountRangeConfig.table.columns.length}
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      padding: 20,
                    }}
                  >
                    No accounts found for selected range.
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

function renderCell(value, key) {
  if (key === "type") {
    return (
      <span className={value === "B/S" ? "pill pill-blue" : "pill pill-soft"}>
        <span className="status-dot" />
        {value || "-"}
      </span>
    );
  }

  if (["blk_post", "blk_cocode", "mrk_del"].includes(key)) {
    const isYes = String(value || "").toLowerCase() === "yes";

    return (
      <span className={isYes ? "status-badge risk" : "status-badge ok"}>
        <span className="status-dot" />
        {value || "No"}
      </span>
    );
  }

  if (key === "gl_account") {
    return <strong>{value || "-"}</strong>;
  }

  return value || "-";
}

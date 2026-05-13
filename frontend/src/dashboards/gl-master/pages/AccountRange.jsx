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
  const PAGE_SIZE = 15;

  const [selectedRange, setSelectedRange] = useState(() =>
    getDefaultGlRange(data),
  );
  const [currentPage, setCurrentPage] = useState(1);

  const mappedData = useMemo(
    () => mapGlAccountRange(data, selectedRange),
    [data, selectedRange],
  );

  const tableRows = mappedData.table || [];
  const totalPages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;

    return tableRows.slice(start, start + PAGE_SIZE);
  }, [tableRows, currentPage, totalPages]);

  const handleRangeChange = (event) => {
    setSelectedRange(event.target.value);
    setCurrentPage(1);
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
              {paginatedRows.map((row, index) => (
                <tr key={`${row.gl_account}-${index}`}>
                  {glAccountRangeConfig.table.columns.map((column) => (
                    <td key={column.key}>
                      {renderCell(row[column.key], column.key)}
                    </td>
                  ))}
                </tr>
              ))}

              {paginatedRows.length === 0 && (
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
        {tableRows.length > 0 && (
          <div className="table-pagination">
            <div className="table-pagination-info">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, tableRows.length)} of{" "}
              {tableRows.length} records
            </div>

            <div className="table-pagination-actions">
              <button
                type="button"
                className="table-pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Prev
              </button>

              <span className="table-pagination-page">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="table-pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        )}
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

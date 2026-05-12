import React, { useMemo, useState } from "react";
import { geographicConfig } from "../configs/geographic.config";
import { mapGeographicPage } from "../mappers/geographicMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";

export default function Geographic({ data }) {
  const mappedData = mapGeographicPage(data);

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const tableRows =
    getByPath(mappedData, geographicConfig.table.dataPath, []) || [];

  const columns = geographicConfig.table.columns;

  const filteredRows = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) return tableRows;

    return tableRows.filter((row) => {
      return (
        String(row.state_region || "")
          .toLowerCase()
          .includes(search) ||
        String(row.city || "")
          .toLowerCase()
          .includes(search) ||
        String(row.customers || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [tableRows, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, safeCurrentPage]);

  const clearSearch = () => {
    setSearchText("");
    setCurrentPage(1);
  };

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
        <div className="geo-table-filter-row">
          <input
            className="geo-table-search"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by city or state..."
          />

          <button
            type="button"
            className="geo-table-clear-btn"
            onClick={clearSearch}
          >
            Clear
          </button>
        </div>

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
              {paginatedRows.map((row, index) => (
                <tr key={`${row.state_region || "row"}-${row.city || index}`}>
                  {columns.map((column) => {
                    const cellValue =
                      row[column.key] === "" || row[column.key] == null
                        ? "--"
                        : row[column.key];

                    if (column.key === "state_region") {
                      return (
                        <td key={column.key}>
                          <span className="geo-state-value">{cellValue}</span>
                        </td>
                      );
                    }

                    if (column.key === "customers") {
                      return (
                        <td key={column.key}>
                          <span className="geo-badge geo-badge-blue">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "with_bank") {
                      return (
                        <td key={column.key}>
                          <span className="geo-badge geo-badge-green">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "gstin_registered") {
                      return (
                        <td key={column.key}>
                          <span className="geo-badge geo-badge-yellow">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    return <td key={column.key}>{cellValue}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRows.length > 0 && (
          <div className="table-pagination">
            <div className="table-pagination-info">
              Showing {(safeCurrentPage - 1) * pageSize + 1}-
              {Math.min(safeCurrentPage * pageSize, filteredRows.length)} of{" "}
              {filteredRows.length} records
            </div>

            <div className="table-pagination-actions">
              <button
                type="button"
                className="table-pagination-btn"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Prev
              </button>

              <span className="table-pagination-page">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="table-pagination-btn"
                disabled={safeCurrentPage === totalPages}
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

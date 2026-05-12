import React, { useMemo, useState } from "react";
import { glAccountsConfig } from "../configs/glAccounts.config";
import {
  getGlAccountRange,
  getGlAccountStatus,
  mapGlAccounts,
} from "../mappers/glAccountsMapper";
import { getByPath } from "../utils/getByPath";

const PAGE_SIZE = 15;

export default function GlAccounts({ data }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [rangeFilter, setRangeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const mappedData = useMemo(() => mapGlAccounts(data), [data]);

  const tableRows = getByPath(
    mappedData,
    glAccountsConfig.table.dataPath,
    [],
  );

  const columns = glAccountsConfig.table.columns;

  // Comes from API/table response: row.bs
  const typeOptions = useMemo(() => {
    return [...new Set(tableRows.map((row) => row.bs).filter(Boolean))].sort();
  }, [tableRows]);

  // Comes from API/table response: row.gl_account first digit
  const rangeOptions = useMemo(() => {
    const ranges = new Set();

    tableRows.forEach((row) => {
      ranges.add(getGlAccountRange(row.gl_account));
    });

    return [...ranges]
      .filter((item) => item !== "Unknown")
      .sort((a, b) => a.localeCompare(b));
  }, [tableRows]);

  // Comes from API/table response/status fields
  const statusOptions = useMemo(() => {
    return [...new Set(tableRows.map((row) => getGlAccountStatus(row)))].sort();
  }, [tableRows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tableRows.filter((row) => {
      const rowType = String(row?.bs || "");
      const rowRange = getGlAccountRange(row?.gl_account);
      const rowStatus = getGlAccountStatus(row);

      const matchesSearch =
        !query ||
        Object.values(row || {}).some((value) =>
          String(value ?? "").toLowerCase().includes(query),
        );

      const matchesType = typeFilter === "ALL" || rowType === typeFilter;

      const matchesRange = rangeFilter === "ALL" || rowRange === rangeFilter;

      const matchesStatus =
        statusFilter === "ALL" || rowStatus === statusFilter;

      return matchesSearch && matchesType && matchesRange && matchesStatus;
    });
  }, [tableRows, search, typeFilter, rangeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;

    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage, totalPages]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setRangeFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="section-label">{glAccountsConfig.sectionLabel}</div>

      <div className="chart-card" style={{ marginTop: "20px" }}>
        <div className="gl-accounts-header">
          <div>
            <div className="chart-title">{glAccountsConfig.table.title}</div>
          </div>

          <span className="summary-count-badge">
            {tableRows.length.toLocaleString("en-IN")} RECORDS
          </span>
        </div>

        <div className="customer-table-filter-row">
          <input
            className="customer-table-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search G/L acct or description..."
          />

          <select
            className="customer-table-select"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            className="customer-table-select"
            value={rangeFilter}
            onChange={(event) => {
              setRangeFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Ranges</option>
            {rangeOptions.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>

          <select
            className="customer-table-select"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="customer-table-clear-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
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
                <tr key={`${row.gl_account || "row"}-${index}`}>
                  {columns.map((column) => {
                    const cellValue =
                      row[column.key] === "" || row[column.key] == null
                        ? "--"
                        : row[column.key];

                    if (column.key === "gl_account") {
                      return (
                        <td key={column.key}>
                          <span className="cm-bp-value">{cellValue}</span>
                        </td>
                      );
                    }

                    if (column.key === "bs") {
                      const isPL =
                        String(cellValue).toLowerCase() === "p&l";

                      return (
                        <td key={column.key}>
                          <span
                            className={`cm-table-badge ${
                              isPL ? "cm-badge-blue" : "cm-badge-grey"
                            }`}
                          >
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (
                      column.key === "blk_post" ||
                      column.key === "blk_cocode" ||
                      column.key === "mrk_del"
                    ) {
                      const isYes =
                        String(cellValue).toLowerCase() === "yes";

                      return (
                        <td key={column.key}>
                          <span
                            className={`cm-table-badge ${
                              isYes ? "cm-badge-red" : "cm-badge-green"
                            }`}
                          >
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "co_code" || column.key === "coa") {
                      return (
                        <td key={column.key}>
                          <span className="cm-table-badge cm-badge-grey">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    return <td key={column.key}>{cellValue}</td>;
                  })}
                </tr>
              ))}

              {paginatedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
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

        {filteredRows.length > 0 && (
          <div className="table-pagination">
            <div className="table-pagination-info">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of{" "}
              {filteredRows.length} records
            </div>

            <div className="table-pagination-actions">
              <button
                type="button"
                className="table-pagination-btn"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
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
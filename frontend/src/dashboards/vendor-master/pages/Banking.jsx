import React, { useMemo, useState } from "react";
import { bankingConfig } from "../configs/banking.config";
import { mapBanking } from "../mappers/bankingMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";

const PAGE_SIZE = 10;

export default function Banking({ data }) {
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const mappedData = useMemo(() => mapBanking(data), [data]);

  const tableRows =
    getByPath(mappedData, bankingConfig.table.dataPath, []) || [];

  const columns = bankingConfig.table.columns;

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(
        tableRows
          .map((row) => row.status)
          .filter((value) => value && value !== "--"),
      ),
    ).sort();
  }, [tableRows]);

  const countryOptions = useMemo(() => {
    return Array.from(
      new Set(
        tableRows
          .map((row) => row.bank_country)
          .filter((value) => value && value !== "--"),
      ),
    ).sort();
  }, [tableRows]);

  const filteredRows = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return tableRows.filter((row) => {
      const matchesSearch =
        !search ||
        String(row.bp_no || "").toLowerCase().includes(search) ||
        String(row.vendor_name || "").toLowerCase().includes(search) ||
        String(row.bank_key || "").toLowerCase().includes(search) ||
        String(row.bank_account || "").toLowerCase().includes(search) ||
        String(row.account_holder || "").toLowerCase().includes(search) ||
        String(row.bank_name || "").toLowerCase().includes(search);

      const matchesStatus =
        selectedStatus === "ALL" || row.status === selectedStatus;

      const matchesCountry =
        selectedCountry === "ALL" || row.bank_country === selectedCountry;

      return matchesSearch && matchesStatus && matchesCountry;
    });
  }, [tableRows, searchText, selectedStatus, selectedCountry]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;

    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, currentPage, totalPages]);

  const clearFilters = () => {
    setSearchText("");
    setSelectedStatus("ALL");
    setSelectedCountry("ALL");
    setCurrentPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setCurrentPage(1);
  };

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
    setCurrentPage(1);
  };

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
            badge={getByPath(mappedData, item.badgePath, item.badge)}
          />
        ))}
      </div>

      <div className="two-col" style={{ marginTop: "20px" }}>
        {bankingConfig.charts.map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}
      </div>

      <div className="chart-card" style={{ marginTop: "20px" }}>
        <div className="customer-table-filter-row">
          <input
            className="customer-table-search"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search BP, vendor, bank key, account..."
          />

          <select
            className="customer-table-select"
            value={selectedCountry}
            onChange={handleCountryChange}
          >
            <option value="ALL">All Countries</option>
            {countryOptions.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          <select
            className="customer-table-select"
            value={selectedStatus}
            onChange={handleStatusChange}
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

        <div className="chart-header">
          <div>
            <div className="chart-title">{bankingConfig.table.title}</div>
            <div className="chart-subtitle">
              {bankingConfig.table.subtitle}
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
                <tr key={`${row.bp_no || "row"}-${index}`}>
                  {columns.map((column) => {
                    const cellValue =
                      row[column.key] === "" || row[column.key] == null
                        ? "--"
                        : row[column.key];

                    if (column.key === "bp_no") {
                      return (
                        <td key={column.key}>
                          <span className="cm-bp-value">{cellValue}</span>
                        </td>
                      );
                    }

                    if (column.key === "vendor_name") {
                      return (
                        <td key={column.key}>
                          <span className="cm-table-badge cm-badge-grey">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "bank_key") {
                      return (
                        <td key={column.key}>
                          <span className="cm-table-badge cm-badge-blue">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "status") {
                      const isActive =
                        String(cellValue).toLowerCase() === "active";

                      return (
                        <td key={column.key}>
                          <span
                            className={`cm-table-badge ${
                              isActive ? "cm-badge-green" : "cm-badge-grey"
                            }`}
                          >
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

        {filteredRows.length === 0 && (
          <div style={{ padding: "20px", color: "#6a7280" }}>
            No matching banking records available.
          </div>
        )}
      </div>
    </div>
  );
}
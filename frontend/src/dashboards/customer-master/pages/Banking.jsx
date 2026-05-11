import React, { useMemo, useState } from "react";
import { bankingConfig } from "../configs/banking.config";
import { mapBankingPage } from "../mappers/bankingMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";

export default function Banking({ data }) {
  const mappedData = mapBankingPage(data);
  const [searchText, setSearchText] = useState("");
  const tableRows =
    getByPath(mappedData, bankingConfig.table.dataPath, []) || [];
  const columns = bankingConfig.table.columns;

  const filteredRows = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) return tableRows;

    return tableRows.filter((row) => {
      return (
        String(row.bp_no || "")
          .toLowerCase()
          .includes(search) ||
        String(row.customer_name || "")
          .toLowerCase()
          .includes(search) ||
        String(row.bank_key_ifsc || "")
          .toLowerCase()
          .includes(search) ||
        String(row.bank_account || "")
          .toLowerCase()
          .includes(search) ||
        String(row.account_holder || "")
          .toLowerCase()
          .includes(search) ||
        String(row.bank_name || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [tableRows, searchText]);

  const clearSearch = () => {
    setSearchText("");
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
        <div className="banking-table-filter-row">
          <input
            className="banking-table-search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search customer or bank..."
          />

          <button
            type="button"
            className="banking-table-clear-btn"
            onClick={clearSearch}
          >
            Clear
          </button>
        </div>
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
              {filteredRows.map((row, index) => (
                <tr key={`${row.bp_no || "row"}-${index}`}>
                  {columns.map((column) => {
                    const cellValue =
                      row[column.key] === "" || row[column.key] == null
                        ? "--"
                        : row[column.key];

                    if (column.key === "bp_no") {
                      return (
                        <td key={column.key}>
                          <span className="banking-bp-value">{cellValue}</span>
                        </td>
                      );
                    }

                    if (column.key === "bank_country") {
                      return (
                        <td key={column.key}>
                          <span className="banking-table-badge banking-badge-grey">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "status") {
                      return (
                        <td key={column.key}>
                          <span className="banking-table-badge banking-badge-green">
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

        {filteredRows.length === 0 && (
          <div style={{ padding: "20px", color: "#6a7280" }}>
            No matching banking records available.
          </div>
        )}
      </div>
    </div>
  );
}

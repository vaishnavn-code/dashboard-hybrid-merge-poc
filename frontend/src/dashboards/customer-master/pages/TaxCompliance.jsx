import React, { useMemo, useState } from "react";
import { taxComplianceConfig } from "../configs/taxCompliance.config";
import { mapTaxCompliancePage } from "../mappers/taxComplianceMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";

function DuplicateAlertBox({ type, title, kpi }) {
  const isGstin = type === "gstin";

  return (
    <div
      className={`tax-alert-box ${
        isGstin ? "tax-alert-danger" : "tax-alert-warn"
      }`}
    >
      <div className="tax-alert-icon">{isGstin ? "!" : "⚠"}</div>

      <div className="tax-alert-content">
        <div className="tax-alert-title">{title}</div>

        <div className="tax-alert-text">
          <strong>{kpi?.title}</strong> {kpi?.subtitle}
        </div>

        <div className="tax-alert-footer">{kpi?.footer}</div>
      </div>

      <div className="tax-alert-count">{kpi?.title}</div>
    </div>
  );
}

function DuplicateGroupCard({ section, groups }) {
  const totalCustomers = groups.reduce(
    (sum, group) => sum + Number(group.count || 0),
    0,
  );

  const badgeClass =
    section.badgeVariant === "risk"
      ? "dup-badge dup-badge-risk"
      : "dup-badge dup-badge-warn";

  return (
    <div className="dup-table-card">
      <div className="dup-card-title">
        {section.title}
        <span className={badgeClass}>
          {groups.length} groups | {totalCustomers} customers
        </span>
      </div>

      <div className="dup-card-body">
        {groups.length === 0 && (
          <div className="dup-empty">No duplicate groups found.</div>
        )}

        {groups.map((group) => (
          <div className="dup-group" key={group.groupKey}>
            <div className="dup-group-header">
              <span className="dup-group-key">{group.groupKey}</span>
              <span className="dup-group-cnt">{group.count} customers</span>
            </div>

            <table className="dup-mini-table">
              <thead>
                <tr>
                  {section.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {(group.rows || []).map((row, index) => (
                  <tr key={`${group.groupKey}-${index}`}>
                    {section.columns.map((column) => (
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
        ))}
      </div>
    </div>
  );
}

export default function TaxCompliance({ data }) {
  const mappedData = mapTaxCompliancePage(data);

  const [searchText, setSearchText] = useState("");
  const [selectedWht, setSelectedWht] = useState("ALL");

  const tableRows =
    getByPath(mappedData, taxComplianceConfig.table.dataPath, []) || [];

  const columns = taxComplianceConfig.table.columns;

  const whtOptions = useMemo(() => {
    return Array.from(
      new Set(
        tableRows
          .map((row) => row.wht_description || row.wht_code)
          .filter((value) => value && value !== "--"),
      ),
    ).sort();
  }, [tableRows]);

  const filteredRows = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return tableRows.filter((row) => {
      const matchesSearch =
        !search ||
        String(row.bp_no || "")
          .toLowerCase()
          .includes(search) ||
        String(row.customer_name || "")
          .toLowerCase()
          .includes(search) ||
        String(row.pan_no || "")
          .toLowerCase()
          .includes(search) ||
        String(row.gstin || "")
          .toLowerCase()
          .includes(search);

      const whtValue = row.wht_description || row.wht_code || "";
      const matchesWht = selectedWht === "ALL" || whtValue === selectedWht;

      return matchesSearch && matchesWht;
    });
  }, [tableRows, searchText, selectedWht]);

  const clearFilters = () => {
    setSearchText("");
    setSelectedWht("ALL");
  };

  return (
    <div>
      <div className="section-label">{taxComplianceConfig.sectionLabel}</div>

      <div className="four-col">
        {taxComplianceConfig.kpis.map((item) => (
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
        {taxComplianceConfig.charts
          .filter((chart) => chart.section === "twoCol")
          .map((chart) => (
            <DashboardChartRenderer
              key={chart.title}
              chart={chart}
              data={mappedData}
            />
          ))}
      </div>

      <div className="section-label" style={{ marginTop: "20px" }}>
        Shared PAN & GSTIN Analysis
      </div>

      <div
        className="two-col"
        style={{ marginBottom: "16px", alignItems: "start" }}
      >
        <DuplicateAlertBox
          type="pan"
          title="Duplicate PAN Numbers Detected"
          kpi={mappedData.kpis.duplicatePanNumbers}
        />

        <DuplicateAlertBox
          type="gstin"
          title="Duplicate GSTIN Numbers Detected"
          kpi={mappedData.kpis.duplicateGstinNumbers}
        />
      </div>

      <div
        className="two-col"
        style={{ marginBottom: "16px", alignItems: "start" }}
      >
        {(taxComplianceConfig.duplicateSections || []).map((section) => (
          <DuplicateGroupCard
            key={section.title}
            section={section}
            groups={getByPath(mappedData, section.dataPath, []) || []}
          />
        ))}
      </div>

      <div className="chart-card" style={{ marginTop: "20px" }}>
        <div className="tax-table-filter-row">
          <input
            className="tax-table-search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search customer or PAN..."
          />

          <select
            className="tax-table-select"
            value={selectedWht}
            onChange={(event) => setSelectedWht(event.target.value)}
          >
            <option value="ALL">All WHT Types</option>
            {whtOptions.map((wht) => (
              <option key={wht} value={wht}>
                {wht}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="tax-table-clear-btn"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        <div className="chart-header">
          <div>
            <div className="chart-title">{taxComplianceConfig.table.title}</div>
            <div className="chart-subtitle">
              {taxComplianceConfig.table.subtitle}
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
                          <span className="tax-bp-value">{cellValue}</span>
                        </td>
                      );
                    }

                    if (column.key === "gstin") {
                      return (
                        <td key={column.key}>
                          <span className="tax-table-badge tax-badge-red">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "recon_account") {
                      return (
                        <td key={column.key}>
                          <span className="tax-table-badge tax-badge-grey">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (
                      column.key === "tax_type" ||
                      column.key === "wht_code"
                    ) {
                      return (
                        <td key={column.key}>
                          <span className="tax-muted-value">{cellValue}</span>
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
            No matching tax compliance records available.
          </div>
        )}
      </div>
    </div>
  );
}

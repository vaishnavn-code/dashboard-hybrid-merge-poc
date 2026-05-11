import React, { useMemo, useState } from "react";
import { customerMasterPageConfig } from "../configs/customerMasterPage.config";
import { mapCustomerMasterPage } from "../mappers/customerMasterPageMapper";
import KpiCard from "../components/ui/KpiCard";
import { getByPath } from "../utils/getByPath";

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
                {group.rows.map((row, index) => (
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

export default function CustomerMaster({ data }) {
  const [searchText, setSearchText] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [selectedWht, setSelectedWht] = useState("ALL");
  const mappedData = mapCustomerMasterPage(data);
  const summary = mappedData.summary || {};

  const tableRows =
    getByPath(mappedData, customerMasterPageConfig.table.dataPath, []) || [];

  const columns = customerMasterPageConfig.table.columns;

  const regionOptions = useMemo(() => {
    return Array.from(
      new Set(
        tableRows
          .map((row) => row.region)
          .filter((value) => value && value !== "--"),
      ),
    ).sort();
  }, [tableRows]);

  const whtOptions = useMemo(() => {
    return Array.from(
      new Set(
        tableRows
          .map((row) => row.wht_category)
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
        String(row.customer_acct || "")
          .toLowerCase()
          .includes(search) ||
        String(row.name || "")
          .toLowerCase()
          .includes(search) ||
        String(row.city || "")
          .toLowerCase()
          .includes(search);

      const matchesRegion =
        selectedRegion === "ALL" || row.region === selectedRegion;

      const matchesWht =
        selectedWht === "ALL" || row.wht_category === selectedWht;

      return matchesSearch && matchesRegion && matchesWht;
    });
  }, [tableRows, searchText, selectedRegion, selectedWht]);

  const clearFilters = () => {
    setSearchText("");
    setSelectedRegion("ALL");
    setSelectedWht("ALL");
  };

  return (
    <div>
      <div className="section-label">
        {customerMasterPageConfig.sectionLabel}
      </div>

      <div className="customer-master-info-box">
        <span>
          Customer Master contains{" "}
          <strong>{summary.totalBps} Business Partners</strong> across{" "}
          <strong>{summary.statesCovered} states</strong>.{" "}
          <strong>{summary.withBank}</strong> customers have bank accounts
          registered. <strong>{summary.gstinCompliant}</strong> are GSTIN
          compliant.
        </span>
      </div>

      <div className="customer-master-chip-row">
        {summary.chips.map((chip) => (
          <div className="customer-master-chip" key={chip.label}>
            <strong>{chip.value}</strong> {chip.label}
          </div>
        ))}
      </div>

      <div className="four-col">
        {customerMasterPageConfig.kpis.map((item) => (
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

      <div className="section-label" style={{ marginTop: "20px" }}>
        Duplicate Analysis
      </div>

      <div
        className="two-col"
        style={{ marginBottom: "16px", alignItems: "start" }}
      >
        {customerMasterPageConfig.duplicateSections
          .slice(0, 2)
          .map((section) => (
            <DuplicateGroupCard
              key={section.title}
              section={section}
              groups={getByPath(mappedData, section.dataPath, []) || []}
            />
          ))}
      </div>

      <div
        className="two-col"
        style={{ marginBottom: "16px", alignItems: "start" }}
      >
        {(customerMasterPageConfig.duplicateSections || [])
          .slice(2, 4)
          .map((section) => (
            <DuplicateGroupCard
              key={section.title}
              section={section}
              groups={getByPath(mappedData, section.dataPath, []) || []}
            />
          ))}
      </div>

      <div className="chart-card" style={{ marginTop: "20px" }}>
        <div className="customer-table-filter-row">
          <input
            className="customer-table-search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search BP, Name, City..."
          />

          <select
            className="customer-table-select"
            value={selectedRegion}
            onChange={(event) => setSelectedRegion(event.target.value)}
          >
            <option value="ALL">All Regions</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <select
            className="customer-table-select customer-table-select-wide"
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
            className="customer-table-clear-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
        <div className="chart-header">
          <div>
            <div className="chart-title">
              {customerMasterPageConfig.table.title}
            </div>
            <div className="chart-subtitle">
              {customerMasterPageConfig.table.subtitle}
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
                          <span className="cm-bp-value">{cellValue}</span>
                        </td>
                      );
                    }

                    if (column.key === "bp_type") {
                      return (
                        <td key={column.key}>
                          <span className="cm-table-badge cm-badge-grey">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "wht_category") {
                      return (
                        <td key={column.key}>
                          <span className="cm-table-badge cm-badge-blue">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "withholding_subj") {
                      return (
                        <td key={column.key}>
                          <span className="cm-table-badge cm-badge-grey">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "gstin") {
                      return (
                        <td key={column.key}>
                          <span className="cm-table-badge cm-badge-red">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "bank") {
                      const isYes = String(cellValue).toLowerCase() === "yes";

                      return (
                        <td key={column.key}>
                          <span
                            className={`cm-table-badge ${
                              isYes ? "cm-badge-green" : "cm-badge-grey"
                            }`}
                          >
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "recon_acct" || column.key === "name") {
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
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 && (
          <div style={{ padding: "20px", color: "#6a7280" }}>
            No matching customer master records available.
          </div>
        )}
      </div>
    </div>
  );
}

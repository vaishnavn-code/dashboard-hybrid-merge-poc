import React, { useEffect, useMemo, useState } from "react";
import { vendorMasterPageConfig } from "../configs/vendorMasterPage.config";
import { mapVendorMasterPage } from "../mappers/vendorMasterPageMapper";
import KpiCard from "../components/ui/KpiCard";
import { getByPath } from "../utils/getByPath";

function DuplicateGroupCard({ section, groups }) {
  const totalVendors = groups.reduce(
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
          {groups.length} groups | {totalVendors} vendors
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
              <span className="dup-group-cnt">{group.count} vendors</span>
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

const valueBadgeColors = [
  "cm-badge-blue",
  "cm-badge-green",
  "cm-badge-purple",
  "cm-badge-orange",
  "cm-badge-teal",
  "cm-badge-pink",
  "cm-badge-indigo",
];

function buildValueColorMap(rows, keys) {
  const colorMap = {};
  let colorIndex = 0;

  keys.forEach((key) => {
    const uniqueValues = Array.from(
      new Set(
        rows.map((row) => row[key]).filter((value) => value && value !== "--"),
      ),
    );

    uniqueValues.forEach((value) => {
      const mapKey = `${key}:${value}`;

      if (!colorMap[mapKey]) {
        colorMap[mapKey] =
          valueBadgeColors[colorIndex % valueBadgeColors.length];
        colorIndex += 1;
      }
    });
  });

  return colorMap;
}

export default function VendorMaster({ data }) {
  const [searchText, setSearchText] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [selectedTds, setSelectedTds] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const mappedData = mapVendorMasterPage(data);
  const summary = mappedData.summary || {};

  const tableRows =
    getByPath(mappedData, vendorMasterPageConfig.table.dataPath, []) || [];

  const columns = vendorMasterPageConfig.table.columns;

  const regionOptions = useMemo(() => {
    return Array.from(
      new Set(
        tableRows
          .map((row) => row.region)
          .filter((value) => value && value !== "--"),
      ),
    ).sort();
  }, [tableRows]);

  const tdsOptions = useMemo(() => {
    return Array.from(
      new Set(
        tableRows
          .map((row) => row.tds_desc || row.tds_code)
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
        String(row.vendor_acct || "")
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

      const rowTds = row.tds_desc || row.tds_code || "--";

      const matchesTds = selectedTds === "ALL" || rowTds === selectedTds;

      return matchesSearch && matchesRegion && matchesTds;
    });
  }, [tableRows, searchText, selectedRegion, selectedTds]);

  const valueColorMap = useMemo(() => {
    return buildValueColorMap(filteredRows, [
      "tds_desc",
      "tds_code",
      "gstin",
      "recon_acct",
    ]);
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedRegion, selectedTds]);

  const clearFilters = () => {
    setSearchText("");
    setSelectedRegion("ALL");
    setSelectedTds("ALL");
  };

  return (
    <div>
      <div className="section-label">{vendorMasterPageConfig.sectionLabel}</div>

      <div className="customer-master-info-box">
        <span>
          Vendor Master contains{" "}
          <strong>{summary.totalBps} Business Partners</strong> across{" "}
          <strong>{summary.statesCovered} states</strong>.{" "}
          <strong>{summary.withBank}</strong> vendors have bank accounts
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
        {vendorMasterPageConfig.kpis.map((item) => (
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
        {vendorMasterPageConfig.duplicateSections.slice(0, 2).map((section) => (
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
        {(vendorMasterPageConfig.duplicateSections || [])
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
            value={selectedTds}
            onChange={(event) => setSelectedTds(event.target.value)}
          >
            <option value="ALL">All TDS Types</option>
            {tdsOptions.map((tds) => (
              <option key={tds} value={tds}>
                {tds}
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
              {vendorMasterPageConfig.table.title}
            </div>
            <div className="chart-subtitle">
              {vendorMasterPageConfig.table.subtitle}
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

                    if (column.key === "bp_type") {
                      return (
                        <td key={column.key}>
                          <span className="cm-table-badge cm-badge-grey">
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (
                      column.key === "tds_desc" ||
                      column.key === "tds_code"
                    ) {
                      const badgeClass =
                        cellValue === "--"
                          ? "cm-badge-grey"
                          : valueColorMap[`${column.key}:${cellValue}`] ||
                            "cm-badge-grey";

                      return (
                        <td key={column.key}>
                          <span
                            className={`cm-table-badge cm-value-badge ${badgeClass}`}
                          >
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
                      const badgeClass =
                        cellValue === "--"
                          ? "cm-badge-grey"
                          : valueColorMap[`gstin:${cellValue}`] ||
                            "cm-badge-grey";

                      return (
                        <td key={column.key}>
                          <span
                            className={`cm-table-badge cm-value-badge ${badgeClass}`}
                          >
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

                    if (column.key === "recon_acct") {
                      const badgeClass =
                        cellValue === "--"
                          ? "cm-badge-grey"
                          : valueColorMap[`recon_acct:${cellValue}`] ||
                            "cm-badge-grey";

                      return (
                        <td key={column.key}>
                          <span
                            className={`cm-table-badge cm-value-badge ${badgeClass}`}
                          >
                            {cellValue}
                          </span>
                        </td>
                      );
                    }

                    if (column.key === "name") {
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

        {filteredRows.length > 0 && (
          <div className="table-pagination">
            <div className="table-pagination-info">
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredRows.length)} of{" "}
              {filteredRows.length} records
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

import React from "react";
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
  const mappedData = mapCustomerMasterPage(data);
  const summary = mappedData.summary || {};

  const tableRows =
    getByPath(mappedData, customerMasterPageConfig.table.dataPath, []) || [];

  const columns = customerMasterPageConfig.table.columns;

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
            badge={item.badge}
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
          .slice(0, 2)
          .map((section) => (
            <DuplicateGroupCard
              key={section.title}
              section={section}
              groups={getByPath(mappedData, section.dataPath, []) || []}
            />
          ))}
      </div>

      <div className="chart-card" style={{ marginTop: "20px" }}>
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
              {tableRows.map((row, index) => (
                <tr key={`${row.bp_no || "row"}-${index}`}>
                  {columns.map((column) => (
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

        {tableRows.length === 0 && (
          <div style={{ padding: "20px", color: "#6a7280" }}>
            No customer master records available.
          </div>
        )}
      </div>
    </div>
  );
}

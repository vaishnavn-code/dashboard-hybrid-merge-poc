import React from "react";
import { taxComplianceConfig } from "../configs/taxCompliance.config";
import { mapTaxCompliancePage } from "../mappers/taxComplianceMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";

function DuplicateGroupCard({ section, groups }) {
  const totalCustomers = groups.reduce(
    (sum, group) => sum + Number(group.count || 0),
    0
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

export default function TaxCompliance({ data }) {
  const mappedData = mapTaxCompliancePage(data);

  const tableRows =
    getByPath(mappedData, taxComplianceConfig.table.dataPath, []) || [];

  const columns = taxComplianceConfig.table.columns;

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
            badge={item.badge}
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

      <div className="two-col" style={{ marginBottom: "16px", alignItems: "start" }}>
        {(taxComplianceConfig.duplicateSections || []).map((section) => (
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
            No tax compliance records available.
          </div>
        )}
      </div>
    </div>
  );
}
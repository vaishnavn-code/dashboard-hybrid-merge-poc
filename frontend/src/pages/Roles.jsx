import React, { useMemo, useState } from "react";
import { rolesConfig } from "../configs/dashboards/roles.config";
import { mapRoles } from "../mappers/rolesMapper";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import DataTable from "../components/ui/DataTable";
import { getByPath } from "../utils/getByPath";

export default function Roles({ data }) {
  const mappedData = mapRoles(data);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const tableRows = getByPath(mappedData, rolesConfig.table.dataPath, []);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return tableRows.slice(start, start + PAGE_SIZE);
  }, [tableRows, page]);

  const totalPages = Math.ceil(tableRows.length / PAGE_SIZE);

  return (
    <div>
      <div className="section-label">{rolesConfig.sectionLabel}</div>

      <div className="two-col">
        {rolesConfig.charts.map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}
      </div>

      <div className="chart-card" style={{ marginTop: 20 }}>
        <div className="card-title">{rolesConfig.table.title}</div>

        <DataTable
          columns={rolesConfig.table.columns}
          rows={paginatedRows}
          total={tableRows.length}
          page={page}
          totalPages={totalPages}
          onPage={(p) => setPage(Number(p))}
          sortBy={null}
          sortDir={null}
          onSort={() => {}}
          loading={false}
        />
      </div>
    </div>
  );
}
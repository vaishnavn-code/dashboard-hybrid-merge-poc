import React, { useMemo, useState } from "react";
import { tcodeConfig } from "../configs/dashboards/tcode.config";
import { mapTcode } from "../mappers/tcodeMapper";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import DataTable from "../components/ui/DataTable";
import { getByPath } from "../utils/getByPath";

export default function TCode({ data }) {
  const mappedData = mapTcode(data);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const tableRows = getByPath(mappedData, tcodeConfig.table.dataPath, []);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return tableRows.slice(start, start + PAGE_SIZE);
  }, [tableRows, page]);

  const totalPages = Math.ceil(tableRows.length / PAGE_SIZE);

  return (
    <div>
      <div className="section-label">{tcodeConfig.sectionLabel}</div>

      <div className="two-col">
        {tcodeConfig.charts.map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}
      </div>

      <div className="chart-card" style={{ marginTop: 20 }}>
        <div className="card-title">{tcodeConfig.table.title}</div>

        <DataTable
          columns={tcodeConfig.table.columns}
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
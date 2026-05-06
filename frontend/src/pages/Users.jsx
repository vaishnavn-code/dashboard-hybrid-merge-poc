import React, { useMemo, useState } from "react";
import { usersConfig } from "../configs/dashboards/users.config";
import { mapUsers } from "../mappers/usersMapper";
import KpiCard from "../components/ui/KpiCard";
import DataTable from "../components/ui/DataTable";
import { getByPath } from "../utils/getByPath";

export default function Users({ data }) {
  const mappedData = mapUsers(data);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const tableRows = getByPath(mappedData, usersConfig.table.dataPath, []);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return tableRows.slice(start, start + PAGE_SIZE);
  }, [tableRows, page]);

  const totalPages = Math.ceil(tableRows.length / PAGE_SIZE);

  return (
    <div>
      <div className="section-label">{usersConfig.sectionLabel}</div>

      <div className="four-col">
        {usersConfig.kpis.map((item) => (
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

      <div className="chart-card" style={{ marginTop: 20 }}>
        <div className="card-title">{usersConfig.table.title}</div>

        <DataTable
          columns={usersConfig.table.columns}
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

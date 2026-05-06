export function mapUsers(rawData) {
  const usersRaw = rawData?.users || {};
  const kpi = usersRaw?.kpi || {};
  const table = usersRaw?.table || [];

  return {
    kpis: {
      activeUsers: {
        title: Number(kpi?.Active_Users?.Title || 0),
        subtitle: kpi?.Active_Users?.Subtitle || "",
        footer: kpi?.Active_Users?.Footer || "",
      },
      inactiveUsers: {
        title: Number(kpi?.Inactive_Users?.Title || 0),
        subtitle: kpi?.Inactive_Users?.Subtitle || "",
        footer: kpi?.Inactive_Users?.Footer || "",
      },
      dialogUsers: {
        title: Number(kpi?.Dialog_Users?.Title || 0),
        subtitle: kpi?.Dialog_Users?.Subtitle || "",
        footer: kpi?.Dialog_Users?.Footer || "",
      },
      systemService: {
        title: Number(kpi?.System_Service?.Title || 0),
        subtitle: kpi?.System_Service?.Subtitle || "",
        footer: kpi?.System_Service?.Footer || "",
      },
    },

    tableData: table.map((item, index) => ({
      id: index + 1,
      uid: item.uid || "-",
      name: item.name || "-",
      status: item.status || "-",
      type: item.type || "-",
      validFrom: item.valid_from || "-",
      validTo: item.valid_to || "-",
      roleCount: Number(item.role_count || 0),
    })),
  };
}
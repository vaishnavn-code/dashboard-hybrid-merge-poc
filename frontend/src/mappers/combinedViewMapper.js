export function mapCombinedView(rawData) {
  const combinedRaw = rawData?.combined_view || {};
  const kpi = combinedRaw?.kpi || {};
  const charts = combinedRaw?.charts || {};

  const accessVsUsage = Object.entries(charts?.["Access vs Usage"] || {}).map(
    ([user, item]) => ({
      name: user,
      opening: Number(item?.ROLES_ASSIGNED || 0),
      closing: Number(item?.TCODE_ACCESS || 0),
      eir: Number(item?.AUDIT_EVENT || 0),
    })
  );

  const rolesVsAudit = Object.entries(charts?.["Roles Vs Audit"] || {}).map(
    ([user, item]) => ({
      name: user,
      roles: Number(item?.Roles || 0),
      audit: Number(item?.Audit || 0),
    })
  );

  const tcodePerUser = Object.entries(charts?.["Tcode per User"] || {}).map(
    ([name, value]) => ({
      name,
      value: Number(value || 0),
    })
  );

  const tableData = Object.entries(charts?.["Access vs Usage"] || {}).map(
    ([user, item], index) => ({
      id: index + 1,
      user,
      auditEvents: Number(item?.AUDIT_EVENT || 0),
      rolesAssigned: Number(item?.ROLES_ASSIGNED || 0),
      tcodeAccess: Number(item?.TCODE_ACCESS || 0),
    })
  );

  return {
    kpis: {
      highRiskUsers: {
        title: kpi?.High_Risk_Users?.Title || "",
        subtitle: kpi?.High_Risk_Users?.Subtitle || "",
        footer: kpi?.High_Risk_Users?.Footer || "",
      },
      usersAudit: {
        title: kpi?.Users_Audit?.Title || "",
        subtitle: kpi?.Users_Audit?.Subtitle || "",
        footer: kpi?.Users_Audit?.Footer || "",
      },
      avgTcode: {
        title: kpi?.Avg_Tcode?.Title || "",
        subtitle: kpi?.Avg_Tcode?.Subtitle || "",
        footer: kpi?.Avg_Tcode?.Footer || "",
      },
      crossMapping: {
        title: kpi?.Cross_Mapping?.Title || "",
        subtitle: kpi?.Cross_Mapping?.Subtitle || "",
        footer: kpi?.Cross_Mapping?.Footer || "",
      },
    },

    accessVsUsage,
    rolesVsAudit,
    tcodePerUser,
    tableData,
  };
}
export function mapOverview(rawData) {
  const overviewRaw = rawData?.overview || {};

  const kpi = overviewRaw?.kpi || {};
  const charts = overviewRaw?.charts || {};

  // KPI mapping
  const mappedKpis = {
    totalUsers: {
      title: Number(kpi?.Total_Users?.Title || 0),
      subtitle: kpi?.Total_Users?.Subtitle || "",
      footer: kpi?.Total_Users?.Footer || "",
    },
    roleAssignment: {
      title: Number(kpi?.Role_Assignment?.Title || 0),
      subtitle: kpi?.Role_Assignment?.Subtitle || "",
      footer: kpi?.Role_Assignment?.Footer || "",
    },
    uniqueTcodes: {
      title: Number(kpi?.Unique_Tcodes?.Title || 0),
      subtitle: kpi?.Unique_Tcodes?.Subtitle || "",
      footer: kpi?.Unique_Tcodes?.Footer || "",
    },
    auditEvents: {
      title: Number(kpi?.Audit_Events?.Title || 0),
      subtitle: kpi?.Audit_Events?.Subtitle || "",
      footer: kpi?.Audit_Events?.Footer || "",
    },
  };

  // Chart mappings

  const dailyAuditActivity =
  charts?.["Daily Audit Activity"]?.values?.map((item) => ({
    name: item.date,
    opening: Number(item.audit_events || 0) * 10000000,
    closing: Number(item.unique_tcodes || 0) * 10000000,
    eir: Number(item.unique_users || 0),
  })) || [];

  const topUsers =
  charts?.["Top Users by Audit Activity"]?.values?.map((item) => ({
    name: item.name,
    value: Number(item.value || 0),
  })) || [];

  const activityByBusinessGroup =
  charts?.["Activity by Business Group"]?.values || [];

  const userStatus =
    charts?.["User Account Status"]?.values || [];

  const topTcodes =
    charts?.["Most Executed T-Codes"]?.values || [];

  return {
    kpis: mappedKpis,
    dailyAuditActivity,
    topUsers,
    userStatus,
    topTcodes,
    activityByBusinessGroup
  };
}